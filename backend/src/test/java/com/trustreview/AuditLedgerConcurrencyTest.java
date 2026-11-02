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

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Proves AuditLedgerService.logEvent() is safe under real concurrent access now that the
 * JVM-wide `synchronized` lock has been removed in favor of a DB unique-constraint + retry
 * strategy (see AuditLedgerService). Fires many threads at logEvent() simultaneously and
 * asserts the resulting sequence_number column is a gapless, duplicate-free 1..N run, and that
 * the cryptographic hash chain still verifies end-to-end.
 */
@SpringBootTest
@DisplayName("Audit Ledger Concurrency — No Lost or Duplicate Sequence Numbers Under Load")
class AuditLedgerConcurrencyTest {

    @Autowired
    private AuditLedgerService auditLedgerService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void cleanDb() {
        auditLogRepository.deleteAll();
    }

    @Test
    @DisplayName("50 concurrent logEvent() calls produce exactly sequence numbers 1..50 with a valid chain")
    void concurrentAppends_produceGaplessSequenceAndValidChain() throws InterruptedException {
        int threadCount = 50;
        ExecutorService pool = Executors.newFixedThreadPool(16);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger failures = new AtomicInteger(0);

        java.util.List<Throwable> capturedFailures = new java.util.concurrent.CopyOnWriteArrayList<>();
        for (int i = 0; i < threadCount; i++) {
            final int idx = i;
            pool.submit(() -> {
                try {
                    startLatch.await();
                    auditLedgerService.logEvent("CONCURRENT_TEST", "user" + idx + "@test.edu",
                            "Entity", "e" + idx, "payload-" + idx);
                } catch (Exception e) {
                    failures.incrementAndGet();
                    capturedFailures.add(e);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown(); // release all threads at once to maximize contention
        boolean finished = doneLatch.await(30, TimeUnit.SECONDS);
        pool.shutdown();

        assertTrue(finished, "All threads should finish within the timeout");
        assertEquals(0, failures.get(), "No logEvent() call should fail even under contention: "
                + (capturedFailures.isEmpty() ? "" : capturedFailures.get(0)));

        List<Long> sequenceNumbers = auditLogRepository.findAll().stream()
                .map(AuditLog::getSequenceNumber)
                .sorted()
                .collect(Collectors.toList());

        assertEquals(threadCount, sequenceNumbers.size(), "Every call must have produced exactly one row");
        for (int i = 0; i < threadCount; i++) {
            assertEquals((long) (i + 1), sequenceNumbers.get(i),
                    "Sequence numbers must be a gapless, duplicate-free run from 1.." + threadCount);
        }

        IntegrityVerificationResult result = auditLedgerService.verifyIntegrity();
        assertTrue(result.isValid(), "Hash chain must still verify after concurrent appends: " + result.getMessage());
        assertEquals(threadCount, result.getTotalRecords());
    }
}
