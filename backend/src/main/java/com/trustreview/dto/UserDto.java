package com.trustreview.dto;

import com.trustreview.model.Role;
import com.trustreview.model.User;

import java.time.LocalDateTime;

public class UserDto {
    private String id;
    private String email;
    private String fullName;
    private Role role;
    private String institution;
    private String department;
    private String academicStanding;
    private String avatarUrl;
    private boolean consentAgreed;
    private boolean notifyNewReview;
    private boolean notifyDeadlineApproaching;
    private boolean notifyDisputeStatusChange;
    private String timezone;
    private String dataRequestStatus;
    private boolean profileComplete;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UserDto() {
    }

    public UserDto(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.role = user.getRole();
        this.institution = user.getInstitution();
        this.department = user.getDepartment();
        this.academicStanding = user.getAcademicStanding();
        this.avatarUrl = user.getAvatarUrl();
        this.consentAgreed = user.isConsentAgreed();
        this.notifyNewReview = user.isNotifyNewReview();
        this.notifyDeadlineApproaching = user.isNotifyDeadlineApproaching();
        this.notifyDisputeStatusChange = user.isNotifyDisputeStatusChange();
        this.timezone = user.getTimezone();
        this.dataRequestStatus = user.getDataRequestStatus();
        this.profileComplete = user.isProfileComplete();
        this.isActive = user.isActive();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
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

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
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

    public boolean isConsentAgreed() {
        return consentAgreed;
    }

    public void setConsentAgreed(boolean consentAgreed) {
        this.consentAgreed = consentAgreed;
    }

    public boolean isNotifyNewReview() {
        return notifyNewReview;
    }

    public void setNotifyNewReview(boolean notifyNewReview) {
        this.notifyNewReview = notifyNewReview;
    }

    public boolean isNotifyDeadlineApproaching() {
        return notifyDeadlineApproaching;
    }

    public void setNotifyDeadlineApproaching(boolean notifyDeadlineApproaching) {
        this.notifyDeadlineApproaching = notifyDeadlineApproaching;
    }

    public boolean isNotifyDisputeStatusChange() {
        return notifyDisputeStatusChange;
    }

    public void setNotifyDisputeStatusChange(boolean notifyDisputeStatusChange) {
        this.notifyDisputeStatusChange = notifyDisputeStatusChange;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getDataRequestStatus() {
        return dataRequestStatus;
    }

    public void setDataRequestStatus(String dataRequestStatus) {
        this.dataRequestStatus = dataRequestStatus;
    }

    public boolean isProfileComplete() {
        return profileComplete;
    }

    public void setProfileComplete(boolean profileComplete) {
        this.profileComplete = profileComplete;
    }
}
