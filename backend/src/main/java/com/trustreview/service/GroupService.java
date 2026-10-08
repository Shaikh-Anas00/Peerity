package com.trustreview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustreview.dto.*;
import com.trustreview.model.*;
import com.trustreview.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Business logic for Group Formation and Group Member Evaluation.
 *
 * ── Attribution / Privacy boundary ─────────────────────────────────────────
 *
 *   getMyAggregateEvaluation()  →  student view
 *     • Returns: averaged scores per criterion only
 *     • Feedback text suppressed unless ≥ 3 evaluations received (k-anonymity)
 *     • Evaluator id/name NEVER included in return value
 *
 *   getAllEvaluations()          →  instructor/admin view
 *     • Returns full attributed records (evaluatorId, evaluatorName)
 *     • Every call is audit-logged with actor email, group id, IP address
 *
 * ────────────────────────────────────────────────────────────────────────────
 */
@Service
public class GroupService {

    private static final Logger log = LoggerFactory.getLogger(GroupService.class);

    /** Minimum number of evaluations required before feedback text is disclosed to the evaluatee. */
    public static final int FEEDBACK_K_ANONYMITY_FLOOR = 3;

    /** Standard criteria for group member evaluation. */
    public static final List<String> EVALUATION_CRITERIA =
            List.of("Contribution", "Communication", "Reliability", "Teamwork");

    private final GroupRepository groupRepository;
    private final GroupMembershipRepository membershipRepository;
    private final GroupMemberEvaluationRepository evaluationRepository;
    private final GroupFormationSurveyRepository surveyRepository;
    private final GroupFormationResponseRepository responseRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final AuditLedgerService auditLedgerService;
    private final ObjectMapper objectMapper;

    public GroupService(GroupRepository groupRepository,
                        GroupMembershipRepository membershipRepository,
                        GroupMemberEvaluationRepository evaluationRepository,
                        GroupFormationSurveyRepository surveyRepository,
                        GroupFormationResponseRepository responseRepository,
                        AssignmentRepository assignmentRepository,
                        UserRepository userRepository,
                        AuditLedgerService auditLedgerService,
                        ObjectMapper objectMapper) {
        this.groupRepository = groupRepository;
        this.membershipRepository = membershipRepository;
        this.evaluationRepository = evaluationRepository;
        this.surveyRepository = surveyRepository;
        this.responseRepository = responseRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.auditLedgerService = auditLedgerService;
        this.objectMapper = objectMapper;
    }

    // ── Group CRUD ────────────────────────────────────────────────────────────

    @Transactional
    public GroupDto createGroup(CreateGroupRequest request, User creator, String clientIp) {
        Group group = new Group();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setStatus(GroupStatus.FORMING);

        if (request.getAssignmentId() != null && !request.getAssignmentId().isBlank()) {
            Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                    .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + request.getAssignmentId()));
            group.setAssignment(assignment);
        }

        group = groupRepository.save(group);

        // Creator becomes the group leader automatically
        GroupMembership leadership = new GroupMembership();
        leadership.setGroup(group);
        leadership.setUser(creator);
        leadership.setRole(MembershipRole.LEADER);
        leadership.setStatus(MembershipStatus.ACTIVE);
        membershipRepository.save(leadership);

        auditLedgerService.logEvent(
                "GROUP_CREATED", creator.getEmail(), "Group", group.getId(),
                "Group '" + group.getName() + "' created by " + creator.getEmail(), clientIp);

        return toDto(group);
    }

    @Transactional(readOnly = true)
    public List<GroupDto> getAllGroups(String assignmentId) {
        List<Group> groups;
        if (assignmentId != null && !assignmentId.isBlank()) {
            groups = groupRepository.findByAssignmentId(assignmentId);
        } else {
            groups = groupRepository.findAllByOrderByCreatedAtDesc();
        }
        return groups.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GroupDto> getMyGroups(String userId) {
        return membershipRepository.findByUserIdAndStatus(userId, MembershipStatus.ACTIVE)
                .stream()
                .map(m -> toDto(m.getGroup()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GroupMemberDto> getGroupMembers(String groupId) {
        if (!groupRepository.existsById(groupId)) {
            throw new IllegalArgumentException("Group not found: " + groupId);
        }
        return membershipRepository.findByGroupId(groupId)
                .stream()
                .map(GroupMemberDto::from)
                .collect(Collectors.toList());
    }

    // ── Membership management ────────────────────────────────────────────────

    @Transactional
    public void joinGroup(String groupId, User user, String clientIp) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));

        if (group.getStatus() == GroupStatus.CLOSED) {
            throw new IllegalStateException("This group is closed and no longer accepting members.");
        }

        if (membershipRepository.findByGroupIdAndUserId(groupId, user.getId()).isPresent()) {
            throw new IllegalStateException("You are already a member of this group.");
        }

        GroupMembership membership = new GroupMembership();
        membership.setGroup(group);
        membership.setUser(user);
        membership.setRole(MembershipRole.MEMBER);
        membership.setStatus(MembershipStatus.PENDING);
        membershipRepository.save(membership);

        auditLedgerService.logEvent(
                "GROUP_JOIN_REQUEST", user.getEmail(), "Group", group.getId(),
                user.getEmail() + " requested to join group '" + group.getName() + "'", clientIp);
    }

    @Transactional
    public void approveMember(String groupId, String userId, User actor, String clientIp) {
        GroupMembership membership = membershipRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Membership not found for user " + userId + " in group " + groupId));

        membership.setStatus(MembershipStatus.ACTIVE);
        membershipRepository.save(membership);

        auditLedgerService.logEvent(
                "GROUP_MEMBER_APPROVED", actor.getEmail(), "Group", groupId,
                actor.getEmail() + " approved user " + userId + " into group " + groupId, clientIp);
    }

    @Transactional
    public void removeMember(String groupId, String userId, User actor, String clientIp) {
        GroupMembership membership = membershipRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Membership not found for user " + userId + " in group " + groupId));

        membershipRepository.delete(membership);

        auditLedgerService.logEvent(
                "GROUP_MEMBER_REMOVED", actor.getEmail(), "Group", groupId,
                actor.getEmail() + " removed user " + userId + " from group " + groupId, clientIp);
    }

    // ── Evaluation — STUDENT view (aggregate, anonymised) ───────────────────

    /**
     * Returns aggregate (averaged) scores per criterion for the given student.
     *
     * PRIVACY RULE — evaluator identity is NEVER included in this response.
     * Feedback text is withheld when fewer than FEEDBACK_K_ANONYMITY_FLOOR evaluations
     * have been received, to prevent re-identification via unique phrasing.
     *
     * @param groupId   the group the student belongs to
     * @param userId    the ID of the student requesting their own aggregate
     * @return anonymised aggregate DTO — safe to expose to the evaluated student
     */
    @Transactional(readOnly = true)
    public GroupMemberEvaluationDto getMyAggregateEvaluation(String groupId, String userId) {
        if (!groupRepository.existsById(groupId)) {
            throw new IllegalArgumentException("Group not found: " + groupId);
        }

        List<GroupMemberEvaluation> evaluations =
                evaluationRepository.findByGroupIdAndEvaluateeId(groupId, userId);

        GroupMemberEvaluationDto dto = new GroupMemberEvaluationDto();
        dto.setEvaluateeId(userId);
        dto.setEvaluationCount(evaluations.size());

        if (evaluations.isEmpty()) {
            dto.setAggregateScores(Collections.emptyMap());
            dto.setFeedbackDisclosed(false);
            dto.setFeedbackDisclosureMessage("No evaluations received yet.");
            return dto;
        }

        // Average each criterion across all evaluations
        Map<String, Double> totals = new LinkedHashMap<>();
        int parsedCount = 0;
        for (GroupMemberEvaluation eval : evaluations) {
            try {
                Map<String, Integer> scores = objectMapper.readValue(
                        eval.getScores(), new TypeReference<Map<String, Integer>>() {});
                for (Map.Entry<String, Integer> entry : scores.entrySet()) {
                    totals.merge(entry.getKey(), entry.getValue().doubleValue(), Double::sum);
                }
                parsedCount++;
            } catch (Exception e) {
                log.warn("Could not parse scores for evaluation {}: {}", eval.getId(), e.getMessage());
            }
        }

        Map<String, Double> aggregates = new LinkedHashMap<>();
        final int finalCount = parsedCount > 0 ? parsedCount : 1;
        totals.forEach((k, v) -> aggregates.put(k, Math.round((v / finalCount) * 10.0) / 10.0));
        dto.setAggregateScores(aggregates);

        // k-anonymity: withhold feedback text until >= FEEDBACK_K_ANONYMITY_FLOOR evaluations
        if (evaluations.size() >= FEEDBACK_K_ANONYMITY_FLOOR) {
            List<String> feedbackItems = evaluations.stream()
                    .map(GroupMemberEvaluation::getFeedback)
                    .filter(f -> f != null && !f.isBlank())
                    .collect(Collectors.toList());
            dto.setFeedbackItems(feedbackItems);
            dto.setFeedbackDisclosed(true);
        } else {
            dto.setFeedbackDisclosed(false);
            dto.setFeedbackDisclosureMessage(
                    "Written feedback will be disclosed once at least " +
                    FEEDBACK_K_ANONYMITY_FLOOR + " peers have evaluated you. (" +
                    evaluations.size() + "/" + FEEDBACK_K_ANONYMITY_FLOOR + " received)");
        }

        return dto;
    }

    // ── Evaluation — INSTRUCTOR/ADMIN view (full attribution, audit logged) ──

    /**
     * Returns all evaluations in a group with full evaluator attribution.
     *
     * ACCOUNTABILITY RULE — this method is for instructors and admins only.
     * Every call is recorded in the tamper-evident audit ledger with actor identity,
     * group ID, timestamp, and IP address.
     *
     * @param groupId   the group whose evaluations to retrieve
     * @param actor     the authenticated instructor or admin making the request
     * @param clientIp  the resolved client IP (from ClientIpResolver)
     * @return list of full attributed evaluation DTOs
     */
    @Transactional
    public List<GroupMemberEvaluationAdminDto> getAllEvaluations(String groupId, User actor, String clientIp) {
        if (!groupRepository.existsById(groupId)) {
            throw new IllegalArgumentException("Group not found: " + groupId);
        }

        auditLedgerService.logEvent(
                "VIEW_ATTRIBUTED_EVALUATIONS", actor.getEmail(), "Group", groupId,
                actor.getEmail() + " accessed full attributed peer evaluations for group " + groupId, clientIp);

        return evaluationRepository.findByGroupId(groupId)
                .stream()
                .map(GroupMemberEvaluationAdminDto::from)
                .collect(Collectors.toList());
    }

    // ── Evaluation — submit ───────────────────────────────────────────────────

    @Transactional
    public void submitEvaluation(SubmitGroupEvaluationRequest request, User evaluator, String clientIp) {
        Group group = groupRepository.findById(request.getGroupId())
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + request.getGroupId()));

        User evaluatee = userRepository.findById(request.getEvaluateeId())
                .orElseThrow(() -> new IllegalArgumentException("Evaluatee not found: " + request.getEvaluateeId()));

        if (evaluator.getId().equals(evaluatee.getId())) {
            throw new IllegalArgumentException("You cannot evaluate yourself.");
        }

        // Prevent duplicate evaluations (one per evaluator-evaluatee pair per group)
        boolean exists = evaluationRepository
                .existsByGroupIdAndEvaluatorIdAndEvaluateeId(group.getId(), evaluator.getId(), evaluatee.getId());
        if (exists) {
            throw new IllegalStateException("You have already submitted an evaluation for this team member.");
        }

        // Validate that the evaluatee is actually an active member of this group
        boolean evaluateeIsMember = membershipRepository
                .findByGroupIdAndUserId(group.getId(), evaluatee.getId())
                .map(m -> m.getStatus() == MembershipStatus.ACTIVE)
                .orElse(false);
        if (!evaluateeIsMember) {
            throw new IllegalArgumentException("The specified user is not an active member of this group.");
        }

        GroupMemberEvaluation evaluation = new GroupMemberEvaluation();
        evaluation.setGroup(group);
        evaluation.setEvaluator(evaluator);
        evaluation.setEvaluatee(evaluatee);
        evaluation.setScores(request.getScores());
        evaluation.setFeedback(request.getFeedback());
        GroupMemberEvaluation saved = evaluationRepository.save(evaluation);

        auditLedgerService.logEvent(
                "GROUP_EVALUATION_SUBMITTED", evaluator.getEmail(), "GroupMemberEvaluation", saved.getId(),
                evaluator.getEmail() + " evaluated " + evaluatee.getEmail() + " in group '" + group.getName() + "'",
                clientIp);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private GroupDto toDto(Group group) {
        List<GroupMembership> memberships = membershipRepository.findByGroupId(group.getId());
        long activeCount = memberships.stream()
                .filter(m -> m.getStatus() == MembershipStatus.ACTIVE)
                .count();
        long pendingCount = memberships.stream()
                .filter(m -> m.getStatus() == MembershipStatus.PENDING)
                .count();

        GroupDto dto = new GroupDto();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setStatus(group.getStatus().name());
        dto.setAssignmentId(group.getAssignment() != null ? group.getAssignment().getId() : null);
        dto.setAssignmentTitle(group.getAssignment() != null ? group.getAssignment().getTitle() : null);
        dto.setActiveMemberCount((int) activeCount);
        dto.setPendingMemberCount((int) pendingCount);
        dto.setCreatedAt(group.getCreatedAt() != null ? group.getCreatedAt().toString() : null);
        return dto;
    }
}
