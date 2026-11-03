package com.trustreview.service;

import com.trustreview.dto.AssignmentDto;
import com.trustreview.dto.CreateAssignmentRequest;
import com.trustreview.model.Assignment;
import com.trustreview.model.CourseRoom;
import com.trustreview.model.Role;
import com.trustreview.model.User;
import com.trustreview.repository.AssignmentRepository;
import com.trustreview.repository.CourseRoomEnrollmentRepository;
import com.trustreview.repository.CourseRoomRepository;
import com.trustreview.repository.SubmissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final CourseRoomRepository courseRoomRepository;
    private final CourseRoomEnrollmentRepository enrollmentRepository;

    @Autowired
    public AssignmentService(AssignmentRepository assignmentRepository,
                             SubmissionRepository submissionRepository,
                             CourseRoomRepository courseRoomRepository,
                             CourseRoomEnrollmentRepository enrollmentRepository) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.courseRoomRepository = courseRoomRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    public AssignmentService(AssignmentRepository assignmentRepository,
                             SubmissionRepository submissionRepository) {
        this(assignmentRepository, submissionRepository, null, null);
    }

    @Transactional
    public AssignmentDto create(CreateAssignmentRequest req, User creator) {
        if (req.getReviewDeadline() != null && req.getDeadline() != null && req.getReviewDeadline().isBefore(req.getDeadline())) {
            throw new IllegalArgumentException("Review deadline cannot be before submission deadline.");
        }

        String rubricJson;
        if (req.getRubric() != null && !req.getRubric().isEmpty()) {
            rubricJson = RubricSupport.toJson(RubricSupport.normalize(req.getRubric()));
        } else if (req.getRubricCriteria() != null && !req.getRubricCriteria().isBlank()) {
            if (RubricSupport.parse(req.getRubricCriteria()).isEmpty()) {
                throw new IllegalArgumentException("At least one rubric criterion is required.");
            }
            rubricJson = req.getRubricCriteria().trim();
        } else {
            throw new IllegalArgumentException("Rubric criteria are required.");
        }

        CourseRoom room = null;
        if (req.getCourseRoomId() != null && !req.getCourseRoomId().isBlank() && courseRoomRepository != null) {
            room = courseRoomRepository.findById(req.getCourseRoomId())
                    .orElseThrow(() -> new IllegalArgumentException("Course room not found: " + req.getCourseRoomId()));
            boolean isOwner = room.getInstructor() != null && room.getInstructor().getId().equals(creator.getId());
            if (!isOwner && creator.getRole() != Role.ADMIN) {
                throw new SecurityException("You do not have permission to create assignments in this course room.");
            }
        }

        Assignment a = new Assignment();
        a.setTitle(req.getTitle());
        a.setDescription(req.getDescription());
        a.setRubricCriteria(rubricJson);
        a.setDeadline(req.getDeadline());
        LocalDateTime revDeadline = req.getReviewDeadline() != null
                ? req.getReviewDeadline()
                : (req.getDeadline() != null ? req.getDeadline().plusDays(7) : null);
        a.setReviewDeadline(revDeadline);
        a.setCreatedBy(creator);
        a.setCourseRoom(room);
        a.setGroupAssignment(Boolean.TRUE.equals(req.getIsGroupAssignment()));

        Assignment saved = assignmentRepository.save(a);
        AssignmentDto dto = AssignmentDto.from(saved, false);
        dto.setSubmissionCount(0L);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> findAll(User currentUser) {
        List<Assignment> allAssignments = assignmentRepository.findAllByOrderByCreatedAtDesc();

        List<Assignment> assignments;
        if (currentUser == null) {
            assignments = allAssignments.stream()
                    .filter(a -> a.getCourseRoom() == null)
                    .collect(Collectors.toList());
        } else if (currentUser.getRole() == Role.ADMIN) {
            assignments = allAssignments;
        } else if (currentUser.getRole() == Role.INSTRUCTOR) {
            assignments = allAssignments.stream()
                    .filter(a -> a.getCourseRoom() == null ||
                            (a.getCourseRoom().getInstructor() != null && a.getCourseRoom().getInstructor().getId().equals(currentUser.getId())))
                    .collect(Collectors.toList());
        } else if (currentUser.getRole() == Role.STUDENT && enrollmentRepository != null) {
            Set<String> enrolledRoomIds = enrollmentRepository.findByStudentOrderByEnrolledAtDesc(currentUser).stream()
                    .map(e -> e.getCourseRoom().getId())
                    .collect(Collectors.toSet());
            assignments = allAssignments.stream()
                    .filter(a -> a.getCourseRoom() == null || enrolledRoomIds.contains(a.getCourseRoom().getId()))
                    .collect(Collectors.toList());
        } else {
            assignments = allAssignments.stream()
                    .filter(a -> a.getCourseRoom() == null)
                    .collect(Collectors.toList());
        }

        Set<String> submittedAssignmentIds = Collections.emptySet();
        if (currentUser != null && currentUser.getRole() == Role.STUDENT) {
            submittedAssignmentIds = submissionRepository.findByAuthorOrderBySubmittedAtDesc(currentUser)
                    .stream()
                    .filter(s -> s.getAssignment() != null)
                    .map(s -> s.getAssignment().getId())
                    .collect(Collectors.toSet());
        }

        final Set<String> finalSubmittedIds = submittedAssignmentIds;
        return assignments.stream()
                .map(a -> {
                    AssignmentDto dto = AssignmentDto.from(a, finalSubmittedIds.contains(a.getId()));
                    dto.setSubmissionCount(submissionRepository.countByAssignment(a));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> findAll() {
        return findAll(null);
    }

    @Transactional(readOnly = true)
    public Optional<AssignmentDto> findById(String id, User currentUser) {
        return assignmentRepository.findById(id).map(a -> {
            if (a.getCourseRoom() != null) {
                if (currentUser == null) {
                    throw new SecurityException("Authentication required to view this classroom assignment.");
                }
                boolean isAdmin = currentUser.getRole() == Role.ADMIN;
                boolean isOwner = a.getCourseRoom().getInstructor() != null &&
                        a.getCourseRoom().getInstructor().getId().equals(currentUser.getId());
                boolean isEnrolled = enrollmentRepository != null &&
                        enrollmentRepository.existsByCourseRoomAndStudent(a.getCourseRoom(), currentUser);

                if (!isAdmin && !isOwner && !isEnrolled) {
                    throw new SecurityException("You do not have access to this classroom assignment.");
                }
            }

            boolean hasSubmitted = false;
            if (currentUser != null && currentUser.getRole() == Role.STUDENT) {
                hasSubmitted = submissionRepository.existsByAuthorAndAssignment(currentUser, a);
            }
            AssignmentDto dto = AssignmentDto.from(a, hasSubmitted);
            dto.setSubmissionCount(submissionRepository.countByAssignment(a));
            return dto;
        });
    }

    @Transactional(readOnly = true)
    public List<AssignmentDto> findByCourseRoom(CourseRoom room, User currentUser) {
        List<Assignment> assignments = assignmentRepository.findByCourseRoomOrderByCreatedAtDesc(room);
        Set<String> submittedAssignmentIds = Collections.emptySet();
        if (currentUser != null && currentUser.getRole() == Role.STUDENT) {
            submittedAssignmentIds = submissionRepository.findByAuthorOrderBySubmittedAtDesc(currentUser)
                    .stream()
                    .filter(s -> s.getAssignment() != null)
                    .map(s -> s.getAssignment().getId())
                    .collect(Collectors.toSet());
        }

        final Set<String> finalSubmittedIds = submittedAssignmentIds;
        return assignments.stream()
                .map(a -> {
                    AssignmentDto dto = AssignmentDto.from(a, finalSubmittedIds.contains(a.getId()));
                    dto.setSubmissionCount(submissionRepository.countByAssignmentAndCourseRoom(a, room));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<AssignmentDto> findById(String id) {
        return findById(id, null);
    }

    @Transactional(readOnly = true)
    public Optional<Assignment> findEntityById(String id) {
        return assignmentRepository.findById(id);
    }
}
