package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.SubmissionDto;
import com.trustreview.model.User;
import com.trustreview.repository.UserRepository;
import com.trustreview.service.AssignmentService;
import com.trustreview.service.ReviewService;
import com.trustreview.service.SubmissionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class SubmissionController {

    private static final Logger logger = LoggerFactory.getLogger(SubmissionController.class);

    private final SubmissionService submissionService;
    private final AssignmentService assignmentService;
    private final ReviewService reviewService;
    private final UserRepository userRepository;

    public SubmissionController(SubmissionService submissionService,
                                AssignmentService assignmentService,
                                ReviewService reviewService,
                                UserRepository userRepository) {
        this.submissionService = submissionService;
        this.assignmentService = assignmentService;
        this.reviewService = reviewService;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/submissions -- STUDENT only
     * Accepts multipart/form-data containing assignmentId and file.
     * Forwards payload to PHP sidecar for AES-256-GCM encryption.
     */
    @PostMapping(value = "/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> submitWithFile(
            @RequestParam("assignmentId") String assignmentId,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        try {
            User author = resolveUser(auth);
            SubmissionDto dto = submissionService.createWithFile(assignmentId, file, author);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        } catch (Exception ex) {
            logger.error("Submission failed with error: ", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "File upload and encryption failed: " + ex.getMessage()));
        }
    }

    /**
     * GET /api/submissions/{id}/file
     * Downloads and decrypts the submission file on the fly.
     * Enforces RBAC: author, assigned reviewer, or instructor/admin.
     */
    @GetMapping("/submissions/{id}/file")
    public ResponseEntity<?> downloadFile(@PathVariable String id, Authentication auth) {
        try {
            User user = resolveUser(auth);
            SubmissionService.DecryptedFilePayload payload = submissionService.getSubmissionFile(id, user);

            String contentType = payload.fileType() != null && !payload.fileType().isBlank()
                    ? payload.fileType()
                    : MediaType.APPLICATION_OCTET_STREAM_VALUE;

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.originalFileName() + "\"")
                    .header("X-Content-Type-Options", "nosniff")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(payload.data().length)
                    .body(payload.data());
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse(false, ex.getMessage()));
        } catch (Exception ex) {
            logger.error("Failed to decrypt and stream file for submission {}: ", id, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false, "File decryption failed: " + ex.getMessage()));
        }
    }

    /** GET /api/submissions/my -- STUDENT's own submissions */
    @GetMapping("/submissions/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<SubmissionDto>> mySubmissions(Authentication auth) {
        User user = resolveUser(auth);
        return ResponseEntity.ok(submissionService.findMySubmissions(user));
    }

    /**
     * POST /api/assignments/{id}/distribute -- INSTRUCTOR/ADMIN
     * Body (optional): { "reviewerCount": 2 }
     */
    @PostMapping("/assignments/{id}/distribute")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<?> distribute(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Integer> body,
            Authentication auth) {
        try {
            int count = (body != null && body.containsKey("reviewerCount"))
                    ? body.get("reviewerCount") : 2;
            User requestor = resolveUser(auth);
            Map<String, Object> result = reviewService.distribute(id, count, requestor);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }

    private User resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}