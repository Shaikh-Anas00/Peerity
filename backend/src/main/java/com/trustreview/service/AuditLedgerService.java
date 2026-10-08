package com.trustreview.service;

import com.trustreview.dto.AuditLogDto;
import com.trustreview.dto.IntegrityVerificationResult;
import com.trustreview.model.AuditLog;
import com.trustreview.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * Phase 6: Tamper-Evident HMAC-SHA-256 Hash-Chained Audit Ledger Service.
 *
 * Provides synchronized, atomic block appending and on-demand mathematical
 * verification of the entire cryptographic chain from genesis to tip.
 * Uses HMAC-SHA256 keyed with application runtime secret to prevent database
 * administrators or attackers with SQL access from forging valid chain hashes.
 */
@Service
public class AuditLedgerService {

    private static final Logger log = LoggerFactory.getLogger(AuditLedgerService.class);

    public static final String GENESIS_HASH =
            "0000000000000000000000000000000000000000000000000000000000000000";

    @Value("${audit.ledger.hmac-secret:TrustReview-Audit-Ledger-HMAC-Secret-Key-Phase6-Production-Grade}")
    private String hmacSecret;

    private final AuditLogRepository auditLogRepository;

    public AuditLedgerService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Synchronized and transactional method to append a new cryptographically chained audit block.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public synchronized AuditLog logEvent(String action, String actorEmail,
                                          String targetEntity, String targetId,
                                          String details, String ipAddress) {

        Optional<AuditLog> latestOpt = auditLogRepository.findTopByOrderBySequenceNumberDesc();

        long sequenceNumber;
        String previousEntryHash;

        if (latestOpt.isEmpty()) {
            sequenceNumber = 1L;
            previousEntryHash = GENESIS_HASH;
        } else {
            AuditLog prev = latestOpt.get();
            sequenceNumber = prev.getSequenceNumber() + 1L;
            previousEntryHash = prev.getCurrentEntryHash();
        }

        Instant timestamp = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        String payloadHash = computePayloadHash(details);
        String currentEntryHash = computeCurrentEntryHash(
                previousEntryHash, payloadHash, sequenceNumber, action, actorEmail, targetId, timestamp);

        AuditLog entry = new AuditLog(
                sequenceNumber,
                action,
                actorEmail,
                targetEntity,
                targetId,
                payloadHash,
                previousEntryHash,
                currentEntryHash,
                timestamp,
                details,
                ipAddress
        );

        AuditLog saved = auditLogRepository.saveAndFlush(entry);
        log.info("Ledger Block #{} appended: action={}, actor={}, hash={}",
                sequenceNumber, action, actorEmail, currentEntryHash.substring(0, 16) + "...");
        return saved;
    }

    /**
     * Convenience overload without IP address.
     */
    @Transactional
    public AuditLog logEvent(String action, String actorEmail, String targetEntity, String targetId, String details) {
        return logEvent(action, actorEmail, targetEntity, targetId, details, "N/A");
    }

    /**
     * Convenience overload with basic parameters.
     */
    @Transactional
    public AuditLog logEvent(String action, String actorEmail, String targetEntity, String targetId) {
        return logEvent(action, actorEmail, targetEntity, targetId, null, "N/A");
    }

    /**
     * Traverses the entire audit table in ascending sequence order.
     * Validates:
     * 1. Sequence continuity (1, 2, 3...)
     * 2. Genesis pointer for block #1
     * 3. Previous hash pointer alignment (block N.prevHash == block N-1.currentHash)
     * 4. Cryptographic recalculation of currentEntryHash for every single block
     */
    @Transactional(readOnly = true)
    public IntegrityVerificationResult verifyIntegrity() {
        List<AuditLog> chain = auditLogRepository.findAllByOrderBySequenceNumberAsc();

        if (chain.isEmpty()) {
            return new IntegrityVerificationResult(
                    true, 0, null, Instant.now(), "Ledger is empty (Genesis pending).");
        }

        String expectedPrevHash = GENESIS_HASH;
        long expectedSequence = 1L;

        for (AuditLog entry : chain) {
            long seq = entry.getSequenceNumber() != null ? entry.getSequenceNumber() : -1L;

            // 1. Sequence number continuity check
            if (seq != expectedSequence) {
                return new IntegrityVerificationResult(
                        false,
                        chain.size(),
                        seq > 0 ? seq : expectedSequence,
                        Instant.now(),
                        "Sequence break detected! Expected sequence #" + expectedSequence + " but found #" + seq
                );
            }

            // 2. Previous hash link check
            if (!expectedPrevHash.equalsIgnoreCase(entry.getPreviousEntryHash())) {
                return new IntegrityVerificationResult(
                        false,
                        chain.size(),
                        seq,
                        Instant.now(),
                        "Broken hash link at sequence #" + seq + "! Expected previous hash "
                                + expectedPrevHash.substring(0, 16) + "... but found "
                                + (entry.getPreviousEntryHash() != null ? entry.getPreviousEntryHash().substring(0, 16) + "..." : "null")
                );
            }

            // 3. Cryptographic recalculation
            String recalculatedHash = computeCurrentEntryHash(
                    entry.getPreviousEntryHash(),
                    entry.getPayloadHash(),
                    entry.getSequenceNumber(),
                    entry.getAction(),
                    entry.getActorEmail(),
                    entry.getTargetId(),
                    entry.getTimestamp()
            );

            if (!recalculatedHash.equalsIgnoreCase(entry.getCurrentEntryHash())) {
                log.warn("HMAC mismatch at seq #{}: stored={}, calculated={}, prev={}, payloadHash={}, seq={}, action={}, actor={}, target={}, tsSec={}",
                        seq, entry.getCurrentEntryHash(), recalculatedHash,
                        entry.getPreviousEntryHash(), entry.getPayloadHash(), entry.getSequenceNumber(),
                        entry.getAction(), entry.getActorEmail(), entry.getTargetId(),
                        entry.getTimestamp().getEpochSecond());
                return new IntegrityVerificationResult(
                        false,
                        chain.size(),
                        seq,
                        Instant.now(),
                        "Tampering detected at sequence #" + seq + "! Stored HMAC-SHA256 digest does not match recalculated hash."
                );
            }

            expectedPrevHash = entry.getCurrentEntryHash();
            expectedSequence++;
        }

        return new IntegrityVerificationResult(
                true,
                chain.size(),
                null,
                Instant.now(),
                "Cryptographic HMAC-SHA256 chain verified: " + chain.size() + " blocks validated, zero tampering detected."
        );
    }

    /**
     * Paginated audit log retrieval for admin dashboard.
     */
    @Transactional(readOnly = true)
    public Page<AuditLogDto> getLogs(int page, int size) {
        return auditLogRepository.findAllByOrderBySequenceNumberDesc(PageRequest.of(page, size))
                .map(AuditLogDto::from);
    }

    // ── Cryptographic Hashing Algorithms ───────────────────────────────────────

    public static String computePayloadHash(String payload) {
        if (payload == null) {
            payload = "";
        }
        return sha256Hex(payload);
    }

    /**
     * Formal ledger hash: currentEntryHash = HmacSHA256(hmacSecret, previousEntryHash + payloadHash + sequenceNumber + action + actorEmail + targetId + timestamp)
     */
    public String computeCurrentEntryHash(String previousEntryHash, String payloadHash,
                                          Long sequenceNumber, String action,
                                          String actorEmail, String targetId,
                                          Instant timestamp) {
        return computeCurrentEntryHash(this.hmacSecret, previousEntryHash, payloadHash,
                sequenceNumber, action, actorEmail, targetId, timestamp);
    }

    public static String computeCurrentEntryHash(String secret, String previousEntryHash, String payloadHash,
                                                 Long sequenceNumber, String action,
                                                 String actorEmail, String targetId,
                                                 Instant timestamp) {
        String data = (previousEntryHash != null ? previousEntryHash : GENESIS_HASH)
                + (payloadHash != null ? payloadHash : "")
                + (sequenceNumber != null ? sequenceNumber : 0L)
                + (action != null ? action : "")
                + (actorEmail != null ? actorEmail : "")
                + (targetId != null ? targetId : "")
                + (timestamp != null ? timestamp.getEpochSecond() : 0L);
        return hmacSha256Hex(secret, data);
    }

    public static String hmacSha256Hex(String secret, String input) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(
                    (secret != null ? secret : "TrustReview-Audit-Ledger-HMAC-Secret-Key-Phase6-Production-Grade")
                            .getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(keySpec);
            byte[] hash = mac.doFinal(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new RuntimeException("HMAC-SHA256 execution failed", e);
        }
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
