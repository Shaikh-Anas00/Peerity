package com.trustreview;

import com.trustreview.dto.IntegrityVerificationResult;
import com.trustreview.model.AuditLog;
import com.trustreview.repository.AuditLogRepository;
import com.trustreview.service.AuditLedgerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Audit Ledger Service — Cryptographic Binding & Integrity Tests")
class AuditLedgerServiceTest {

    @Autowired
    private AuditLedgerService auditLedgerService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void cleanDb() {
        auditLogRepository.deleteAll();
    }

    @Test
    @DisplayName("Hash calculation explicitly binds payloadHash into currentEntryHash")
    void testPayloadHashBinding() {
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        String prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
        String payload1 = "Payload details A";
        String payload2 = "Payload details B (tampered)";

        String payloadHash1 = AuditLedgerService.computePayloadHash(payload1);
        String payloadHash2 = AuditLedgerService.computePayloadHash(payload2);

        assertNotEquals(payloadHash1, payloadHash2);

        String hash1 = auditLedgerService.computeCurrentEntryHash(
                prevHash, payloadHash1, 1L, "ACTION_A", "user@test.edu", "target-1", now);
        String hash2 = auditLedgerService.computeCurrentEntryHash(
                prevHash, payloadHash2, 1L, "ACTION_A", "user@test.edu", "target-1", now);

        // Mutating the payload alters payloadHash, which MUST alter currentEntryHash
        assertNotEquals(hash1, hash2, "Altering payloadHash must change currentEntryHash");
    }

    @Test
    @DisplayName("Appending blocks creates valid cryptographic chain verified by verifyIntegrity()")
    void testChainIntegrity() {
        AuditLog b1 = auditLedgerService.logEvent("USER_LOGIN", "alice@test.edu", "User", "u1", "Login event 1");
        AuditLog b2 = auditLedgerService.logEvent("SUBMISSION_ENCRYPTED", "alice@test.edu", "Submission", "s1", "Upload event 2");
        AuditLog b3 = auditLedgerService.logEvent("REVIEW_SUBMITTED", "bob@test.edu", "Review", "r1", "Review event 3");

        assertEquals(1L, b1.getSequenceNumber());
        assertEquals(2L, b2.getSequenceNumber());
        assertEquals(3L, b3.getSequenceNumber());

        assertEquals(b1.getCurrentEntryHash(), b2.getPreviousEntryHash());
        assertEquals(b2.getCurrentEntryHash(), b3.getPreviousEntryHash());

        IntegrityVerificationResult result = auditLedgerService.verifyIntegrity();
        assertTrue(result.isValid(), "Ledger chain must pass integrity verification");
        assertEquals(3, result.getTotalRecords());
    }

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Test
    @DisplayName("Tampering with an existing block's payload is caught by verifyIntegrity()")
    void testTamperDetection() {
        auditLedgerService.logEvent("ACTION_1", "user1@test.edu", "Entity", "e1", "Legit payload 1");
        auditLedgerService.logEvent("ACTION_2", "user2@test.edu", "Entity", "e2", "Legit payload 2");

        // Bypass JPA updatable=false to simulate direct DB tampering attack (64 hex characters)
        jdbcTemplate.update("UPDATE audit_logs SET payload_hash = ? WHERE sequence_number = 2",
                "1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff");

        IntegrityVerificationResult result = auditLedgerService.verifyIntegrity();
        assertFalse(result.isValid(), "Tampering must be detected");
        assertEquals(2L, result.getBrokenSequenceAt());
    }
}
