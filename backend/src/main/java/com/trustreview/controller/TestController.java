package com.trustreview.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import com.trustreview.service.FileCryptoService;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class TestController {

    private final FileCryptoService fileCryptoService;

    public TestController(FileCryptoService fileCryptoService) {
        this.fileCryptoService = fileCryptoService;
    }

    /**
     * GET /api/test/crypto-health — ADMIN only.
     * Validates that the in-process AES-256-GCM crypto subsystem and its encrypted storage
     * directory are operational. This diagnostic endpoint is surfaced in the
     * /admin/diagnostics panel.
     */
    @GetMapping("/crypto-health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cryptoHealth() {
        return ResponseEntity.ok(fileCryptoService.checkHealth());
    }

    /**
     * RBAC protected endpoint: accessible only to users with ROLE_ADMIN or ROLE_COMMITTEE.
     * Students and Instructors will receive a 403 Forbidden.
     */
    @GetMapping("/committee-only")
    @PreAuthorize("hasAnyRole('ADMIN', 'COMMITTEE')")
    public ResponseEntity<?> committeeOnlyEndpoint(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Authorized access to Committee/Admin Tribunal endpoint.");
        response.put("principal", authentication.getName());
        response.put("authorities", authentication.getAuthorities());
        return ResponseEntity.ok(response);
    }
}
