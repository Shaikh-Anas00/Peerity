package com.trustreview.dto;

import com.trustreview.model.Role;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[0-9])(?=.*[A-Z]).*$",
        message = "Password must contain at least one number and one uppercase letter"
    )
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    // Registration is strictly locked to STUDENT. Incoming role parameters are discarded.
    private final Role role = Role.STUDENT;

    @NotBlank(message = "Institution is required")
    private String institution;

    @NotBlank(message = "Department is required")
    private String department;

    @NotNull(message = "Consent to anonymous review policy is mandatory")
    @AssertTrue(message = "You must understand that submissions are reviewed anonymously and agree to quorum-governed disclosure policy")
    private Boolean consentAgreed;

    public RegisterRequest() {
    }

    public RegisterRequest(String email, String password, String fullName, Role role, String institution, String department) {
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.institution = institution;
        this.department = department;
        this.consentAgreed = true;
    }

    public RegisterRequest(String email, String password, String fullName, Role role, String institution, String department, Boolean consentAgreed) {
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.institution = institution;
        this.department = department;
        this.consentAgreed = consentAgreed;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Role getRole() {
        return Role.STUDENT;
    }

    public void setRole(Role role) {
        // Discard incoming role: registration is strictly locked to STUDENT.
    }

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Boolean getConsentAgreed() {
        return consentAgreed;
    }

    public void setConsentAgreed(Boolean consentAgreed) {
        this.consentAgreed = consentAgreed;
    }
}
