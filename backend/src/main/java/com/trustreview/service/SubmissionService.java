package com.trustreview.service;

import com.trustreview.dto.CryptoEncryptResponse;
import com.trustreview.dto.SubmissionDto;
import com.trustreview.model.Assignment;
import com.trustreview.model.Role;
import com.trustreview.model.Submission;
import com.trustreview.model.User;
import com.trustreview.repository.AssignmentRepository;
import com.trustreview.repository.ReviewRepository;
import com.trustreview.repository.SubmissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubmissionService {

    private static final Logger logger = LoggerFactory.getLogger(SubmissionService.class);

    private final SubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final ReviewRepository reviewRepository;
    private final CryptoServiceClient cryptoServiceClient;
    private final AuditLedgerService auditLedgerService;

    public record DecryptedFilePayload(byte[] data, String originalFileName, String fileType) {}

    public SubmissionService(SubmissionRepository submissionRepository,
                             AssignmentRepository assignmentRepository,
                             ReviewRepository reviewRepository,
                             CryptoServiceClient cryptoServiceClient,
                             AuditLedgerService auditLedgerService) {
        this.submissionRepository = submissionRepository;
        this.assignmentRepository = assignmentRepository;
        this.reviewRepository = reviewRepository;
        this.cryptoServiceClient = cryptoServiceClient;
        this.auditLedgerService = auditLedgerService;
    }

    /**
     * Phase 3: Handles multipart file upload, forwards to PHP sidecar for AES-256-GCM
     * encryption, and persists submission metadata and SHA-256 hash.
     */
    @Transactional
    public SubmissionDto createWithFile(String assignmentId, MultipartFile file, User author) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Submission file cannot be empty.");
        }

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment not found: " + assignmentId));

        // Server-Side Deadline Enforcement
        if (assignment.getDeadline() != null && LocalDateTime.now().isAfter(assignment.getDeadline())) {
            throw new IllegalArgumentException("Submission deadline has passed (" + assignment.getDeadline() + "). Submissions are no longer accepted.");
        }

        if (submissionRepository.existsByAuthorAndAssignment(author, assignment)) {
            throw new IllegalArgumentException("You have already submitted work for this assignment.");
        }

        // 1. Forward multipart file to PHP sidecar for AES-256-GCM encryption
        CryptoEncryptResponse cryptoResp = cryptoServiceClient.encryptFile(file);

        // 2. Persist submission record
        Submission s = new Submission();
        s.setAssignment(assignment);
        s.setAuthor(author);
        s.setOriginalFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "submission.pdf");
        s.setFileSize(formatFileSize(file.getSize()));
        s.setFileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        s.setFilePath(cryptoResp.getEncryptedFileName());
        s.setFileHash(cryptoResp.getFileHash());
        s.setStatus("SUBMITTED");
        s.setSubmittedAt(LocalDateTime.now());

        Submission saved = submissionRepository.save(s);
        logger.info("Saved submission id={} with encryptedPath={}, sha256={}",
                saved.getId(), saved.getFilePath(), saved.getFileHash());

        // Phase 6: Log cryptographically chained audit event
        auditLedgerService.logEvent(
                "SUBMISSION_ENCRYPTED",
                author.getEmail(),
                "Submission",
                saved.getId(),
                "Encrypted file: " + saved.getOriginalFileName() + " | SHA-256: " + saved.getFileHash() + " | Size: " + saved.getFileSize()
        );

        return SubmissionDto.forAuthor(saved);
    }

    /**
     * Retrieves decrypted file content.
     * Enforces RBAC: author, assigned reviewer (during review phase), or instructor/admin.
     */
    @Transactional(readOnly = true)
    public DecryptedFilePayload getSubmissionFile(String submissionId, User requester) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Submission not found: " + submissionId));

        boolean isAuthor = submission.getAuthor().getId().equals(requester.getId());
        boolean isReviewer = reviewRepository.existsByReviewerAndSubmission(requester, submission);
        boolean isStaff = requester.getRole() == Role.INSTRUCTOR || requester.getRole() == Role.ADMIN;

        if (!isAuthor && !isReviewer && !isStaff) {
            logger.warn("Unauthorized file access attempt: user={}, submission={}", requester.getId(), submissionId);
            throw new SecurityException("You are not authorized to download this submission file.");
        }

        logger.info("User {} authorized to download submission {}. Fetching plaintext from PHP sidecar...",
                requester.getId(), submissionId);

        byte[] decryptedBytes = cryptoServiceClient.decryptFile(submission.getFilePath());

        // Double-Blind Filename Masking for Reviewers
        String outputFileName = submission.getOriginalFileName();
        if (isReviewer && !isAuthor && !isStaff) {
            String ext = "pdf";
            if (outputFileName != null && outputFileName.contains(".")) {
                ext = outputFileName.substring(outputFileName.lastIndexOf('.') + 1).toLowerCase();
            }
            String aIdPrefix = "work";
            if (submission.getAssignment() != null && submission.getAssignment().getId() != null) {
                String aId = submission.getAssignment().getId();
                aIdPrefix = aId.length() >= 8 ? aId.substring(0, 8) : aId;
            }
            outputFileName = "submission_" + aIdPrefix + "." + ext;
        }

        return new DecryptedFilePayload(
                decryptedBytes,
                outputFileName,
                submission.getFileType()
        );
    }

    @Transactional(readOnly = true)
    public List<SubmissionDto> findMySubmissions(User author) {
        return submissionRepository.findByAuthorOrderBySubmittedAtDesc(author)
                .stream().map(SubmissionDto::forAuthor).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Submission> findByAssignment(Assignment assignment) {
        return submissionRepository.findByAssignmentOrderBySubmittedAtAsc(assignment);
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
    }
}