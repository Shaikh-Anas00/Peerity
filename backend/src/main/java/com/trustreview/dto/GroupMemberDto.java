package com.trustreview.dto;

import com.trustreview.model.GroupMembership;

public class GroupMemberDto {
    private String membershipId;
    private String userId;
    private String userName;
    private String userEmail;
    private String role;    // LEADER | MEMBER
    private String status;  // PENDING | ACTIVE | REMOVED
    private String joinedAt;

    public static GroupMemberDto from(GroupMembership m) {
        GroupMemberDto dto = new GroupMemberDto();
        dto.setMembershipId(m.getId());
        dto.setUserId(m.getUser().getId());
        dto.setUserName(m.getUser().getFullName());
        dto.setUserEmail(m.getUser().getEmail());
        dto.setRole(m.getRole().name());
        dto.setStatus(m.getStatus().name());
        dto.setJoinedAt(m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
        return dto;
    }

    public String getMembershipId() { return membershipId; }
    public void setMembershipId(String membershipId) { this.membershipId = membershipId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getJoinedAt() { return joinedAt; }
    public void setJoinedAt(String joinedAt) { this.joinedAt = joinedAt; }
}
