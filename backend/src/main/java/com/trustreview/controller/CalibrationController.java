package com.trustreview.controller;

import com.trustreview.dto.*;
import com.trustreview.model.CalibrationSample;
import com.trustreview.model.User;
import com.trustreview.security.PeerityUserDetails;
import com.trustreview.service.CalibrationService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calibration")
public class CalibrationController {

    private final CalibrationService calibrationService;
    private final ClientIpResolver clientIpResolver;

    public CalibrationController(CalibrationService calibrationService,
                                 ClientIpResolver clientIpResolver) {
        this.calibrationService = calibrationService;
        this.clientIpResolver = clientIpResolver;
    }

    /** GET /api/calibration/samples?assignmentId={id} — All authenticated users */
    @GetMapping("/samples")
    public ResponseEntity<List<CalibrationSampleDto>> getSamples(
            @RequestParam(required = false) String assignmentId,
            @AuthenticationPrincipal PeerityUserDetails principal) {
        User user = principal.getUser();
        return ResponseEntity.ok(calibrationService.getSamples(assignmentId, user));
    }

    /** POST /api/calibration/{sampleId}/evaluate — STUDENT */
    @PostMapping("/{sampleId}/evaluate")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> evaluateSample(
            @PathVariable String sampleId,
            @Valid @RequestBody SubmitCalibrationRequest req,
            @AuthenticationPrincipal PeerityUserDetails principal,
            HttpServletRequest httpRequest) {
        User student = principal.getUser();
        String clientIp = clientIpResolver.resolveClientIp(httpRequest);
        CalibrationResultDto result = calibrationService.evaluateCalibration(sampleId, req, student, clientIp);
        return ResponseEntity.ok(result);
    }

    /** GET /api/calibration/my-reliability — STUDENT */
    @GetMapping("/my-reliability")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ReviewerReliabilityDto> getMyReliability(@AuthenticationPrincipal PeerityUserDetails principal) {
        User student = principal.getUser();
        return ResponseEntity.ok(calibrationService.getStudentReliability(student));
    }
}
