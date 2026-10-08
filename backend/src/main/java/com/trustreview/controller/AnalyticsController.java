package com.trustreview.controller;

import com.trustreview.dto.AnalyticsDashboardDto;
import com.trustreview.model.User;
import com.trustreview.repository.UserRepository;
import com.trustreview.service.AnalyticsService;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    public AnalyticsController(AnalyticsService analyticsService, UserRepository userRepository) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/analytics/dashboard — INSTRUCTOR and ADMIN.
     * Returns operational review stats, score histograms, dispute metrics, and disclosure tier counts.
     * Scoped to the instructor's own created assignments if caller is INSTRUCTOR.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<AnalyticsDashboardDto> getDashboardMetrics(Authentication auth) {
        User user = null;
        if (auth != null && auth.isAuthenticated()) {
            user = userRepository.findByEmail(auth.getName()).orElse(null);
        }
        return ResponseEntity.ok(analyticsService.getDashboardMetrics(user));
    }
}
