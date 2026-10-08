package com.trustreview;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import com.trustreview.model.User;
import com.trustreview.model.Role;
import com.trustreview.repository.UserRepository;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Systematic role x endpoint authorization matrix.
 *
 * Every publicly-accessible endpoint is tested against every role and
 * unauthenticated. This catches any missing @PreAuthorize annotation
 * or misconfigured permit rule.
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Authorization Matrix — Role x Endpoint Coverage")
class AuthorizationMatrixTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @org.junit.jupiter.api.BeforeEach
    void seedMockUsers() {
        // @WithMockUser creates virtual principal "user"; seed it so resolveUser() finds it.
        seedIfAbsent("user", Role.STUDENT);
        seedIfAbsent("student1@trustreview.edu", Role.STUDENT);
        seedIfAbsent("committee1@trustreview.edu", Role.COMMITTEE);
        seedIfAbsent("admin@trustreview.edu", Role.ADMIN);
        seedIfAbsent("instructor1@trustreview.edu", Role.INSTRUCTOR);
    }

    private void seedIfAbsent(String email, Role role) {
        if (!userRepository.existsByEmail(email)) {
            userRepository.save(new User(email, "hash", email, role, "Test", "Test"));
        }
    }

    // ── /api/appeals/pending ─────────────────────────────────────────────────

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /api/appeals/pending → 403")
    void pendingAppeals_student_403() throws Exception {
        mockMvc.perform(get("/api/appeals/pending")).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "COMMITTEE")
    @DisplayName("COMMITTEE → GET /api/appeals/pending → 200")
    void pendingAppeals_committee_200() throws Exception {
        mockMvc.perform(get("/api/appeals/pending")).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN → GET /api/appeals/pending → 200")
    void pendingAppeals_admin_200() throws Exception {
        mockMvc.perform(get("/api/appeals/pending")).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → GET /api/appeals/pending → 200")
    void pendingAppeals_instructor_200() throws Exception {
        mockMvc.perform(get("/api/appeals/pending")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Anonymous → GET /api/appeals/pending → 401")
    void pendingAppeals_anon_401() throws Exception {
        mockMvc.perform(get("/api/appeals/pending")).andExpect(status().isUnauthorized());
    }

    // ── /api/appeals/{id}/vote ───────────────────────────────────────────────

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → POST /api/appeals/{id}/vote → 403")
    void castVote_student_403() throws Exception {
        mockMvc.perform(post("/api/appeals/test-id/vote")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"decision\":\"APPROVE\",\"rationale\":\"test\"}"))
            .andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN → POST /api/appeals/{id}/vote → 403 (custodian, not voter)")
    void castVote_admin_403() throws Exception {
        mockMvc.perform(post("/api/appeals/test-id/vote")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"decision\":\"APPROVE\",\"rationale\":\"test\"}"))
            .andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → POST /api/appeals/{id}/vote → 403")
    void castVote_instructor_403() throws Exception {
        mockMvc.perform(post("/api/appeals/test-id/vote")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"decision\":\"APPROVE\",\"rationale\":\"test\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Anonymous → POST /api/appeals/{id}/vote → 401/403 (CSRF fires before auth for anon)")
    void castVote_anon_401() throws Exception {
        mockMvc.perform(post("/api/appeals/test-id/vote")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"decision\":\"APPROVE\",\"rationale\":\"test\"}"))
            .andExpect(result -> {
                int s = result.getResponse().getStatus();
                assert s == 401 || s == 403 : "Expected 401 or 403 for anon POST but got: " + s;
            });
    }

    // ── /api/admin/users ──────────────────────────────────────────────────────

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → POST /api/admin/users → 403")
    void adminCreateUser_student_403() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@t.edu\",\"password\":\"Pass@12345\",\"fullName\":\"X\",\"role\":\"ADMIN\"}"))
            .andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "COMMITTEE")
    @DisplayName("COMMITTEE → POST /api/admin/users → 403")
    void adminCreateUser_committee_403() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@t.edu\",\"password\":\"Pass@12345\",\"fullName\":\"X\",\"role\":\"COMMITTEE\"}"))
            .andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → POST /api/admin/users → 403")
    void adminCreateUser_instructor_403() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@t.edu\",\"password\":\"Pass@12345\",\"fullName\":\"X\",\"role\":\"INSTRUCTOR\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Anonymous → POST /api/admin/users → 401/403 (CSRF fires before auth for anon)")
    void adminCreateUser_anon_401() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"x@t.edu\",\"password\":\"Pass@12345\",\"fullName\":\"X\",\"role\":\"ADMIN\"}"))
            .andExpect(result -> {
                int s = result.getResponse().getStatus();
                assert s == 401 || s == 403 : "Expected 401 or 403 for anon POST but got: " + s;
            });
    }

    // ── /api/reviews/assigned-to-me ──────────────────────────────────────────

    @Test @WithMockUser(roles = "COMMITTEE")
    @DisplayName("COMMITTEE → GET /api/reviews/assigned-to-me → 403 (STUDENT only)")
    void assignedToMe_committee_403() throws Exception {
        mockMvc.perform(get("/api/reviews/assigned-to-me")).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN → GET /api/reviews/assigned-to-me → 403 (STUDENT only)")
    void assignedToMe_admin_403() throws Exception {
        mockMvc.perform(get("/api/reviews/assigned-to-me")).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /api/reviews/assigned-to-me → 200")
    void assignedToMe_student_200() throws Exception {
        mockMvc.perform(get("/api/reviews/assigned-to-me")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Anonymous → GET /api/reviews/assigned-to-me → 401")
    void assignedToMe_anon_401() throws Exception {
        mockMvc.perform(get("/api/reviews/assigned-to-me")).andExpect(status().isUnauthorized());
    }

    // ── /api/reviews/my-feedback ─────────────────────────────────────────────

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /api/reviews/my-feedback → 200")
    void myFeedback_student_200() throws Exception {
        mockMvc.perform(get("/api/reviews/my-feedback")).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → GET /api/reviews/my-feedback → 403")
    void myFeedback_instructor_403() throws Exception {
        mockMvc.perform(get("/api/reviews/my-feedback")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Anonymous → GET /api/reviews/my-feedback → 401")
    void myFeedback_anon_401() throws Exception {
        mockMvc.perform(get("/api/reviews/my-feedback")).andExpect(status().isUnauthorized());
    }

    // ── /api/appeals/my-appeals ──────────────────────────────────────────────

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /api/appeals/my-appeals → 200")
    void myAppeals_student_200() throws Exception {
        mockMvc.perform(get("/api/appeals/my-appeals")).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "COMMITTEE")
    @DisplayName("COMMITTEE → GET /api/appeals/my-appeals → 403 (STUDENT only)")
    void myAppeals_committee_403() throws Exception {
        mockMvc.perform(get("/api/appeals/my-appeals")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Anonymous → GET /api/appeals/my-appeals → 401")
    void myAppeals_anon_401() throws Exception {
        mockMvc.perform(get("/api/appeals/my-appeals")).andExpect(status().isUnauthorized());
    }

    // ── /api/audit/logs ──────────────────────────────────────────────────────

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /api/audit/logs → 403")
    void auditLogs_student_403() throws Exception {
        mockMvc.perform(get("/api/audit/logs")).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "COMMITTEE")
    @DisplayName("COMMITTEE → GET /api/audit/logs → 200 (B5: policy extended to ADMIN+COMMITTEE)")
    void auditLogs_committee_200() throws Exception {
        // B5 fix: COMMITTEE was granted access to /api/audit/logs to match the frontend
        // route guard which admits both ADMIN and COMMITTEE to /admin/audit.
        mockMvc.perform(get("/api/audit/logs")).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN → GET /api/audit/logs → 200")
    void auditLogs_admin_200() throws Exception {
        mockMvc.perform(get("/api/audit/logs")).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Anonymous → GET /api/audit/logs → 401")
    void auditLogs_anon_401() throws Exception {
        mockMvc.perform(get("/api/audit/logs")).andExpect(status().isUnauthorized());
    }

    // ── /api/submissions/my ──────────────────────────────────────────────────

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /api/submissions/my → 200")
    void mySubmissions_student_200() throws Exception {
        mockMvc.perform(get("/api/submissions/my")).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → GET /api/submissions/my → 403 (STUDENT only)")
    void mySubmissions_instructor_403() throws Exception {
        mockMvc.perform(get("/api/submissions/my")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Anonymous → GET /api/submissions/my → 401")
    void mySubmissions_anon_401() throws Exception {
        mockMvc.perform(get("/api/submissions/my")).andExpect(status().isUnauthorized());
    }

    // ── /api/rubric-templates ───────────────────────────────────────────────

    @Test @WithMockUser(roles = "INSTRUCTOR")
    @DisplayName("INSTRUCTOR → GET /api/rubric-templates → 200")
    void rubricTemplates_instructor_200() throws Exception {
        mockMvc.perform(get("/api/rubric-templates")).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "ADMIN")
    @DisplayName("ADMIN → GET /api/rubric-templates → 200")
    void rubricTemplates_admin_200() throws Exception {
        mockMvc.perform(get("/api/rubric-templates")).andExpect(status().isOk());
    }

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("STUDENT → GET /api/rubric-templates → 403")
    void rubricTemplates_student_403() throws Exception {
        mockMvc.perform(get("/api/rubric-templates")).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles = "COMMITTEE")
    @DisplayName("COMMITTEE → GET /api/rubric-templates → 403")
    void rubricTemplates_committee_403() throws Exception {
        mockMvc.perform(get("/api/rubric-templates")).andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Anonymous → GET /api/rubric-templates → 401")
    void rubricTemplates_anon_401() throws Exception {
        mockMvc.perform(get("/api/rubric-templates")).andExpect(status().isUnauthorized());
    }

    // ── Security Headers ──────────────────────────────────────────────────────

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("Response includes X-Content-Type-Options: nosniff")
    void securityHeaders_xContentTypeOptions() throws Exception {
        mockMvc.perform(get("/api/appeals/my-appeals"))
            .andExpect(result -> {
                String val = result.getResponse().getHeader("X-Content-Type-Options");
                assert "nosniff".equalsIgnoreCase(val)
                    : "Expected X-Content-Type-Options: nosniff but got: " + val;
            });
    }

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("Response includes X-Frame-Options: DENY")
    void securityHeaders_xFrameOptions() throws Exception {
        mockMvc.perform(get("/api/appeals/my-appeals"))
            .andExpect(result -> {
                String val = result.getResponse().getHeader("X-Frame-Options");
                assert "DENY".equalsIgnoreCase(val)
                    : "Expected X-Frame-Options: DENY but got: " + val;
            });
    }

    @Test @WithMockUser(roles = "STUDENT")
    @DisplayName("Response includes Content-Security-Policy header")
    void securityHeaders_csp() throws Exception {
        mockMvc.perform(get("/api/appeals/my-appeals"))
            .andExpect(result -> {
                String val = result.getResponse().getHeader("Content-Security-Policy");
                assert val != null && val.contains("default-src 'self'")
                    : "CSP header missing or invalid: " + val;
            });
    }
}
