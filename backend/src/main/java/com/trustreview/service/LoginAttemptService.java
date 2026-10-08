package com.trustreview.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory login brute-force protection.
 *
 * Tracks failed login attempts per client key (IP address).
 * After MAX_ATTEMPTS consecutive failures the key is locked for LOCKOUT_DURATION_SECONDS.
 * A successful login clears the counter for that key.
 *
 * NOTE: This is intentionally lightweight — no external dependency required.
 * For a clustered production deployment, replace with Redis + Bucket4j.
 */
@Service
public class LoginAttemptService {

    /** Maximum consecutive failures allowed before lockout. */
    public static final int MAX_ATTEMPTS = 5;

    /** Lock-out window in seconds after exceeding max attempts. */
    private static final long LOCKOUT_DURATION_SECONDS = 15 * 60L; // 15 minutes

    private record AttemptRecord(int count, Instant lockedUntil) {}

    /** Thread-safe map from clientKey → attempt record. */
    private final Map<String, AttemptRecord> attempts = new ConcurrentHashMap<>();

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns true if the given client key is currently locked out.
     * Automatically clears expired lockouts.
     */
    public boolean isBlocked(String clientKey) {
        AttemptRecord rec = attempts.get(clientKey);
        if (rec == null) return false;

        if (rec.count() >= MAX_ATTEMPTS) {
            if (Instant.now().isBefore(rec.lockedUntil())) {
                return true; // still within lockout window
            }
            // lockout window expired — auto-reset
            attempts.remove(clientKey);
        }
        return false;
    }

    /**
     * Records a failed login attempt.
     * If this pushes the count to MAX_ATTEMPTS, starts the lockout timer.
     */
    public void recordFailure(String clientKey) {
        attempts.compute(clientKey, (key, existing) -> {
            int newCount = (existing == null ? 0 : existing.count()) + 1;
            Instant lockedUntil = (newCount >= MAX_ATTEMPTS)
                    ? Instant.now().plusSeconds(LOCKOUT_DURATION_SECONDS)
                    : Instant.MIN; // sentinel — not yet locked
            return new AttemptRecord(newCount, lockedUntil);
        });
    }

    /**
     * Clears the failure counter on a successful login.
     */
    public void recordSuccess(String clientKey) {
        attempts.remove(clientKey);
    }

    /**
     * Returns how many seconds remain in the current lockout (0 if not locked).
     */
    public long getRemainingLockoutSeconds(String clientKey) {
        AttemptRecord rec = attempts.get(clientKey);
        if (rec == null || rec.count() < MAX_ATTEMPTS) return 0L;
        long remaining = rec.lockedUntil().getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0L, remaining);
    }
}
