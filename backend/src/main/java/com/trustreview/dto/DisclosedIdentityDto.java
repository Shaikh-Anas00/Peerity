package com.trustreview.dto;

import com.trustreview.model.DisclosureLevel;

public class DisclosedIdentityDto {

    private String pseudonym;
    private DisclosureLevel level = DisclosureLevel.LEVEL_0_ANONYMOUS;
    private boolean isApproved = false;

    // Level 1: Eligibility
    private String eligibilityStatus;
    private String course;

    // Level 2: Institution & Department
    private String institution;
    private String department;

    // Level 3: Academic Standing
    private String academicStanding;
    private Integer reviewsCompleted;

    // Level 4: Full Identity
    private String fullName;
    private String email;

    public DisclosedIdentityDto() {}

    public static DisclosedIdentityDto anonymousOnly(String pseudonym) {
        DisclosedIdentityDto dto = new DisclosedIdentityDto();
        dto.setPseudonym(pseudonym != null ? pseudonym : "Anonymous Reviewer");
        dto.setLevel(DisclosureLevel.LEVEL_0_ANONYMOUS);
        dto.setApproved(false);
        return dto;
    }

    public String getPseudonym() {
        return pseudonym;
    }

    public void setPseudonym(String pseudonym) {
        this.pseudonym = pseudonym;
    }

    public DisclosureLevel getLevel() {
        return level;
    }

    public void setLevel(DisclosureLevel level) {
        this.level = level;
    }

    public boolean isApproved() {
        return isApproved;
    }

    public void setApproved(boolean approved) {
        isApproved = approved;
    }

    public String getEligibilityStatus() {
        return eligibilityStatus;
    }

    public void setEligibilityStatus(String eligibilityStatus) {
        this.eligibilityStatus = eligibilityStatus;
    }

    public String getCourse() {
        return course;
    }

    public void setCourse(String course) {
        this.course = course;
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

    public Integer getReviewsCompleted() {
        return reviewsCompleted;
    }

    public void setReviewsCompleted(Integer reviewsCompleted) {
        this.reviewsCompleted = reviewsCompleted;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}