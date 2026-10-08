package com.trustreview.dto;

import com.trustreview.model.AuditLog;
import java.time.Instant;

public class AuditLogDto {

    private String id;
    private Long sequenceNumber;
    private String action;
    private String actorEmail;
    private String targetEntity;
    private String targetId;
    private String payloadHash;
    private String previousEntryHash;
    private String currentEntryHash;
    private Instant timestamp;
    private String details;
    private String ipAddress;

    public AuditLogDto() {}

    public AuditLogDto(AuditLog auditLog) {
        this.id = auditLog.getId();
        this.sequenceNumber = auditLog.getSequenceNumber();
        this.action = auditLog.getAction();
        this.actorEmail = auditLog.getActorEmail();
        this.targetEntity = auditLog.getTargetEntity();
        this.targetId = auditLog.getTargetId();
        this.payloadHash = auditLog.getPayloadHash();
        this.previousEntryHash = auditLog.getPreviousEntryHash();
        this.currentEntryHash = auditLog.getCurrentEntryHash();
        this.timestamp = auditLog.getTimestamp();
        this.details = auditLog.getDetails();
        this.ipAddress = auditLog.getIpAddress();
    }

    public static AuditLogDto from(AuditLog log) {
        return new AuditLogDto(log);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getSequenceNumber() { return sequenceNumber; }
    public void setSequenceNumber(Long sequenceNumber) { this.sequenceNumber = sequenceNumber; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }

    public String getTargetEntity() { return targetEntity; }
    public void setTargetEntity(String targetEntity) { this.targetEntity = targetEntity; }

    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }

    public String getPayloadHash() { return payloadHash; }
    public void setPayloadHash(String payloadHash) { this.payloadHash = payloadHash; }

    public String getPreviousEntryHash() { return previousEntryHash; }
    public void setPreviousEntryHash(String previousEntryHash) { this.previousEntryHash = previousEntryHash; }

    public String getCurrentEntryHash() { return currentEntryHash; }
    public void setCurrentEntryHash(String currentEntryHash) { this.currentEntryHash = currentEntryHash; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
}
