package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.AssignmentDto;
import com.trustreview.dto.ClassroomWorkspaceDto;
import com.trustreview.dto.CourseRoomDto;
import com.trustreview.dto.CourseRoomStudentDto;
import com.trustreview.dto.CreateAssignmentRequest;
import com.trustreview.dto.CreateCourseRoomRequest;
import com.trustreview.dto.JoinCourseRoomRequest;
import com.trustreview.model.User;
import com.trustreview.security.PeerityUserDetails;
import com.trustreview.service.AssignmentService;
import com.trustreview.service.CourseRoomService;
import com.trustreview.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/classrooms")
public class CourseRoomController {

    private final CourseRoomService courseRoomService;
    private final AssignmentService assignmentService;
    private final ReviewService reviewService;

    public CourseRoomController(CourseRoomService courseRoomService,
                                AssignmentService assignmentService,
                                ReviewService reviewService) {
        this.courseRoomService = courseRoomService;
        this.assignmentService = assignmentService;
        this.reviewService = reviewService;
    }

    /**
     * POST /api/classrooms — INSTRUCTOR / ADMIN only
     * Creates an isolated course room with an auto-generated 6-character join code.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<CourseRoomDto> createClassroom(
            @Valid @RequestBody CreateCourseRoomRequest request,
            Authentication auth) {
        User instructor = PeerityUserDetails.requireUser(auth);
        CourseRoomDto created = courseRoomService.createRoom(request, instructor);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * POST /api/classrooms/join — STUDENT only
     * Enrolls the student into the classroom using the 6-character join code.
     */
    @PostMapping("/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<CourseRoomDto> joinClassroom(
            @Valid @RequestBody JoinCourseRoomRequest request,
            Authentication auth) {
        User student = PeerityUserDetails.requireUser(auth);
        CourseRoomDto joined = courseRoomService.joinRoom(request, student);
        return ResponseEntity.ok(joined);
    }

    /**
     * GET /api/classrooms — Authenticated
     * Returns classrooms tailored to the user's role:
     * - INSTRUCTOR: rooms created by them
     * - STUDENT: rooms they have joined
     * - ADMIN / COMMITTEE: all rooms
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CourseRoomDto>> listClassrooms(Authentication auth) {
        User user = PeerityUserDetails.requireUser(auth);
        List<CourseRoomDto> rooms = courseRoomService.getRoomsForUser(user);
        return ResponseEntity.ok(rooms);
    }

    /**
     * GET /api/classrooms/{id} — Authenticated
     * Strict Room-Level Access Guard:
     * - Enrolled student, owning instructor, or ADMIN: 200 OK
     * - Outsider: 403 Forbidden
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CourseRoomDto> getClassroom(
            @PathVariable String id,
            Authentication auth) {
        User user = PeerityUserDetails.requireUser(auth);
        CourseRoomDto room = courseRoomService.getRoomById(id, user);
        return ResponseEntity.ok(room);
    }

    /**
     * GET /api/classrooms/{id}/workspace — Authenticated
     * Complete dedicated Google Classroom-style workspace view with strict room isolation.
     * Non-enrolled students and unauthorized instructors get 403 Forbidden.
     */
    @GetMapping("/{id}/workspace")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ClassroomWorkspaceDto> getClassroomWorkspace(
            @PathVariable String id,
            Authentication auth) {
        User user = PeerityUserDetails.requireUser(auth);
        ClassroomWorkspaceDto ws = courseRoomService.getRoomWorkspace(id, user);
        return ResponseEntity.ok(ws);
    }

    /**
     * POST /api/classrooms/{id}/assignments — INSTRUCTOR / ADMIN only
     * Creates an assignment scoped exclusively to this classroom.
     */
    @PostMapping("/{id}/assignments")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<AssignmentDto> createClassroomAssignment(
            @PathVariable String id,
            @Valid @RequestBody CreateAssignmentRequest req,
            Authentication auth) {
        User instructor = PeerityUserDetails.requireUser(auth);
        req.setCourseRoomId(id);
        AssignmentDto created = assignmentService.create(req, instructor);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * POST /api/classrooms/{id}/distribute — INSTRUCTOR / ADMIN only
     * Distributes anonymous double-blind peer reviews strictly scoped to submissions in this classroom.
     */
    @PostMapping("/{id}/distribute")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> distributeReviews(
            @PathVariable String id,
            @RequestParam(value = "assignmentId", required = false) String assignmentId,
            @RequestParam(value = "reviewerCount", defaultValue = "2") int reviewerCount,
            Authentication auth) {
        User instructor = PeerityUserDetails.requireUser(auth);
        Map<String, Object> result;
        if (assignmentId != null && !assignmentId.isBlank()) {
            result = reviewService.distribute(assignmentId, reviewerCount, instructor, id);
        } else {
            result = reviewService.distributeForClassroom(id, reviewerCount, instructor);
        }
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/classrooms/{id}/students — INSTRUCTOR / ADMIN
     * Returns the enrolled student roster. Only the room's instructor or an ADMIN can view.
     */
    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<List<CourseRoomStudentDto>> getEnrolledStudents(
            @PathVariable String id,
            Authentication auth) {
        User requester = PeerityUserDetails.requireUser(auth);
        List<CourseRoomStudentDto> students = courseRoomService.getRoomStudents(id, requester);
        return ResponseEntity.ok(students);
    }

    /**
     * DELETE /api/classrooms/{id}/students/{studentId} — INSTRUCTOR / ADMIN
     * Removes an enrolled student from the course room, revoking their access immediately (403 Forbidden).
     */
    @DeleteMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse> removeStudent(
            @PathVariable String id,
            @PathVariable String studentId,
            Authentication auth) {
        User requester = PeerityUserDetails.requireUser(auth);
        courseRoomService.removeStudent(id, studentId, requester);
        return ResponseEntity.ok(new ApiResponse(true, "Student removed from course room."));
    }
}
