package com.trustreview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * A single-use, time-limited password reset token.
 *
 * Only the SHA-256 hash of the token is ever persisted — the raw token exists solely in the
 * reset link handed to the user (currently via server log, see PasswordResetService; a real
 * email provider can be swapped in later without touching this entity), the same way password
 * hashes, never plaintext passwords, are what gets stored.
 */
@Entity
@Table(name = "password_reset_tokens",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_reset_token_hash", columnNames = {"token_hash"})
       },
       indexes = {
           @Index(name = "idx_reset_token_user", columnList = "user_id")
       })
public class PasswordResetToken {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token_hash", length = 64, nullable = false)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean used;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PasswordResetToken() {
        this.id = UUID.randomUUID().toString();
    }

    public PasswordResetToken(User user, String tokenHash, LocalDateTime expiresAt) {
        this.id = UUID.randomUUID().toString();
        this.user = user;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.used = false;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getTokenHash() { return tokenHash; }
    public void setTokenHash(String tokenHash) { this.tokenHash = tokenHash; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
