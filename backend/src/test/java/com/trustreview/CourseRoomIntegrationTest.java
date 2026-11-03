package com.trustreview;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustreview.dto.CreateCourseRoomRequest;
import com.trustreview.dto.JoinCourseRoomRequest;
import com.trustreview.model.Assignment;
import com.trustreview.model.CourseRoom;
import com.trustreview.model.Review;
import com.trustreview.model.Role;
import com.trustreview.model.User;
import com.trustreview.repository.AssignmentRepository;
import com.trustreview.repository.CourseRoomEnrollmentRepository;
import com.trustreview.repository.CourseRoomRepository;
import com.trustreview.repository.ReviewRepository;
import com.trustreview.repository.SubmissionRepository;
import com.trustreview.repository.UserRepository;
import com.trustreview.security.PeerityUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("CourseRoom & Join Code — Integration & Isolation Tests")
class CourseRoomIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private CourseRoomRepository courseRoomRepository;

    @Autowired
    private CourseRoomEnrollmentRepository enrollmentRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private com.trustreview.repository.AssignmentPseudonymRepository pseudonymRepository;

    @Autowired
    private com.trustreview.repository.GroupRepository groupRepository;

    @Autowired
    private com.trustreview.repository.GroupMembershipRepository groupMembershipRepository;

    @Autowired
    private com.trustreview.service.GroupService groupService;

    private User instructorA;
    private User instructorB;
    private User studentA;
    private User studentB;
    private User studentC;
    private User studentD;
    private Assignment testAssignment;

    @BeforeEach
    void setUp() {
        instructorA = getOrCreateUser("cr_inst_a@test.edu", "Prof Alpha", Role.INSTRUCTOR);
        instructorB = getOrCreateUser("cr_inst_b@test.edu", "Prof Beta", Role.INSTRUCTOR);
        studentA = getOrCreateUser("cr_stud_a@test.edu", "Student Alice", Role.STUDENT);
        studentB = getOrCreateUser("cr_stud_b@test.edu", "Student Bob", Role.STUDENT);
        studentC = getOrCreateUser("cr_stud_c@test.edu", "Student Charlie", Role.STUDENT);
        studentD = getOrCreateUser("cr_stud_d@test.edu", "Student David", Role.STUDENT);

        if (testAssignment == null || !assignmentRepository.existsById(testAssignment.getId())) {
            Assignment a = new Assignment();
            a.setTitle("Distributed Systems Lab 1");
            a.setDescription("Build Paxos consensus");
            a.setDeadline(LocalDateTime.now().plusDays(5));
            a.setReviewDeadline(LocalDateTime.now().plusDays(10));
            a.setCreatedBy(instructorA);
            a.setRubricCriteria("[{\"id\":\"c1\",\"name\":\"Correctness\",\"maxScore\":10,\"weight\":1.0}]");
            testAssignment = assignmentRepository.save(a);
        }
    }

    private User getOrCreateUser(String email, String name, Role role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User u = new User(email, "hashed_pw", email, role, name, "Computer Science");
            u.setAcademicStanding("Year 3 Undergraduate");
            return userRepository.save(u);
        });
    }

    @Test
    @DisplayName("1. Instructor creates classroom, receives unique 6-char alphanumeric join code")
    void test1_instructorCreatesClassroom() throws Exception {
        CreateCourseRoomRequest request = new CreateCourseRoomRequest(
                "CS-401 Distributed Systems",
                "CS401",
                "Spring 2026 Cohort"
        );

        MvcResult result = mockMvc.perform(post("/api/classrooms")
                        .with(csrf())
                        .with(user(new PeerityUserDetails(instructorA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("CS-401 Distributed Systems"))
                .andExpect(jsonPath("$.courseCode").value("CS401"))
                .andExpect(jsonPath("$.joinCode").isNotEmpty())
                .andReturn();

        Map<?, ?> response = objectMapper.readValue(result.getResponse().getContentAsString(), Map.class);
        String joinCode = (String) response.get("joinCode");

        assertThat(joinCode).isNotNull();
        assertThat(joinCode).hasSize(6);
        assertThat(joinCode).matches("^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$");
        assertThat(joinCode).doesNotContain("0", "O", "1", "I");
    }

    @Test
    @DisplayName("2. Student joins with code (case-insensitive); duplicate join returns 409 Conflict")
    void test2_studentJoinsAndDuplicateReturns409() throws Exception {
        CourseRoom room = new CourseRoom("Algorithms", "CS301", "Fall", "ALG301", instructorA);
        courseRoomRepository.save(room);

        // Student A joins using lower-case code "alg301"
        JoinCourseRoomRequest joinReq = new JoinCourseRoomRequest("alg301");

        mockMvc.perform(post("/api/classrooms/join")
                        .with(csrf())
                        .with(user(new PeerityUserDetails(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Algorithms"))
                .andExpect(jsonPath("$.isEnrolled").value(true));

        assertThat(enrollmentRepository.existsByCourseRoomAndStudent(room, studentA)).isTrue();

        // Duplicate join attempt must return 409 Conflict
        mockMvc.perform(post("/api/classrooms/join")
                        .with(csrf())
                        .with(user(new PeerityUserDetails(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinReq)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("3. Enrolled student uploads submission to classroom successfully (201 Created)")
    void test3_enrolledStudentUploadsToClassroom() throws Exception {
        CourseRoom room = new CourseRoom("Operating Systems", "CS201", "Spring", "OS201X", instructorA);
        courseRoomRepository.save(room);
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentA));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "os_kernel_lab.pdf",
                "application/pdf",
                "%PDF-1.4 Kernel memory management report".getBytes()
        );

        mockMvc.perform(multipart("/api/submissions")
                        .file(file)
                        .param("assignmentId", testAssignment.getId())
                        .param("courseRoomId", room.getId())
                        .with(csrf())
                        .with(user(new PeerityUserDetails(studentA))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFileName").value("os_kernel_lab.pdf"))
                .andExpect(jsonPath("$.courseRoomId").value(room.getId()));
    }

    @Test
    @DisplayName("4. Unenrolled student uploads to classroom and is rejected (403 Forbidden)")
    void test4_unenrolledStudentUploadRejectedWith403() throws Exception {
        CourseRoom room = new CourseRoom("Compiler Design", "CS501", "Spring", "CMP501", instructorA);
        courseRoomRepository.save(room);

        // studentB is NOT enrolled in room CMP501
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "parser.pdf",
                "application/pdf",
                "LR(1) parser implementation".getBytes()
        );

        mockMvc.perform(multipart("/api/submissions")
                        .file(file)
                        .param("assignmentId", testAssignment.getId())
                        .param("courseRoomId", room.getId())
                        .with(csrf())
                        .with(user(new PeerityUserDetails(studentB))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("5. Unauthorized instructor cannot view student roster (403 Forbidden); room owner can (200 OK)")
    void test5_unauthorizedInstructorCannotViewRoster() throws Exception {
        CourseRoom room = new CourseRoom("Networks", "CS302", "Spring", "NET302", instructorA);
        courseRoomRepository.save(room);
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentA));

        // Instructor B (does not own room) attempts to view roster -> 403 Forbidden
        mockMvc.perform(get("/api/classrooms/" + room.getId() + "/students")
                        .with(user(new PeerityUserDetails(instructorB))))
                .andExpect(status().isForbidden());

        // Instructor A (owns room) views roster -> 200 OK with enrolled student details
        mockMvc.perform(get("/api/classrooms/" + room.getId() + "/students")
                        .with(user(new PeerityUserDetails(instructorA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].email").value(studentA.getEmail()))
                .andExpect(jsonPath("$[0].fullName").value(studentA.getFullName()))
                .andExpect(jsonPath("$[0].academicStanding").value("Year 3 Undergraduate"));
    }

    @Test
    @DisplayName("6. Review distribution scoped to CourseRoom assigns strictly among enrolled students")
    void test6_distributeScopedToClassroom() throws Exception {
        Assignment distAssignment = new Assignment();
        distAssignment.setTitle("Database Engines");
        distAssignment.setDescription("B-Tree indices");
        distAssignment.setDeadline(LocalDateTime.now().plusDays(5));
        distAssignment.setReviewDeadline(LocalDateTime.now().plusDays(10));
        distAssignment.setCreatedBy(instructorA);
        distAssignment.setRubricCriteria("[{\"id\":\"c1\",\"name\":\"BTree\",\"maxScore\":10,\"weight\":1.0}]");
        distAssignment = assignmentRepository.save(distAssignment);

        CourseRoom room = new CourseRoom("Database Systems", "CS402", "Spring", "DB402X", instructorA);
        courseRoomRepository.save(room);

        // Enroll Student A, Student C, Student D into the room
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentA));
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentC));
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentD));
        // Student B remains UNENROLLED

        // Student A, C, D submit to this course room
        uploadSubmission(distAssignment, studentA, room.getId(), "submission_a.pdf");
        uploadSubmission(distAssignment, studentC, room.getId(), "submission_c.pdf");
        uploadSubmission(distAssignment, studentD, room.getId(), "submission_d.pdf");

        // Student B submits to same assignment WITHOUT courseRoom (or different room)
        uploadSubmission(distAssignment, studentB, null, "submission_b.pdf");

        // Distribute reviews scoped to courseRoom
        mockMvc.perform(post("/api/assignments/" + distAssignment.getId() + "/distribute")
                        .param("courseRoomId", room.getId())
                        .with(csrf())
                        .with(user(new PeerityUserDetails(instructorA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewerCount\": 2}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submissionsProcessed").value(3))
                .andExpect(jsonPath("$.reviewsCreated").value(6));

        // Verify that reviews for these submissions are strictly assigned among enrolled students A, C, D
        List<com.trustreview.model.Submission> roomSubs = submissionRepository.findByAssignmentAndCourseRoomOrderBySubmittedAtAsc(distAssignment, room);
        assertThat(roomSubs).hasSize(3);

        List<Review> roomReviews = reviewRepository.findBySubmissionIn(roomSubs);
        assertThat(roomReviews).hasSize(6);

        for (Review r : roomReviews) {
            String reviewerId = r.getReviewer().getId();
            // Reviewer must be studentA, studentC, or studentD
            assertThat(reviewerId).isIn(studentA.getId(), studentC.getId(), studentD.getId());
            // Must NEVER be unenrolled studentB
            assertThat(reviewerId).isNotEqualTo(studentB.getId());
        }
    }

    @Test
    @DisplayName("Classroom Workspace & Assignment Isolation — Enrolled Student vs Outsider 403 Forbidden")
    void classroomWorkspaceAndAssignmentIsolation() throws Exception {
        // 1. Instructor creates Classroom A
        CourseRoom roomA = new CourseRoom("Algorithms 101", "CS101", "Data Structures & Algos", "ALG101", instructorA);
        roomA = courseRoomRepository.save(roomA);

        // Enroll Student A into Classroom A
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(roomA, studentA));
        // Student B remains UNENROLLED in Classroom A

        // 2. Instructor creates an assignment inside Classroom A via POST /api/classrooms/{id}/assignments
        var assignReq = new com.trustreview.dto.CreateAssignmentRequest();
        assignReq.setTitle("Binary Search Trees Project");
        assignReq.setDescription("Implement AVL balance");
        assignReq.setDeadline(LocalDateTime.now().plusDays(7));
        assignReq.setReviewDeadline(LocalDateTime.now().plusDays(14));
        assignReq.setRubricCriteria("[{\"id\":\"c1\",\"name\":\"Balance\",\"maxScore\":10,\"weight\":1.0}]");

        MvcResult createRes = mockMvc.perform(post("/api/classrooms/" + roomA.getId() + "/assignments")
                        .with(csrf())
                        .with(user(new PeerityUserDetails(instructorA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(assignReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.courseRoomId").value(roomA.getId()))
                .andReturn();

        String createdAssignId = objectMapper.readTree(createRes.getResponse().getContentAsString()).get("id").asText();

        // 3. Enrolled Student A can view Classroom A workspace (200 OK)
        mockMvc.perform(get("/api/classrooms/" + roomA.getId() + "/workspace")
                        .with(user(new PeerityUserDetails(studentA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classroom.name").value("Algorithms 101"))
                .andExpect(jsonPath("$.assignments[0].id").value(createdAssignId))
                .andExpect(jsonPath("$.students").isEmpty()); // cohort privacy shield: students don't get roster

        // 4. Enrolled Student A can submit to this classroom assignment (201 Created)
        MockMultipartFile fileA = new MockMultipartFile(
                "file", "alice_bst.pdf", "application/pdf", "%PDF-1.4 Alice BST".getBytes()
        );
        mockMvc.perform(multipart("/api/submissions")
                        .file(fileA)
                        .param("assignmentId", createdAssignId)
                        .param("courseRoomId", roomA.getId())
                        .with(csrf())
                        .with(user(new PeerityUserDetails(studentA))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.courseRoomId").value(roomA.getId()));

        // 5. Unenrolled Student B gets 403 Forbidden trying to view Classroom A workspace
        mockMvc.perform(get("/api/classrooms/" + roomA.getId() + "/workspace")
                        .with(user(new PeerityUserDetails(studentB))))
                .andExpect(status().isForbidden());

        // 6. Unenrolled Student B gets 403 Forbidden trying to view Classroom A details
        mockMvc.perform(get("/api/classrooms/" + roomA.getId())
                        .with(user(new PeerityUserDetails(studentB))))
                .andExpect(status().isForbidden());

        // 7. Unenrolled Student B gets 403 Forbidden trying to view Classroom A's assignment directly
        mockMvc.perform(get("/api/assignments/" + createdAssignId)
                        .with(user(new PeerityUserDetails(studentB))))
                .andExpect(status().isForbidden());

        // 8. Unenrolled Student B gets 403 Forbidden trying to submit to Classroom A's assignment
        MockMultipartFile fileB = new MockMultipartFile(
                "file", "bob_bst.pdf", "application/pdf", "%PDF-1.4 Bob BST".getBytes()
        );
        mockMvc.perform(multipart("/api/submissions")
                        .file(fileB)
                        .param("assignmentId", createdAssignId)
                        .with(csrf())
                        .with(user(new PeerityUserDetails(studentB))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("7. Invariant: Removed student transitions to REMOVED and immediately loses access (403 Forbidden)")
    void test7_removedStudentTransitionsToRemovedAndGets403Forbidden() throws Exception {
        CourseRoom room = new CourseRoom("Distributed Algorithms", "CS601", "Spring", "DA601X", instructorA);
        room = courseRoomRepository.save(room);

        // Enroll Student A
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentA));

        // Verify Student A can view workspace (200 OK)
        mockMvc.perform(get("/api/classrooms/" + room.getId() + "/workspace")
                        .with(user(new PeerityUserDetails(studentA))))
                .andExpect(status().isOk());

        // Instructor A removes Student A via DELETE /api/classrooms/{id}/students/{studentId}
        mockMvc.perform(delete("/api/classrooms/" + room.getId() + "/students/" + studentA.getId())
                        .with(csrf())
                        .with(user(new PeerityUserDetails(instructorA))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify enrollment status is now REMOVED
        com.trustreview.model.CourseRoomEnrollment enrollment = enrollmentRepository.findByCourseRoomAndStudent(room, studentA).orElseThrow();
        assertThat(enrollment.getStatus()).isEqualTo(com.trustreview.model.EnrollmentStatus.REMOVED);

        // Removed Student A immediately receives 403 Forbidden on workspace
        mockMvc.perform(get("/api/classrooms/" + room.getId() + "/workspace")
                        .with(user(new PeerityUserDetails(studentA))))
                .andExpect(status().isForbidden());

        // Removed Student A immediately receives 403 Forbidden when attempting to submit
        MockMultipartFile file = new MockMultipartFile(
                "file", "sol.pdf", "application/pdf", "%PDF-1.4 Content".getBytes()
        );
        mockMvc.perform(multipart("/api/submissions")
                        .file(file)
                        .param("assignmentId", testAssignment.getId())
                        .param("courseRoomId", room.getId())
                        .with(csrf())
                        .with(user(new PeerityUserDetails(studentA))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("8. Invariant: Committee & Admin Least-Privilege blocks blanket access when no active appeal exists")
    void test8_adminAndCommitteeLeastPrivilegeWithoutActiveAppeal() throws Exception {
        User adminUser = getOrCreateUser("cr_admin@test.edu", "Admin System", Role.ADMIN);
        CourseRoom room = new CourseRoom("Private Research Lab", "CS999", "Fall", "LAB999", instructorA);
        room = courseRoomRepository.save(room);

        // Admin cannot browse classroom workspace without an active appeal in that room -> 403 Forbidden
        mockMvc.perform(get("/api/classrooms/" + room.getId() + "/workspace")
                        .with(user(new PeerityUserDetails(adminUser))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("9. Invariant: k >= 3 anonymity floor blocks distribution when < 3 distinct submitters (409 Conflict)")
    void test9_k3AnonymityFloorEnforcement() throws Exception {
        CourseRoom room = new CourseRoom("Security Protocols", "CS701", "Spring", "SEC701", instructorA);
        room = courseRoomRepository.save(room);

        // Enroll Student A, B, C
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentA));
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentB));
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentC));

        Assignment secAssign = new Assignment();
        secAssign.setTitle("TLS Handshake Lab");
        secAssign.setDescription("Analyze TLS 1.3 key exchange");
        secAssign.setDeadline(LocalDateTime.now().plusDays(5));
        secAssign.setReviewDeadline(LocalDateTime.now().plusDays(10));
        secAssign.setCreatedBy(instructorA);
        secAssign.setCourseRoom(room);
        secAssign.setRubricCriteria("[{\"id\":\"c1\",\"name\":\"KeyExchange\",\"maxScore\":10,\"weight\":1.0}]");
        secAssign = assignmentRepository.save(secAssign);

        // Only 2 distinct students submit (studentA and studentB)
        uploadSubmission(secAssign, studentA, room.getId(), "tls_alice.pdf");
        uploadSubmission(secAssign, studentB, room.getId(), "tls_bob.pdf");

        // Distribute reviews with only 2 submitters -> must throw 409 Conflict (InsufficientAnonymitySetException)
        mockMvc.perform(post("/api/assignments/" + secAssign.getId() + "/distribute")
                        .param("courseRoomId", room.getId())
                        .with(csrf())
                        .with(user(new PeerityUserDetails(instructorA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewerCount\": 1}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("k >= 3 floor")));

        // Now third student (studentC) submits
        uploadSubmission(secAssign, studentC, room.getId(), "tls_charlie.pdf");

        // Now distribution succeeds (200 OK)
        mockMvc.perform(post("/api/assignments/" + secAssign.getId() + "/distribute")
                        .param("courseRoomId", room.getId())
                        .with(csrf())
                        .with(user(new PeerityUserDetails(instructorA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewerCount\": 1}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submissionsProcessed").value(3));
    }

    @Test
    @DisplayName("10. Invariant: Per-(Student, Assignment) Ephemeral Pseudonyms are stable within assignment, distinct across assignments")
    void test10_perStudentAssignmentEphemeralPseudonyms() throws Exception {
        CourseRoom room = new CourseRoom("Cryptography", "CS801", "Spring", "CRY801", instructorA);
        room = courseRoomRepository.save(room);

        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentA));
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentB));
        enrollmentRepository.save(new com.trustreview.model.CourseRoomEnrollment(room, studentC));

        // Create Assignment 1
        Assignment a1 = new Assignment();
        a1.setTitle("RSA Encryption");
        a1.setDescription("RSA implementation");
        a1.setDeadline(LocalDateTime.now().plusDays(5));
        a1.setReviewDeadline(LocalDateTime.now().plusDays(10));
        a1.setCreatedBy(instructorA);
        a1.setCourseRoom(room);
        a1.setRubricCriteria("[{\"id\":\"c1\",\"name\":\"RSA\",\"maxScore\":10,\"weight\":1.0}]");
        final Assignment savedA1 = assignmentRepository.save(a1);

        uploadSubmission(savedA1, studentA, room.getId(), "rsa_a.pdf");
        uploadSubmission(savedA1, studentB, room.getId(), "rsa_b.pdf");
        uploadSubmission(savedA1, studentC, room.getId(), "rsa_c.pdf");

        // Distribute reviews for A1 (reviewerCount = 2, so each student reviews 2 other submissions)
        mockMvc.perform(post("/api/assignments/" + savedA1.getId() + "/distribute")
                        .param("courseRoomId", room.getId())
                        .with(csrf())
                        .with(user(new PeerityUserDetails(instructorA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewerCount\": 2}"))
                .andExpect(status().isOk());

        // Verify Student A has reviews in A1
        List<com.trustreview.model.Submission> subsA1 = submissionRepository.findByAssignmentOrderBySubmittedAtAsc(savedA1);
        List<Review> a1ReviewsByA = reviewRepository.findBySubmissionIn(subsA1).stream()
                .filter(r -> r.getReviewer().getId().equals(studentA.getId()))
                .toList();

        assertThat(a1ReviewsByA).isNotEmpty();
        String pseudoA1 = a1ReviewsByA.get(0).getReviewerPseudonym();
        // Intra-assignment stability: all reviews by studentA on assignment 1 share the exact same pseudonym
        for (Review r : a1ReviewsByA) {
            assertThat(r.getReviewerPseudonym()).isEqualTo(pseudoA1);
        }

        // Create Assignment 2
        Assignment a2 = new Assignment();
        a2.setTitle("Elliptic Curves");
        a2.setDescription("ECC implementation");
        a2.setDeadline(LocalDateTime.now().plusDays(5));
        a2.setReviewDeadline(LocalDateTime.now().plusDays(10));
        a2.setCreatedBy(instructorA);
        a2.setCourseRoom(room);
        a2.setRubricCriteria("[{\"id\":\"c1\",\"name\":\"ECC\",\"maxScore\":10,\"weight\":1.0}]");
        final Assignment savedA2 = assignmentRepository.save(a2);

        uploadSubmission(savedA2, studentA, room.getId(), "ecc_a.pdf");
        uploadSubmission(savedA2, studentB, room.getId(), "ecc_b.pdf");
        uploadSubmission(savedA2, studentC, room.getId(), "ecc_c.pdf");

        mockMvc.perform(post("/api/assignments/" + savedA2.getId() + "/distribute")
                        .param("courseRoomId", room.getId())
                        .with(csrf())
                        .with(user(new PeerityUserDetails(instructorA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewerCount\": 2}"))
                .andExpect(status().isOk());

        List<com.trustreview.model.Submission> subsA2 = submissionRepository.findByAssignmentOrderBySubmittedAtAsc(savedA2);
        List<Review> a2ReviewsByA = reviewRepository.findBySubmissionIn(subsA2).stream()
                .filter(r -> r.getReviewer().getId().equals(studentA.getId()))
                .toList();

        assertThat(a2ReviewsByA).isNotEmpty();
        String pseudoA2 = a2ReviewsByA.get(0).getReviewerPseudonym();

        // Cross-assignment unlinkability: pseudonym on Assignment 2 MUST NOT match Assignment 1
        assertThat(pseudoA2).isNotEqualTo(pseudoA1);

        // Verify entity persistence in assignment_pseudonyms
        String entityPseudoA1 = pseudonymRepository.findByStudentAndAssignment(studentA, savedA1).orElseThrow().getPseudonym();
        String entityPseudoA2 = pseudonymRepository.findByStudentAndAssignment(studentA, savedA2).orElseThrow().getPseudonym();
        assertThat(entityPseudoA1).isEqualTo(pseudoA1);
        assertThat(entityPseudoA2).isEqualTo(pseudoA2);
        assertThat(entityPseudoA1).isNotEqualTo(entityPseudoA2);
    }

    @Test
    @DisplayName("11. Invariant: Collaborative Group Evaluation enforces k >= 3 active member floor")
    void test11_groupMemberEvaluationK3Floor() throws Exception {
        // Create a group with only 2 members
        com.trustreview.model.Group group = new com.trustreview.model.Group();
        group.setName("Duo Team");
        group.setDescription("Only two members");
        group = groupRepository.save(group);

        com.trustreview.model.GroupMembership m1 = new com.trustreview.model.GroupMembership();
        m1.setGroup(group);
        m1.setUser(studentA);
        m1.setRole(com.trustreview.model.MembershipRole.LEADER);
        m1.setStatus(com.trustreview.model.MembershipStatus.ACTIVE);
        groupMembershipRepository.save(m1);

        com.trustreview.model.GroupMembership m2 = new com.trustreview.model.GroupMembership();
        m2.setGroup(group);
        m2.setUser(studentB);
        m2.setRole(com.trustreview.model.MembershipRole.MEMBER);
        m2.setStatus(com.trustreview.model.MembershipStatus.ACTIVE);
        groupMembershipRepository.save(m2);

        var submitReq = new com.trustreview.dto.SubmitGroupEvaluationRequest();
        submitReq.setGroupId(group.getId());
        submitReq.setEvaluateeId(studentB.getId());
        submitReq.setScores("{\"Contribution\": 5}");
        submitReq.setFeedback("Good team player");

        // Submitting evaluation when group has only 2 members must throw IllegalStateException (HTTP 409 Conflict)
        mockMvc.perform(post("/api/groups/" + group.getId() + "/evaluations")
                        .with(csrf())
                        .with(user(new PeerityUserDetails(studentA)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(submitReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("k >= 3 floor")));
    }

    private void uploadSubmission(Assignment assignment, User author, String courseRoomId, String filename) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                filename,
                "application/pdf",
                ("%PDF-1.4 Test content for " + filename).getBytes()
        );

        var req = multipart("/api/submissions")
                .file(file)
                .param("assignmentId", assignment.getId())
                .with(csrf())
                .with(user(new PeerityUserDetails(author)));

        if (courseRoomId != null) {
            req.param("courseRoomId", courseRoomId);
        }

        mockMvc.perform(req).andExpect(status().isCreated());
    }
}
