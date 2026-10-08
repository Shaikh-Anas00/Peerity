package com.trustreview.dto;

public class GroupDto {
    private String id;
    private String name;
    private String description;
    private String status;
    private String assignmentId;
    private String assignmentTitle;
    private int activeMemberCount;
    private int pendingMemberCount;
    private String createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAssignmentId() { return assignmentId; }
    public void setAssignmentId(String assignmentId) { this.assignmentId = assignmentId; }
    public String getAssignmentTitle() { return assignmentTitle; }
    public void setAssignmentTitle(String assignmentTitle) { this.assignmentTitle = assignmentTitle; }
    public int getActiveMemberCount() { return activeMemberCount; }
    public void setActiveMemberCount(int activeMemberCount) { this.activeMemberCount = activeMemberCount; }
    public int getPendingMemberCount() { return pendingMemberCount; }
    public void setPendingMemberCount(int pendingMemberCount) { this.pendingMemberCount = pendingMemberCount; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
