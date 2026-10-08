package com.trustreview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email", unique = true)
})
public class User {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.STUDENT;

    @Column(length = 150)
    private String institution;

    @Column(length = 150)
    private String department;

    @Column(name = "academic_standing", length = 100)
    private String academicStanding;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "consent_agreed", nullable = false)
    private boolean consentAgreed = false;

    @Column(name = "consent_agreed_at")
    private LocalDateTime consentAgreedAt;

    @Column(name = "notify_new_review", nullable = false)
    private boolean notifyNewReview = true;

    @Column(name = "notify_deadline_approaching", nullable = false)
    private boolean notifyDeadlineApproaching = true;

    @Column(name = "notify_dispute_status_change", nullable = false)
    private boolean notifyDisputeStatusChange = true;

    @Column(length = 50, nullable = false)
    private String timezone = "UTC";

    @Column(name = "data_export_requested", nullable = false)
    private boolean dataExportRequested = false;

    @Column(name = "data_deletion_requested", nullable = false)
    private boolean dataDeletionRequested = false;

    @Column(name = "data_request_status", length = 50, nullable = false)
    private String dataRequestStatus = "NONE";

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public User() {
        this.id = UUID.randomUUID().toString();
    }

    public User(String email, String passwordHash, String fullName, Role role, String institution, String department) {
        this.id = UUID.randomUUID().toString();
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.role = role != null ? role : Role.STUDENT;
        this.institution = institution;
        this.department = department;
        this.isActive = true;
    }

    public User(String email, String passwordHash, String fullName, Role role, String institution, String department, boolean consentAgreed) {
        this(email, passwordHash, fullName, role, institution, department);
        this.consentAgreed = consentAgreed;
        if (consentAgreed) {
            this.consentAgreedAt = LocalDateTime.now();
        }
    }

    public boolean isProfileComplete() {
        return fullName != null && !fullName.trim().isEmpty() &&
               institution != null && !institution.trim().isEmpty() &&
               department != null && !department.trim().isEmpty();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
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

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
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

    public LocalDateTime getConsentAgreedAt() {
        return consentAgreedAt;
    }

    public void setConsentAgreedAt(LocalDateTime consentAgreedAt) {
        this.consentAgreedAt = consentAgreedAt;
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

    public boolean isDataExportRequested() {
        return dataExportRequested;
    }

    public void setDataExportRequested(boolean dataExportRequested) {
        this.dataExportRequested = dataExportRequested;
    }

    public boolean isDataDeletionRequested() {
        return dataDeletionRequested;
    }

    public void setDataDeletionRequested(boolean dataDeletionRequested) {
        this.dataDeletionRequested = dataDeletionRequested;
    }

    public String getDataRequestStatus() {
        return dataRequestStatus;
    }

    public void setDataRequestStatus(String dataRequestStatus) {
        this.dataRequestStatus = dataRequestStatus;
    }
}
