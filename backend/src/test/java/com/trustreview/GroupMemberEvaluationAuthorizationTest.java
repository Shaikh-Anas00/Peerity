package com.trustreview;

import com.trustreview.model.Role;
import com.trustreview.model.User;
import com.trustreview.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Authorization boundary tests for Group Member Evaluation.
 *
 * The core constraint under test:
 *
 *   /api/groups/{id}/evaluations/all      → INSTRUCTOR, ADMIN only (full attribution)
 *   /api/groups/{id}/evaluations/my-aggregate → STUDENT only (aggregate, no names)
 *   COMMITTEE → 403 on /all (accountability via audit, not grievance access)
 *
 * These tests run BEFORE any UI is built so the constraint is proven at the
 * authorization layer, not just assumed from the frontend gating.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Group Member Evaluation — Authorization Boundary Tests")
class GroupMemberEvaluationAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    // A stable fake group ID — the authorization check (403/401) fires before the
    // business logic check (404), so we don't need a real group to exist.
    private static final String FAKE_GROUP_ID = "00000000-auth-test-0000-000000000000";

    @BeforeEach
    void seedMockUsers() {
        seedIfAbsent("user", Role.STUDENT);
        seedIfAbsent("student1@trustreview.edu", Role.STUDENT);
        seedIfAbsent("instructor1@trustreview.edu", Role.INSTRUCTOR);
        seedIfAbsent("admin@trustreview.edu", Role.ADMIN);
        seedIfAbsent("committee1@trustreview.edu", Role.COMMITTEE);
    }

    private void seedIfAbsent(String email, Role role) {
        if (!userRepository.existsByEmail(email)) {
            userRepository.save(new User(email, "hash", email, role, "Test", "Test"));
        }
    }

    // ── /api/groups/{id}/evaluations/all — INSTRUCTOR/ADMIN only ─────────────

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /evaluations/all → 403 (attribution gated from students)")
    void attributedEvaluations_student_403() throws Exception {
        mockMvc.perform(get("/api/groups/" + FAKE_GROUP_ID + "/evaluations/all"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "COMMITTEE")
    @DisplayName("COMMITTEE → GET /evaluations/all → 403 (quorum role, not grievance investigator)")
    void attributedEvaluations_committee_403() throws Exception {
        mockMvc.perform(get("/api/groups/" + FAKE_GROUP_ID + "/evaluations/all"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → GET /evaluations/all → 200 (full attribution for accountability)")
    void attributedEvaluations_instructor_200() throws Exception {
        // Will return 200 (empty list) since group doesn't exist but auth passes
        mockMvc.perform(get("/api/groups/" + FAKE_GROUP_ID + "/evaluations/all"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    // 200 (found, empty) or 404 (group not found) are both acceptable —
                    // the key guarantee is that it is NOT 403.
                    assert status != 403 : "Expected NOT 403 for INSTRUCTOR but got 403";
                    assert status != 401 : "Expected NOT 401 for INSTRUCTOR but got 401";
                });
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN → GET /evaluations/all → not 403 (full attribution access)")
    void attributedEvaluations_admin_notForbidden() throws Exception {
        mockMvc.perform(get("/api/groups/" + FAKE_GROUP_ID + "/evaluations/all"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assert status != 403 : "Expected NOT 403 for ADMIN but got 403";
                    assert status != 401 : "Expected NOT 401 for ADMIN but got 401";
                });
    }

    @Test
    @DisplayName("Anonymous → GET /evaluations/all → 401")
    void attributedEvaluations_anon_401() throws Exception {
        mockMvc.perform(get("/api/groups/" + FAKE_GROUP_ID + "/evaluations/all"))
                .andExpect(status().isUnauthorized());
    }

    // ── /api/groups/{id}/evaluations/my-aggregate — STUDENT only ─────────────

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /evaluations/my-aggregate → not 403 (aggregate view allowed)")
    void aggregateEvaluation_student_notForbidden() throws Exception {
        mockMvc.perform(get("/api/groups/" + FAKE_GROUP_ID + "/evaluations/my-aggregate"))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    assert status != 403 : "Expected NOT 403 for STUDENT aggregate endpoint but got 403";
                    assert status != 401 : "Expected NOT 401 for STUDENT but got 401";
                });
    }

    @Test
    @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → GET /evaluations/my-aggregate → 403 (student-only endpoint)")
    void aggregateEvaluation_instructor_403() throws Exception {
        mockMvc.perform(get("/api/groups/" + FAKE_GROUP_ID + "/evaluations/my-aggregate"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN → GET /evaluations/my-aggregate → 403 (student-only endpoint)")
    void aggregateEvaluation_admin_403() throws Exception {
        mockMvc.perform(get("/api/groups/" + FAKE_GROUP_ID + "/evaluations/my-aggregate"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "COMMITTEE")
    @DisplayName("COMMITTEE → GET /evaluations/my-aggregate → 403 (student-only endpoint)")
    void aggregateEvaluation_committee_403() throws Exception {
        mockMvc.perform(get("/api/groups/" + FAKE_GROUP_ID + "/evaluations/my-aggregate"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Anonymous → GET /evaluations/my-aggregate → 401")
    void aggregateEvaluation_anon_401() throws Exception {
        mockMvc.perform(get("/api/groups/" + FAKE_GROUP_ID + "/evaluations/my-aggregate"))
                .andExpect(status().isUnauthorized());
    }

    // ── POST /api/groups/{id}/evaluations — STUDENT only ─────────────────────

    @Test
    @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → POST /evaluations → 403 (students only submit peer evaluations)")
    void submitEvaluation_instructor_403() throws Exception {
        mockMvc.perform(post("/api/groups/" + FAKE_GROUP_ID + "/evaluations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"evaluateeId\":\"some-id\",\"scores\":\"{}\",\"feedback\":\"test\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "COMMITTEE")
    @DisplayName("COMMITTEE → POST /evaluations → 403")
    void submitEvaluation_committee_403() throws Exception {
        mockMvc.perform(post("/api/groups/" + FAKE_GROUP_ID + "/evaluations")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"evaluateeId\":\"some-id\",\"scores\":\"{}\",\"feedback\":\"test\"}"))
                .andExpect(status().isForbidden());
    }

    // ── POST /api/groups — INSTRUCTOR/ADMIN only ──────────────────────────────

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → POST /api/groups → 403 (only instructors create groups)")
    void createGroup_student_403() throws Exception {
        mockMvc.perform(post("/api/groups")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Team Alpha\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "COMMITTEE")
    @DisplayName("COMMITTEE → POST /api/groups → 403")
    void createGroup_committee_403() throws Exception {
        mockMvc.perform(post("/api/groups")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Team Alpha\"}"))
                .andExpect(status().isForbidden());
    }

    // ── GET /api/groups — INSTRUCTOR/ADMIN only ───────────────────────────────

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /api/groups → 403 (student sees /my only)")
    void getAllGroups_student_403() throws Exception {
        mockMvc.perform(get("/api/groups"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → GET /api/groups → 200")
    void getAllGroups_instructor_200() throws Exception {
        mockMvc.perform(get("/api/groups"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Anonymous → GET /api/groups → 401")
    void getAllGroups_anon_401() throws Exception {
        mockMvc.perform(get("/api/groups"))
                .andExpect(status().isUnauthorized());
    }

    // ── GET /api/groups/my — all authenticated ────────────────────────────────

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /api/groups/my → 200")
    void getMyGroups_student_200() throws Exception {
        mockMvc.perform(get("/api/groups/my"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → GET /api/groups/my → 200")
    void getMyGroups_instructor_200() throws Exception {
        mockMvc.perform(get("/api/groups/my"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Anonymous → GET /api/groups/my → 401")
    void getMyGroups_anon_401() throws Exception {
        mockMvc.perform(get("/api/groups/my"))
                .andExpect(status().isUnauthorized());
    }
}
