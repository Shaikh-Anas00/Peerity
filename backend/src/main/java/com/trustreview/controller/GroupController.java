package com.trustreview.controller;

import com.trustreview.dto.*;
import com.trustreview.model.User;
import com.trustreview.repository.UserRepository;
import com.trustreview.service.GroupService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * REST controller for Group Formation and Group Member Evaluation.
 *
 * Authorization boundary (hard rule — enforced by @PreAuthorize on every method):
 *
 *   /api/groups/{id}/evaluations/my-aggregate  → STUDENT only (aggregate, no evaluator names)
 *   /api/groups/{id}/evaluations/all           → INSTRUCTOR, ADMIN only (full attribution, audit logged)
 *   COMMITTEE → 403 on the /all endpoint intentionally (accountability via audit, not grievance access)
 */
@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final UserRepository userRepository;
    private final ClientIpResolver clientIpResolver;

    public GroupController(GroupService groupService,
                           UserRepository userRepository,
                           ClientIpResolver clientIpResolver) {
        this.groupService = groupService;
        this.userRepository = userRepository;
        this.clientIpResolver = clientIpResolver;
    }

    private User resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
            .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    /** POST /api/groups — INSTRUCTOR or ADMIN creates a group */
    @PostMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<GroupDto> createGroup(@RequestBody CreateGroupRequest request,
                                                Authentication auth,
                                                HttpServletRequest req) {
        User user = resolveUser(auth);
        String ip = clientIpResolver.resolveClientIp(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.createGroup(request, user, ip));
    }

    /** GET /api/groups — INSTRUCTOR or ADMIN lists all groups */
    @GetMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<List<GroupDto>> getAllGroups(@RequestParam(required = false) String assignmentId) {
        return ResponseEntity.ok(groupService.getAllGroups(assignmentId));
    }

    /** GET /api/groups/my — any authenticated user sees their own groups */
    @GetMapping("/my")
    public ResponseEntity<List<GroupDto>> getMyGroups(Authentication auth) {
        User user = resolveUser(auth);
        return ResponseEntity.ok(groupService.getMyGroups(user.getId()));
    }

    /** POST /api/groups/{groupId}/join — STUDENT joins a group (goes to PENDING until approved) */
    @PostMapping("/{groupId}/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse> joinGroup(@PathVariable String groupId,
                                                 Authentication auth,
                                                 HttpServletRequest req) {
        User user = resolveUser(auth);
        String ip = clientIpResolver.resolveClientIp(req);
        try {
            groupService.joinGroup(groupId, user, ip);
            return ResponseEntity.ok(new ApiResponse(true, "Join request submitted."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse(false, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /** GET /api/groups/{groupId}/members — authenticated users see members of a group */
    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMemberDto>> getGroupMembers(@PathVariable String groupId) {
        try {
            return ResponseEntity.ok(groupService.getGroupMembers(groupId));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /** POST /api/groups/{groupId}/members/{userId}/approve — INSTRUCTOR or ADMIN approves a pending member */
    @PostMapping("/{groupId}/members/{userId}/approve")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse> approveMember(@PathVariable String groupId,
                                                     @PathVariable String userId,
                                                     Authentication auth,
                                                     HttpServletRequest req) {
        User actor = resolveUser(auth);
        String ip = clientIpResolver.resolveClientIp(req);
        try {
            groupService.approveMember(groupId, userId, actor, ip);
            return ResponseEntity.ok(new ApiResponse(true, "Member approved."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /** DELETE /api/groups/{groupId}/members/{userId} — INSTRUCTOR or ADMIN removes a member */
    @DeleteMapping("/{groupId}/members/{userId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse> removeMember(@PathVariable String groupId,
                                                    @PathVariable String userId,
                                                    Authentication auth,
                                                    HttpServletRequest req) {
        User actor = resolveUser(auth);
        String ip = clientIpResolver.resolveClientIp(req);
        try {
            groupService.removeMember(groupId, userId, actor, ip);
            return ResponseEntity.ok(new ApiResponse(true, "Member removed."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * POST /api/groups/{groupId}/evaluations — STUDENT submits a peer evaluation.
     * The evaluator identity is stored server-side but NEVER returned to the evaluated student.
     */
    @PostMapping("/{groupId}/evaluations")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse> submitEvaluation(@PathVariable String groupId,
                                                        @RequestBody SubmitGroupEvaluationRequest request,
                                                        Authentication auth,
                                                        HttpServletRequest req) {
        request.setGroupId(groupId);
        User evaluator = resolveUser(auth);
        String ip = clientIpResolver.resolveClientIp(req);
        try {
            groupService.submitEvaluation(request, evaluator, ip);
            return ResponseEntity.ok(new ApiResponse(true, "Evaluation submitted."));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse(false, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * GET /api/groups/{groupId}/evaluations/my-aggregate — STUDENT views aggregate scores only.
     *
     * PRIVACY GUARANTEE: This endpoint NEVER exposes evaluator identities.
     * Feedback text is withheld if fewer than 3 evaluations have been received (k-anonymity floor).
     */
    @GetMapping("/{groupId}/evaluations/my-aggregate")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<GroupMemberEvaluationDto> getMyAggregateEvaluation(
            @PathVariable String groupId, Authentication auth) {
        User user = resolveUser(auth);
        try {
            return ResponseEntity.ok(groupService.getMyAggregateEvaluation(groupId, user.getId()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * GET /api/groups/{groupId}/evaluations/all — INSTRUCTOR and ADMIN only.
     *
     * Returns FULL attributed evaluations including evaluator names.
     * Every access is audit-logged for accountability (who viewed what, when, from where).
     * COMMITTEE is intentionally excluded — they have quorum voting rights on appeals,
     * not grievance investigation rights over individual performance data.
     */
    @GetMapping("/{groupId}/evaluations/all")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<List<GroupMemberEvaluationAdminDto>> getAllEvaluations(
            @PathVariable String groupId,
            Authentication auth,
            HttpServletRequest req) {
        User actor = resolveUser(auth);
        String ip = clientIpResolver.resolveClientIp(req);
        try {
            return ResponseEntity.ok(groupService.getAllEvaluations(groupId, actor, ip));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }
}
