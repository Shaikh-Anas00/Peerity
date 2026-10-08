package com.trustreview.dto;

import com.trustreview.model.Submission;
import java.time.LocalDateTime;

/**
 * Decoupled DTO for Submission entity.
 * Guarantees privacy by preventing accidental leakage
 * of author database IDs or emails to peer reviewers.
 */
public class SubmissionDto {

    private String id;
    private String assignmentId;
    private String assignmentTitle;
    private String originalFileName;
    private String fileSize;
    private String fileType;
    private String filePath;
    private String fileHash;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;

    // Privacy fields
    private String authorPseudonym;
    private boolean isAnonymousView;
    private String authorId;
    private String authorName;
    private String authorEmail;
    private String authorDepartment;

    public SubmissionDto() {}

    /** For Peer Reviewers � author identity is strictly masked. */
    public static SubmissionDto forPeerReview(Submission s, String pseudonym) {
        SubmissionDto dto = new SubmissionDto();
        dto.id = s.getId();
        dto.assignmentId = s.getAssignment() != null ? s.getAssignment().getId() : null;
        dto.assignmentTitle = s.getAssignment() != null ? s.getAssignment().getTitle() : null;
        dto.originalFileName = s.getOriginalFileName();
        dto.fileSize = s.getFileSize();
        dto.fileType = s.getFileType();
        dto.fileHash = s.getFileHash();
        dto.status = s.getStatus();
        dto.submittedAt = s.getSubmittedAt();
        dto.createdAt = s.getCreatedAt();
        dto.isAnonymousView = true;
        dto.authorPseudonym = pseudonym != null ? pseudonym : "Anonymous Author";
        return dto;
    }

    /** For the Author themselves  full details visible. */
    public static SubmissionDto forAuthor(Submission s) {
        SubmissionDto dto = new SubmissionDto();
        dto.id = s.getId();
        dto.assignmentId = s.getAssignment() != null ? s.getAssignment().getId() : null;
        dto.assignmentTitle = s.getAssignment() != null ? s.getAssignment().getTitle() : null;
        dto.originalFileName = s.getOriginalFileName();
        dto.fileSize = s.getFileSize();
        dto.fileType = s.getFileType();
        dto.filePath = s.getFilePath();
        dto.fileHash = s.getFileHash();
        dto.status = s.getStatus();
        dto.submittedAt = s.getSubmittedAt();
        dto.createdAt = s.getCreatedAt();
        dto.isAnonymousView = false;
        if (s.getAuthor() != null) {
            dto.authorId = s.getAuthor().getId();
            dto.authorName = s.getAuthor().getFullName();
            dto.authorEmail = s.getAuthor().getEmail();
            dto.authorDepartment = s.getAuthor().getDepartment();
        }
        return dto;
    }

    /** For Instructors/Admins � administrative view with author details. */
    public static SubmissionDto forAdministration(Submission s) { return forAuthor(s); }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
    public String getAssignmentTitle() { return assignmentTitle; }
    public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    public String getFileSize() { return fileSize; }
    public void setFileSize(String fileSize) { this.fileSize = fileSize; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getFileHash() { return fileHash; }
    public void setFileHash(String fileHash) { this.fileHash = fileHash; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getAuthorPseudonym() { return authorPseudonym; }
    public void setAuthorPseudonym(String authorPseudonym) { this.authorPseudonym = authorPseudonym; }
    public boolean isAnonymousView() { return isAnonymousView; }
    public void setAnonymousView(boolean anonymousView) { isAnonymousView = anonymousView; }
    public String getAuthorId() { return authorId; }
    public void setAuthorId(String authorId) { this.authorId = authorId; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public String getAuthorEmail() { return authorEmail; }
    public void setAuthorEmail(String authorEmail) { this.authorEmail = authorEmail; }
    public String getAuthorDepartment() { return authorDepartment; }
    public void setAuthorDepartment(String authorDepartment) { this.authorDepartment = authorDepartment; }
}
