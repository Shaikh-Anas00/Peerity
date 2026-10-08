package com.trustreview.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Tamper-Evident SHA-256 Hash-Chained Audit Ledger Entry.
 *
 * Each row forms a block in a cryptographic hash chain:
 * - sequenceNumber strictly increments: 1, 2, 3...
 * - previousEntryHash points to the SHA-256 hash of row N-1 (or 64 zeroes for genesis).
 * - currentEntryHash = SHA-256(previousEntryHash + sequenceNumber + action + actorEmail + targetId + timestamp.toEpochMilli())
 */
@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_seq", columnList = "sequence_number", unique = true),
    @Index(name = "idx_audit_action", columnList = "action"),
    @Index(name = "idx_audit_actor", columnList = "actor_email")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_audit_log_sequence", columnNames = {"sequence_number"})
})
public class AuditLog {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @Column(name = "sequence_number", nullable = false, unique = true, updatable = false)
    private Long sequenceNumber;

    @Column(nullable = false, length = 100, updatable = false)
    private String action;

    @Column(name = "actor_email", length = 150, updatable = false)
    private String actorEmail;

    @Column(name = "target_entity", length = 100, updatable = false)
    private String targetEntity;

    @Column(name = "target_id", length = 36, updatable = false)
    private String targetId;

    @Column(name = "payload_hash", length = 64, nullable = false, updatable = false)
    private String payloadHash;

    @Column(name = "previous_entry_hash", length = 64, nullable = false, updatable = false)
    private String previousEntryHash;

    @Column(name = "current_entry_hash", length = 64, nullable = false, updatable = false)
    private String currentEntryHash;

    @Column(nullable = false, updatable = false)
    private Instant timestamp;

    @Column(columnDefinition = "TEXT", updatable = false)
    private String details;

    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    public AuditLog() {
        this.id = UUID.randomUUID().toString();
    }

    public AuditLog(Long sequenceNumber, String action, String actorEmail,
                    String targetEntity, String targetId, String payloadHash,
                    String previousEntryHash, String currentEntryHash,
                    Instant timestamp, String details, String ipAddress) {
        this.id = UUID.randomUUID().toString();
        this.sequenceNumber = sequenceNumber;
        this.action = action;
        this.actorEmail = actorEmail;
        this.targetEntity = targetEntity;
        this.targetId = targetId;
        this.payloadHash = payloadHash;
        this.previousEntryHash = previousEntryHash;
        this.currentEntryHash = currentEntryHash;
        this.timestamp = timestamp;
        this.details = details;
        this.ipAddress = ipAddress;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString();
        }
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }

    // Getters and Setters

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
