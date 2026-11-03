package com.trustreview.service;

import com.trustreview.dto.CryptoEncryptResponse;
import com.trustreview.dto.SubmissionDto;
import com.trustreview.model.Assignment;
import com.trustreview.model.CourseRoom;
import com.trustreview.model.Role;
import com.trustreview.model.Submission;
import com.trustreview.model.User;
import com.trustreview.repository.AssignmentRepository;
import com.trustreview.repository.CourseRoomRepository;
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
    private final FileCryptoService fileCryptoService;
    private final AuditLedgerService auditLedgerService;
    private final CourseRoomRepository courseRoomRepository;
    private final CourseRoomService courseRoomService;

    public record DecryptedFilePayload(byte[] data, String originalFileName, String fileType) {}

    @org.springframework.beans.factory.annotation.Autowired
    public SubmissionService(SubmissionRepository submissionRepository,
                             AssignmentRepository assignmentRepository,
                             ReviewRepository reviewRepository,
                             FileCryptoService fileCryptoService,
                             AuditLedgerService auditLedgerService,
                             CourseRoomRepository courseRoomRepository,
                             CourseRoomService courseRoomService) {
        this.submissionRepository = submissionRepository;
        this.assignmentRepository = assignmentRepository;
        this.reviewRepository = reviewRepository;
        this.fileCryptoService = fileCryptoService;
        this.auditLedgerService = auditLedgerService;
        this.courseRoomRepository = courseRoomRepository;
        this.courseRoomService = courseRoomService;
    }

    public SubmissionService(SubmissionRepository submissionRepository,
                             AssignmentRepository assignmentRepository,
                             ReviewRepository reviewRepository,
                             FileCryptoService fileCryptoService,
                             AuditLedgerService auditLedgerService) {
        this(submissionRepository, assignmentRepository, reviewRepository, fileCryptoService, auditLedgerService, null, null);
    }

    /**
     * Handles multipart file upload, encrypts it in-process with AES-256-GCM, and persists
     * submission metadata and SHA-256 hash.
     */
    @Transactional
    public SubmissionDto createWithFile(String assignmentId, MultipartFile file, User author) throws IOException {
        return createWithFile(assignmentId, file, author, null);
    }

    @Transactional
    public SubmissionDto createWithFile(String assignmentId, MultipartFile file, User author, String courseRoomId) throws IOException {
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

        CourseRoom courseRoom = null;
        if (courseRoomId != null && !courseRoomId.isBlank() && courseRoomRepository != null) {
            courseRoom = courseRoomRepository.findById(courseRoomId)
                    .orElseThrow(() -> new IllegalArgumentException("Course room not found: " + courseRoomId));
        } else if (assignment.getCourseRoom() != null) {
            courseRoom = assignment.getCourseRoom();
        }

        if (courseRoom != null) {
            if (assignment.getCourseRoom() != null && !courseRoom.getId().equals(assignment.getCourseRoom().getId())) {
                throw new IllegalArgumentException("Assignment does not belong to the specified course room.");
            }
            if (!courseRoom.isActive()) {
                throw new IllegalStateException("This course room is no longer active.");
            }
            if (courseRoomService != null) {
                courseRoomService.validateStudentEnrollment(courseRoom, author);
            }
        }

        // 1. Encrypt multipart file in-process using AES-256-GCM
        CryptoEncryptResponse cryptoResp = fileCryptoService.encryptFile(file);

        // 2. Persist submission record
        Submission s = new Submission();
        s.setAssignment(assignment);
        s.setAuthor(author);
        s.setCourseRoom(courseRoom);
        s.setOriginalFileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "submission.pdf");
        s.setFileSize(formatFileSize(file.getSize()));
        s.setFileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream");
        s.setFilePath(cryptoResp.getEncryptedFileName());
        s.setFileHash(cryptoResp.getFileHash());
        s.setStatus("SUBMITTED");
        s.setSubmittedAt(LocalDateTime.now());

        Submission saved = submissionRepository.save(s);
        logger.info("Saved submission id={} with encryptedPath={}, sha256={}, courseRoom={}",
                saved.getId(), saved.getFilePath(), saved.getFileHash(), courseRoom != null ? courseRoom.getId() : "none");

        // Phase 6: Log cryptographically chained audit event
        auditLedgerService.logEvent(
                "SUBMISSION_ENCRYPTED",
                author.getEmail(),
                "Submission",
                saved.getId(),
                "Encrypted file: " + saved.getOriginalFileName() + " | SHA-256: " + saved.getFileHash() + " | Size: " + saved.getFileSize()
                + (courseRoom != null ? " | Room: " + courseRoom.getName() : "")
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

        // If submission belongs to a CourseRoom, verify instructor ownership if requester is an instructor
        if (submission.getCourseRoom() != null && requester.getRole() == Role.INSTRUCTOR) {
            boolean ownsRoom = submission.getCourseRoom().getInstructor() != null
                    && submission.getCourseRoom().getInstructor().getId().equals(requester.getId());
            if (!ownsRoom) {
                logger.warn("Instructor {} does not own course room {} for submission {}", requester.getId(), submission.getCourseRoom().getId(), submissionId);
                throw new SecurityException("You are not the instructor for this submission's course room.");
            }
        }

        logger.info("User {} authorized to download submission {}. Decrypting in-process...",
                requester.getId(), submissionId);

        byte[] decryptedBytes = fileCryptoService.decryptFile(submission.getFilePath());

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
        return findMySubmissions(author, null);
    }

    @Transactional(readOnly = true)
    public List<SubmissionDto> findMySubmissions(User author, String courseRoomId) {
        if (courseRoomId != null && !courseRoomId.isBlank() && courseRoomRepository != null) {
            CourseRoom room = courseRoomRepository.findById(courseRoomId).orElse(null);
            if (room != null) {
                return submissionRepository.findByAuthorAndCourseRoomOrderBySubmittedAtDesc(author, room)
                        .stream().map(SubmissionDto::forAuthor).collect(Collectors.toList());
            }
        }
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
