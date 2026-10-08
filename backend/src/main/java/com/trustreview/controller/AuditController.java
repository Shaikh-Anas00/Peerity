package com.trustreview.controller;

import com.trustreview.dto.AuditLogDto;
import com.trustreview.dto.IntegrityVerificationResult;
import com.trustreview.service.AuditLedgerService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditLedgerService auditLedgerService;

    public AuditController(AuditLedgerService auditLedgerService) {
        this.auditLedgerService = auditLedgerService;
    }

    /**
     * GET /api/audit/logs — ADMIN and COMMITTEE.
     * Returns paginated audit feed ordered by sequenceNumber DESC.
     * COMMITTEE access is consistent with their access to /audit/verify and the
     * frontend route guard which admits both roles to /admin/audit.
     */
    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMMITTEE')")
    public ResponseEntity<Page<AuditLogDto>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLedgerService.getLogs(page, size));
    }

    /**
     * GET /api/audit/verify — ADMIN and COMMITTEE.
     * Mathematically verifies the cryptographic hash chain from genesis to tip.
     */
    @GetMapping("/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMMITTEE')")
    public ResponseEntity<IntegrityVerificationResult> verifyLedger() {
        return ResponseEntity.ok(auditLedgerService.verifyIntegrity());
    }
}
