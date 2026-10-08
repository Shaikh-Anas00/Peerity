package com.trustreview;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustreview.dto.AccountDataActionRequest;
import com.trustreview.dto.ChangePasswordRequest;
import com.trustreview.dto.RegisterRequest;
import com.trustreview.dto.UpdateProfileRequest;
import com.trustreview.dto.UpdateSettingsRequest;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("User Profile, Settings, and Mandatory Consent Registration Tests")
class UserProfileAndRegistrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private ObjectMapper objectMapper;

    @BeforeEach
    void seedTestUser() {
        if (!userRepository.existsByEmail("profile_test@trustreview.edu")) {
            User u = new User(
                    "profile_test@trustreview.edu",
                    passwordEncoder.encode("SecurePass1"),
                    "Test Student",
                    Role.STUDENT,
                    "Apex University",
                    "Computer Science",
                    true
            );
            userRepository.save(u);
        }
    }

    // ── 1. Registration Mandatory Consent & Required Fields Validation ───────────

    @Test
    @DisplayName("Registration fails (400) if consent checkbox is false or missing")
    void register_missingConsent_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "noconsent@trustreview.edu",
                "Password123",
                "No Consent User",
                Role.STUDENT,
                "State Tech",
                "Electrical Engineering",
                false // Explicitly false consent
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Registration fails (400) if full name is missing or blank")
    void register_missingFullName_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "noname@trustreview.edu",
                "Password123",
                "", // Blank full name
                Role.STUDENT,
                "State Tech",
                "Electrical Engineering",
                true
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Registration fails (400) if institution is missing or blank")
    void register_missingInstitution_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "noinst@trustreview.edu",
                "Password123",
                "Valid Name",
                Role.STUDENT,
                "", // Blank institution
                "Electrical Engineering",
                true
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Registration fails (400) if department is missing or blank")
    void register_missingDepartment_returns400() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "nodept@trustreview.edu",
                "Password123",
                "Valid Name",
                Role.STUDENT,
                "State Tech",
                "", // Blank department
                true
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Registration succeeds (201) when all required fields and consent are present")
    void register_validDataWithConsent_returns201() throws Exception {
        String uniqueEmail = "success_" + System.currentTimeMillis() + "@trustreview.edu";
        RegisterRequest req = new RegisterRequest(
                uniqueEmail,
                "ValidPassword1",
                "Sarah Connor",
                Role.STUDENT,
                "Cybernetics Institute",
                "Robotics",
                true
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(uniqueEmail))
                .andExpect(jsonPath("$.fullName").value("Sarah Connor"))
                .andExpect(jsonPath("$.institution").value("Cybernetics Institute"))
                .andExpect(jsonPath("$.department").value("Robotics"))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.profileComplete").value(true));
    }

    // ── 2. Profile Gating & Authenticated Access ────────────────────────────────

    @Test
    @DisplayName("Unauthenticated request to /api/users/profile returns 401")
    void unauthenticated_profileAccess_returns401() throws Exception {
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "profile_test@trustreview.edu", roles = "STUDENT")
    @DisplayName("Authenticated user can view their profile at GET /api/users/profile")
    void authenticated_getProfile_returns200() throws Exception {
        mockMvc.perform(get("/api/users/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("profile_test@trustreview.edu"))
                .andExpect(jsonPath("$.institution").value("Apex University"))
                .andExpect(jsonPath("$.department").value("Computer Science"));
    }

    @Test
    @WithMockUser(username = "profile_test@trustreview.edu", roles = "STUDENT")
    @DisplayName("Authenticated user can update profile with valid fields (academic standing & avatar)")
    void authenticated_updateProfile_returns200() throws Exception {
        UpdateProfileRequest req = new UpdateProfileRequest(
                "Updated Name",
                "Stanford University",
                "Informatics",
                "Year 3 / Junior",
                "https://api.dicebear.com/7.x/identicon/svg?seed=updated"
        );

        mockMvc.perform(put("/api/users/profile").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Updated Name"))
                .andExpect(jsonPath("$.institution").value("Stanford University"))
                .andExpect(jsonPath("$.department").value("Informatics"))
                .andExpect(jsonPath("$.academicStanding").value("Year 3 / Junior"))
                .andExpect(jsonPath("$.avatarUrl").value("https://api.dicebear.com/7.x/identicon/svg?seed=updated"));
    }

    @Test
    @WithMockUser(username = "profile_test@trustreview.edu", roles = "STUDENT")
    @DisplayName("Profile update fails (400) if required field (department) is blank")
    void authenticated_updateProfile_blankDepartment_returns400() throws Exception {
        UpdateProfileRequest req = new UpdateProfileRequest(
                "Updated Name",
                "Stanford University",
                "", // Blank department
                "Year 3",
                null
        );

        mockMvc.perform(put("/api/users/profile").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ── 3. Notification & Settings Preferences ──────────────────────────────────

    @Test
    @WithMockUser(username = "profile_test@trustreview.edu", roles = "STUDENT")
    @DisplayName("Authenticated user can update notification preferences and timezone")
    void authenticated_updateSettings_returns200() throws Exception {
        UpdateSettingsRequest req = new UpdateSettingsRequest(
                false,
                true,
                false,
                "America/New_York"
        );

        mockMvc.perform(put("/api/users/settings").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notifyNewReview").value(false))
                .andExpect(jsonPath("$.notifyDeadlineApproaching").value(true))
                .andExpect(jsonPath("$.notifyDisputeStatusChange").value(false))
                .andExpect(jsonPath("$.timezone").value("America/New_York"));
    }

    // ── 4. Password Change Flow ─────────────────────────────────────────────────

    @Test
    @WithMockUser(username = "profile_test@trustreview.edu", roles = "STUDENT")
    @DisplayName("Password verification fails (400) when current password is wrong")
    void verifyPassword_wrongCurrentPassword_returns400() throws Exception {
        com.trustreview.dto.VerifyPasswordRequest req = new com.trustreview.dto.VerifyPasswordRequest("WrongPass1");

        mockMvc.perform(post("/api/users/verify-password").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "profile_test@trustreview.edu", roles = "STUDENT")
    @DisplayName("Password verification succeeds (200) when current password is valid")
    void verifyPassword_validCurrentPassword_returns200() throws Exception {
        com.trustreview.dto.VerifyPasswordRequest req = new com.trustreview.dto.VerifyPasswordRequest("SecurePass1");

        mockMvc.perform(post("/api/users/verify-password").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(username = "profile_test@trustreview.edu", roles = "STUDENT")
    @DisplayName("Password change fails (400) when current password is wrong")
    void changePassword_wrongCurrentPassword_returns400() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest(
                "WrongCurrentPass1",
                "NewSecurePass2",
                "NewSecurePass2"
        );

        mockMvc.perform(post("/api/users/change-password").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "profile_test@trustreview.edu", roles = "STUDENT")
    @DisplayName("Password change succeeds (200) when current password is confirmed correctly")
    void changePassword_validPassword_returns200() throws Exception {
        ChangePasswordRequest req = new ChangePasswordRequest(
                "SecurePass1",
                "NewSecurePass2",
                "NewSecurePass2"
        );

        mockMvc.perform(post("/api/users/change-password").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    // ── 5. Data Governance Requests (Export / Deletion) ──────────────────────────

    @Test
    @WithMockUser(username = "profile_test@trustreview.edu", roles = "STUDENT")
    @DisplayName("Data export request files formal admin request and updates status")
    void dataRequest_export_returns200() throws Exception {
        AccountDataActionRequest req = new AccountDataActionRequest("EXPORT", "Moving to another academic institution");

        mockMvc.perform(post("/api/users/data-request").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataRequestStatus").value("EXPORT_REQUESTED"));
    }
}
