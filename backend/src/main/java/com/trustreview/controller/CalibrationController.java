package com.trustreview.controller;

import com.trustreview.dto.*;
import com.trustreview.model.CalibrationSample;
import com.trustreview.model.User;
import com.trustreview.repository.UserRepository;
import com.trustreview.service.CalibrationService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calibration")
public class CalibrationController {

    private final CalibrationService calibrationService;
    private final UserRepository userRepository;
    private final ClientIpResolver clientIpResolver;

    public CalibrationController(CalibrationService calibrationService,
                                 UserRepository userRepository,
                                 ClientIpResolver clientIpResolver) {
        this.calibrationService = calibrationService;
        this.userRepository = userRepository;
        this.clientIpResolver = clientIpResolver;
    }

    /** GET /api/calibration/samples?assignmentId={id} — All authenticated users */
    @GetMapping("/samples")
    public ResponseEntity<List<CalibrationSampleDto>> getSamples(
            @RequestParam(required = false) String assignmentId,
            Authentication auth) {
        User user = resolveUser(auth);
        return ResponseEntity.ok(calibrationService.getSamples(assignmentId, user));
    }

    /** POST /api/calibration/{sampleId}/evaluate — STUDENT */
    @PostMapping("/{sampleId}/evaluate")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> evaluateSample(
            @PathVariable String sampleId,
            @Valid @RequestBody SubmitCalibrationRequest req,
            Authentication auth,
            HttpServletRequest httpRequest) {
        try {
            User student = resolveUser(auth);
            String clientIp = clientIpResolver.resolveClientIp(httpRequest);
            CalibrationResultDto result = calibrationService.evaluateCalibration(sampleId, req, student, clientIp);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }

    /** GET /api/calibration/my-reliability — STUDENT */
    @GetMapping("/my-reliability")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ReviewerReliabilityDto> getMyReliability(Authentication auth) {
        User student = resolveUser(auth);
        return ResponseEntity.ok(calibrationService.getStudentReliability(student));
    }

    private User resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}
