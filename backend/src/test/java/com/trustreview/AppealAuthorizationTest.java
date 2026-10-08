package com.trustreview;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for RBAC enforcement on the appeals endpoints.
 *
 * Uses @SpringBootTest to load the full application context and
 * @AutoConfigureMockMvc to perform in-memory HTTP requests without a real server.
 *
 * These tests confirm that Spring Security's @PreAuthorize annotations
 * are correctly enforced at the method level:
 *  - STUDENT role → 403 Forbidden on /api/appeals/pending
 *  - COMMITTEE role → 200 OK on /api/appeals/pending
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Appeal Authorization — RBAC Integration Tests")
class AppealAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private com.trustreview.repository.UserRepository userRepository;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        if (!userRepository.existsByEmail("student1@trustreview.edu")) {
            userRepository.save(new com.trustreview.model.User(
                    "student1@trustreview.edu",
                    "dummyHashedPassword",
                    "Student One",
                    com.trustreview.model.Role.STUDENT,
                    "Apex Institute",
                    "Computer Science"
            ));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // /api/appeals/pending — requires COMMITTEE, ADMIN, or INSTRUCTOR role
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "student1@trustreview.edu", roles = "STUDENT")
    @DisplayName("STUDENT accessing /api/appeals/pending → 403 Forbidden")
    void givenStudentRole_whenGetPendingAppeals_thenForbidden() throws Exception {
        mockMvc.perform(get("/api/appeals/pending"))
               .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "committee1@trustreview.edu", roles = "COMMITTEE")
    @DisplayName("COMMITTEE accessing /api/appeals/pending → 200 OK")
    void givenCommitteeRole_whenGetPendingAppeals_thenOk() throws Exception {
        mockMvc.perform(get("/api/appeals/pending"))
               .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@trustreview.edu", roles = "ADMIN")
    @DisplayName("ADMIN accessing /api/appeals/pending → 200 OK")
    void givenAdminRole_whenGetPendingAppeals_thenOk() throws Exception {
        mockMvc.perform(get("/api/appeals/pending"))
               .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "instructor1@trustreview.edu", roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR accessing /api/appeals/pending → 200 OK")
    void givenInstructorRole_whenGetPendingAppeals_thenOk() throws Exception {
        mockMvc.perform(get("/api/appeals/pending"))
               .andExpect(status().isOk());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // /api/appeals — POST requires STUDENT role
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Unauthenticated GET /api/appeals/pending → 401 Unauthorized")
    void givenNoAuth_whenGetPendingAppeals_thenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/appeals/pending"))
               .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "committee1@trustreview.edu", roles = "COMMITTEE")
    @DisplayName("COMMITTEE accessing /api/appeals/my-appeals (STUDENT-only) → 403 Forbidden")
    void givenCommitteeRole_whenGetMyAppeals_thenForbidden() throws Exception {
        mockMvc.perform(get("/api/appeals/my-appeals"))
               .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "student1@trustreview.edu", roles = "STUDENT")
    @DisplayName("STUDENT accessing /api/appeals/my-appeals → 200 OK")
    void givenStudentRole_whenGetMyAppeals_thenOk() throws Exception {
        mockMvc.perform(get("/api/appeals/my-appeals"))
               .andExpect(status().isOk());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // /api/appeals/{id}/vote — strictly requires COMMITTEE role (ADMIN forbidden)
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "admin@trustreview.edu", roles = "ADMIN")
    @DisplayName("ADMIN accessing /api/appeals/{id}/vote → 403 Forbidden (Operational Custodian Only)")
    void givenAdminRole_whenCastVote_thenForbidden() throws Exception {
        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                    .post("/api/appeals/test-id/vote")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .content("{\"decision\":\"APPROVE\",\"rationale\":\"Operational approval attempt\"}")
               )
               .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "student1@trustreview.edu", roles = "STUDENT")
    @DisplayName("STUDENT accessing /api/appeals/{id}/vote → 403 Forbidden")
    void givenStudentRole_whenCastVote_thenForbidden() throws Exception {
        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                    .post("/api/appeals/test-id/vote")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .content("{\"decision\":\"APPROVE\",\"rationale\":\"Student voting attempt\"}")
               )
               .andExpect(status().isForbidden());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // /api/admin/users — strictly requires ADMIN role
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "student1@trustreview.edu", roles = "STUDENT")
    @DisplayName("STUDENT accessing /api/admin/users → 403 Forbidden")
    void givenStudentRole_whenCreatePrivilegedUser_thenForbidden() throws Exception {
        mockMvc.perform(
                org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                    .post("/api/admin/users")
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"fake@test.edu\",\"password\":\"Pass@12345\",\"fullName\":\"Fake Admin\",\"role\":\"ADMIN\"}")
               )
               .andExpect(status().isForbidden());
    }
}
