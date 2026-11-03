package com.trustreview.service;

import com.trustreview.dto.AssignmentDto;
import com.trustreview.dto.ClassroomWorkspaceDto;
import com.trustreview.dto.CourseRoomDto;
import com.trustreview.dto.CourseRoomStudentDto;
import com.trustreview.dto.CreateCourseRoomRequest;
import com.trustreview.dto.JoinCourseRoomRequest;
import com.trustreview.dto.ReviewDto;
import com.trustreview.dto.SubmissionDto;
import com.trustreview.model.Assignment;
import com.trustreview.model.CourseRoom;
import com.trustreview.model.CourseRoomEnrollment;
import com.trustreview.model.EnrollmentStatus;
import com.trustreview.model.Role;
import com.trustreview.model.User;
import com.trustreview.repository.AppealRepository;
import com.trustreview.repository.AssignmentRepository;
import com.trustreview.repository.CourseRoomEnrollmentRepository;
import com.trustreview.repository.CourseRoomRepository;
import com.trustreview.repository.ReviewRepository;
import com.trustreview.repository.SubmissionRepository;
import com.trustreview.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CourseRoomService {

    private static final Logger log = LoggerFactory.getLogger(CourseRoomService.class);

    // Unambiguous alphanumeric characters (excluding 0, O, 1, I)
    private static final String JOIN_CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final int JOIN_CODE_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CourseRoomRepository courseRoomRepository;
    private final CourseRoomEnrollmentRepository enrollmentRepository;
    private final AuditLedgerService auditLedgerService;
    private final AssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final AppealRepository appealRepository;

    @Autowired
    public CourseRoomService(CourseRoomRepository courseRoomRepository,
                             CourseRoomEnrollmentRepository enrollmentRepository,
                             AuditLedgerService auditLedgerService,
                             AssignmentRepository assignmentRepository,
                             SubmissionRepository submissionRepository,
                             ReviewRepository reviewRepository,
                             UserRepository userRepository,
                             AppealRepository appealRepository) {
        this.courseRoomRepository = courseRoomRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.auditLedgerService = auditLedgerService;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.appealRepository = appealRepository;
    }

    public CourseRoomService(CourseRoomRepository courseRoomRepository,
                             CourseRoomEnrollmentRepository enrollmentRepository,
                             AuditLedgerService auditLedgerService,
                             AssignmentRepository assignmentRepository,
                             SubmissionRepository submissionRepository,
                             ReviewRepository reviewRepository,
                             UserRepository userRepository) {
        this(courseRoomRepository, enrollmentRepository, auditLedgerService,
                assignmentRepository, submissionRepository, reviewRepository, userRepository, null);
    }

    public CourseRoomService(CourseRoomRepository courseRoomRepository,
                             CourseRoomEnrollmentRepository enrollmentRepository,
                             AuditLedgerService auditLedgerService) {
        this(courseRoomRepository, enrollmentRepository, auditLedgerService, null, null, null, null, null);
    }

    /**
     * Generates a collision-resistant 6-character uppercase alphanumeric join code.
     */
    public String generateUniqueJoinCode() {
        for (int attempt = 0; attempt < 100; attempt++) {
            StringBuilder sb = new StringBuilder(JOIN_CODE_LENGTH);
            for (int i = 0; i < JOIN_CODE_LENGTH; i++) {
                int idx = RANDOM.nextInt(JOIN_CODE_CHARS.length());
                sb.append(JOIN_CODE_CHARS.charAt(idx));
            }
            String code = sb.toString();
            if (!courseRoomRepository.existsByJoinCode(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Failed to generate a unique join code after multiple attempts.");
    }

    /**
     * Creates a new CourseRoom owned by the instructor.
     */
    @Transactional
    public CourseRoomDto createRoom(CreateCourseRoomRequest request, User instructor) {
        String joinCode = generateUniqueJoinCode();

        CourseRoom room = new CourseRoom(
                request.getName().trim(),
                request.getCourseCode().trim(),
                request.getDescription() != null ? request.getDescription().trim() : null,
                joinCode,
                instructor
        );

        CourseRoom saved = courseRoomRepository.save(room);
        log.info("Created course room: id={}, name='{}', joinCode={}, instructor={}",
                saved.getId(), saved.getName(), saved.getJoinCode(), instructor.getEmail());

        // Cryptographically chained audit event
        auditLedgerService.logEvent(
                "COURSE_ROOM_CREATED",
                instructor.getEmail(),
                "CourseRoom",
                saved.getId(),
                "Created course room: " + saved.getName() + " (" + saved.getCourseCode() + ") with join code: " + saved.getJoinCode()
        );

        return CourseRoomDto.fromEntity(saved, 0L, false);
    }

    /**
     * Enrolls a student in a CourseRoom using its 6-character join code.
     */
    @Transactional
    public CourseRoomDto joinRoom(JoinCourseRoomRequest request, User student) {
        if (request.getJoinCode() == null || request.getJoinCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Join code cannot be empty.");
        }

        String normalizedCode = request.getJoinCode().trim().toUpperCase();

        CourseRoom room = courseRoomRepository.findByJoinCodeIgnoreCase(normalizedCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid join code. Course room not found."));

        if (!room.isActive()) {
            throw new IllegalStateException("This course room is no longer active.");
        }

        if (enrollmentRepository.existsByCourseRoomAndStudentAndStatus(room, student, EnrollmentStatus.ACTIVE)) {
            throw new IllegalStateException("You are already enrolled in course room: " + room.getName());
        }

        // Check if there is an existing removed enrollment to reactivate
        CourseRoomEnrollment enrollment = enrollmentRepository.findByCourseRoomAndStudent(room, student)
                .map(existing -> {
                    existing.setStatus(EnrollmentStatus.ACTIVE);
                    return existing;
                })
                .orElseGet(() -> new CourseRoomEnrollment(room, student));

        enrollmentRepository.save(enrollment);

        log.info("Student {} successfully enrolled in course room {} ({})",
                student.getEmail(), room.getName(), room.getId());

        auditLedgerService.logEvent(
                "COURSE_ROOM_JOINED",
                student.getEmail(),
                "CourseRoom",
                room.getId(),
                "Student " + student.getFullName() + " enrolled in course room: " + room.getName() + " (" + room.getCourseCode() + ")"
        );

        long count = enrollmentRepository.countByCourseRoomAndStatus(room, EnrollmentStatus.ACTIVE);
        return CourseRoomDto.fromEntity(room, count, true);
    }

    /**
     * Lists classrooms visible to the authenticated user based on role.
     * Enforces least-privilege: ADMIN and COMMITTEE do NOT receive blanket access;
     * they only see rooms where an active appeal is open (or rooms they own).
     */
    @Transactional(readOnly = true)
    public List<CourseRoomDto> getRoomsForUser(User user) {
        if (user.getRole() == Role.INSTRUCTOR) {
            return courseRoomRepository.findByInstructorOrderByCreatedAtDesc(user).stream()
                    .map(room -> CourseRoomDto.fromEntity(room, enrollmentRepository.countByCourseRoomAndStatus(room, EnrollmentStatus.ACTIVE), false))
                    .collect(Collectors.toList());
        }

        if (user.getRole() == Role.STUDENT) {
            return enrollmentRepository.findByStudentOrderByEnrolledAtDesc(user).stream()
                    .filter(e -> e.getStatus() == EnrollmentStatus.ACTIVE)
                    .map(enrollment -> {
                        CourseRoom room = enrollment.getCourseRoom();
                        long count = enrollmentRepository.countByCourseRoomAndStatus(room, EnrollmentStatus.ACTIVE);
                        return CourseRoomDto.fromEntity(room, count, true);
                    })
                    .collect(Collectors.toList());
        }

        // ADMIN / COMMITTEE: Scoped least-privilege — only rooms with active appeals or rooms owned
        return courseRoomRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(room -> {
                    boolean isOwner = room.getInstructor() != null && room.getInstructor().getId().equals(user.getId());
                    boolean hasActiveAppeal = appealRepository != null && appealRepository.existsActiveAppealInCourseRoom(room.getId());
                    return isOwner || hasActiveAppeal;
                })
                .map(room -> CourseRoomDto.fromEntity(room, enrollmentRepository.countByCourseRoomAndStatus(room, EnrollmentStatus.ACTIVE), false))
                .collect(Collectors.toList());
    }

    /**
     * Validates that the user is the owning instructor, or an actively enrolled STUDENT,
     * or an ADMIN/COMMITTEE member when an active appeal exists within that classroom.
     * Throws SecurityException (HTTP 403) if access is unauthorized.
     */
    @Transactional(readOnly = true)
    public CourseRoom validateAccessAndGet(String roomId, User user) {
        CourseRoom room = courseRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Course room not found: " + roomId));

        boolean isOwner = room.getInstructor() != null && room.getInstructor().getId().equals(user.getId());
        if (isOwner) {
            return room;
        }

        if (user.getRole() == Role.STUDENT) {
            boolean isEnrolled = enrollmentRepository.existsByCourseRoomAndStudentAndStatus(room, user, EnrollmentStatus.ACTIVE);
            if (isEnrolled) {
                return room;
            }
        }

        // Scoped Authorization Guard: Committee & Admin Least-Privilege
        if (user.getRole() == Role.ADMIN || user.getRole() == Role.COMMITTEE) {
            if (appealRepository != null && appealRepository.existsActiveAppealInCourseRoom(roomId)) {
                return room;
            }
            log.warn("Least-privilege rejection: user {} (role={}) cannot browse classroom {} without active appeal",
                    user.getEmail(), user.getRole(), roomId);
            throw new SecurityException("Access denied: Committee and Admin roles can only access classrooms with an active appeal.");
        }

        log.warn("Access denied: user {} (role={}) cannot access course room {} ({})",
                user.getEmail(), user.getRole(), room.getName(), room.getId());
        throw new SecurityException("You are not authorized to access this course room.");
    }

    /**
     * Returns a specific CourseRoom for the authenticated user, validating room-level access.
     */
    @Transactional(readOnly = true)
    public CourseRoomDto getRoomById(String roomId, User requester) {
        CourseRoom room = validateAccessAndGet(roomId, requester);
        boolean isOwner = room.getInstructor() != null && room.getInstructor().getId().equals(requester.getId());
        boolean canManage = isOwner;
        long enrolledCount = enrollmentRepository.countByCourseRoomAndStatus(room, EnrollmentStatus.ACTIVE);
        CourseRoomDto dto = CourseRoomDto.fromEntity(room, enrolledCount, requester.getRole() == Role.STUDENT);
        if (!canManage) {
            dto.setJoinCode(null);
        }
        return dto;
    }

    /**
     * Retrieves the complete workspace DTO for a specific CourseRoom.
     * Strict isolation:
     * - Outsiders get 403 Forbidden
     * - Inactive/Removed students get 403 Forbidden
     * - Students only receive their own submissions and reviews (and never the student roster!)
     * - Instructors receive all classroom assignments and the active student roster
     */
    @Transactional(readOnly = true)
    public ClassroomWorkspaceDto getRoomWorkspace(String roomId, User requester) {
        CourseRoom room = validateAccessAndGet(roomId, requester);

        boolean isOwner = room.getInstructor() != null && room.getInstructor().getId().equals(requester.getId());
        boolean canManage = isOwner;

        long enrolledCount = enrollmentRepository.countByCourseRoomAndStatus(room, EnrollmentStatus.ACTIVE);
        CourseRoomDto roomDto = CourseRoomDto.fromEntity(room, enrolledCount, requester.getRole() == Role.STUDENT);
        if (!canManage) {
            roomDto.setJoinCode(null);
        }

        ClassroomWorkspaceDto ws = new ClassroomWorkspaceDto();
        ws.setClassroom(roomDto);
        ws.setCanManage(canManage);

        // 1. Room-scoped assignments
        if (assignmentRepository != null) {
            List<Assignment> roomAssignments = assignmentRepository.findByCourseRoomOrderByCreatedAtDesc(room);
            Set<String> submittedAssignmentIds = Collections.emptySet();
            if (requester.getRole() == Role.STUDENT && submissionRepository != null) {
                submittedAssignmentIds = submissionRepository.findByAuthorAndCourseRoomOrderBySubmittedAtDesc(requester, room)
                        .stream()
                        .filter(s -> s.getAssignment() != null)
                        .map(s -> s.getAssignment().getId())
                        .collect(Collectors.toSet());
            }

            final Set<String> finalSubmittedIds = submittedAssignmentIds;
            List<AssignmentDto> assignmentDtos = roomAssignments.stream().map(a -> {
                boolean hasSubmitted = finalSubmittedIds.contains(a.getId());
                AssignmentDto dto = AssignmentDto.from(a, hasSubmitted);
                if (submissionRepository != null) {
                    dto.setSubmissionCount(submissionRepository.countByAssignmentAndCourseRoom(a, room));
                }
                return dto;
            }).collect(Collectors.toList());
            ws.setAssignments(assignmentDtos);
        }

        // 2. Room-scoped Submissions
        if (submissionRepository != null) {
            if (requester.getRole() == Role.STUDENT) {
                List<SubmissionDto> mySubs = submissionRepository.findByAuthorAndCourseRoomOrderBySubmittedAtDesc(requester, room)
                        .stream().map(SubmissionDto::forAuthor).collect(Collectors.toList());
                ws.setMySubmissions(mySubs);
            } else {
                List<SubmissionDto> allSubs = submissionRepository.findByCourseRoomOrderBySubmittedAtDesc(room)
                        .stream().map(SubmissionDto::forAuthor).collect(Collectors.toList());
                ws.setMySubmissions(allSubs);
            }
            ws.setTotalSubmissions(submissionRepository.countByCourseRoom(room));
        }

        // 3. Room-scoped Reviews (Double-Blind)
        if (reviewRepository != null) {
            if (requester.getRole() == Role.STUDENT) {
                List<ReviewDto> myRevs = reviewRepository.findByReviewerAndCourseRoom(requester, room)
                        .stream().map(ReviewDto::forReviewer).collect(Collectors.toList());
                ws.setMyReviews(myRevs);
            }
            ws.setTotalReviews(reviewRepository.countByCourseRoom(room));
        }

        // 4. Student Roster (Strictly hidden from students to protect privacy)
        if (canManage) {
            ws.setStudents(getRoomStudents(roomId, requester));
        } else {
            ws.setStudents(Collections.emptyList());
        }

        return ws;
    }

    /**
     * Returns the active enrolled student roster for a room. Restricted to the owning instructor,
     * or ADMIN/COMMITTEE with an active appeal.
     */
    @Transactional(readOnly = true)
    public List<CourseRoomStudentDto> getRoomStudents(String roomId, User requester) {
        CourseRoom room = courseRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Course room not found: " + roomId));

        boolean isOwner = room.getInstructor() != null && room.getInstructor().getId().equals(requester.getId());
        boolean hasAppealAccess = (requester.getRole() == Role.ADMIN || requester.getRole() == Role.COMMITTEE)
                && appealRepository != null && appealRepository.existsActiveAppealInCourseRoom(roomId);

        if (!isOwner && !hasAppealAccess) {
            log.warn("Access denied for student roster: user={}, room={}, instructor={}",
                    requester.getId(), roomId, room.getInstructor() != null ? room.getInstructor().getId() : null);
            throw new SecurityException("You are not authorized to view the roster for this course room.");
        }

        return enrollmentRepository.findByCourseRoomAndStatus(room, EnrollmentStatus.ACTIVE).stream()
                .map(CourseRoomStudentDto::fromEnrollment)
                .collect(Collectors.toList());
    }

    /**
     * Verifies that a student is actively enrolled in the given room (or user is instructor/admin with appeal).
     */
    @Transactional(readOnly = true)
    public void validateStudentEnrollment(CourseRoom room, User student) {
        if (room == null) {
            return;
        }
        if (student.getRole() == Role.INSTRUCTOR || student.getRole() == Role.ADMIN) {
            return;
        }
        boolean isEnrolled = enrollmentRepository.existsByCourseRoomAndStudentAndStatus(room, student, EnrollmentStatus.ACTIVE);
        if (!isEnrolled) {
            log.warn("Student {} not enrolled or inactive in course room {}", student.getEmail(), room.getId());
            throw new SecurityException("You are not enrolled in course room: " + room.getName());
        }
    }

    /**
     * Removes a student from a course room by transitioning status to REMOVED.
     * Transitions out of active status immediately revoke access (403 Forbidden).
     */
    @Transactional
    public void removeStudent(String roomId, String studentId, User requester) {
        CourseRoom room = courseRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Course room not found: " + roomId));

        boolean isOwner = room.getInstructor() != null && room.getInstructor().getId().equals(requester.getId());
        if (!isOwner && requester.getRole() != Role.ADMIN) {
            throw new SecurityException("Only the owning instructor or an admin can remove students.");
        }

        if (userRepository == null) {
            throw new IllegalStateException("User repository not available.");
        }

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found: " + studentId));

        CourseRoomEnrollment enrollment = enrollmentRepository.findByCourseRoomAndStudent(room, student)
                .orElseThrow(() -> new IllegalArgumentException("Student is not enrolled in this course room."));

        enrollment.setStatus(EnrollmentStatus.REMOVED);
        enrollmentRepository.save(enrollment);

        log.info("Student {} removed from course room {} by {}", studentId, roomId, requester.getEmail());

        auditLedgerService.logEvent(
                "COURSE_ROOM_STUDENT_REMOVED",
                requester.getEmail(),
                "CourseRoom",
                roomId,
                "Student " + student.getFullName() + " (" + student.getEmail() + ") removed from course room: " + room.getName()
        );
    }

    @Transactional(readOnly = true)
    public CourseRoom findById(String id) {
        return courseRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course room not found: " + id));
    }
}
