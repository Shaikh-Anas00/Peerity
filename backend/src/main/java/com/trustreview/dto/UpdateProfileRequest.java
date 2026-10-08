package com.trustreview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for updating user profile.
 * Restricted strictly to required and permitted educational fields.
 * Does NOT collect age, gender, date of birth, phone number, or home address.
 */
public class UpdateProfileRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Institution is required")
    @Size(min = 2, max = 150, message = "Institution must be between 2 and 150 characters")
    private String institution;

    @NotBlank(message = "Department is required")
    @Size(min = 2, max = 150, message = "Department must be between 2 and 150 characters")
    private String department;

    @Size(max = 100, message = "Academic standing description must not exceed 100 characters")
    private String academicStanding;

    @Size(max = 500, message = "Avatar URL must not exceed 500 characters")
    private String avatarUrl;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String fullName, String institution, String department, String academicStanding, String avatarUrl) {
        this.fullName = fullName;
        this.institution = institution;
        this.department = department;
        this.academicStanding = academicStanding;
        this.avatarUrl = avatarUrl;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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

    public String getAcademicStanding() {
        return academicStanding;
    }

    public void setAcademicStanding(String academicStanding) {
        this.academicStanding = academicStanding;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
