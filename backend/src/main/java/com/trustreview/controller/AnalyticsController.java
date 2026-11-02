package com.trustreview.controller;

import com.trustreview.dto.AnalyticsDashboardDto;
import com.trustreview.model.User;
import com.trustreview.security.PeerityUserDetails;
import com.trustreview.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * GET /api/analytics/dashboard — INSTRUCTOR and ADMIN.
     * Returns operational review stats, score histograms, dispute metrics, and disclosure tier counts.
     * Scoped to the instructor's own created assignments if caller is INSTRUCTOR.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<AnalyticsDashboardDto> getDashboardMetrics(@AuthenticationPrincipal PeerityUserDetails principal) {
        User user = principal != null ? principal.getUser() : null;
        return ResponseEntity.ok(analyticsService.getDashboardMetrics(user));
    }
}
