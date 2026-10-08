package com.trustreview.controller;

import com.trustreview.dto.*;
import com.trustreview.model.User;
import com.trustreview.repository.UserRepository;
import com.trustreview.service.AppealService;
import com.trustreview.service.QuorumService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AppealController {

    private final AppealService appealService;
    private final QuorumService quorumService;
    private final UserRepository userRepository;
    private final ClientIpResolver clientIpResolver;

    public AppealController(AppealService appealService,
                            QuorumService quorumService,
                            UserRepository userRepository,
                            ClientIpResolver clientIpResolver) {
        this.appealService = appealService;
        this.quorumService = quorumService;
        this.userRepository = userRepository;
        this.clientIpResolver = clientIpResolver;
    }

    /**
     * POST /api/appeals — STUDENT only.
     * Submits an appeal against a completed peer review. Auto-generates linked DisclosureRequest.
     */
    @PostMapping("/appeals")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> createAppeal(
            @Valid @RequestBody CreateAppealRequest req,
            Authentication auth,
            HttpServletRequest httpRequest) {
        try {
            User appellant = resolveUser(auth);
            String clientIp = clientIpResolver.resolveClientIp(httpRequest);
            AppealDto dto = appealService.createAppeal(req, appellant, clientIp);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    /**
     * GET /api/appeals/my-appeals — STUDENT only.
     * Returns all appeals submitted by the logged-in student.
     */
    @GetMapping("/appeals/my-appeals")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<AppealDto>> getMyAppeals(Authentication auth) {
        User appellant = resolveUser(auth);
        return ResponseEntity.ok(appealService.getMyAppeals(appellant));
    }

    /**
     * GET /api/appeals/pending — COMMITTEE, ADMIN, INSTRUCTOR.
     * Returns open disputes awaiting adjudication.
     */
    @GetMapping("/appeals/pending")
    @PreAuthorize("hasAnyRole('COMMITTEE','ADMIN','INSTRUCTOR')")
    public ResponseEntity<List<AppealDto>> getPendingAppeals() {
        return ResponseEntity.ok(appealService.getPendingAppeals());
    }

    /**
     * POST /api/appeals/{id}/resolve — COMMITTEE, ADMIN (Phase 4 legacy single-admin path).
     * Retained for backward compatibility; Phase 5 uses /vote instead.
     */
    @PostMapping("/appeals/{id}/resolve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resolveAppeal(
            @PathVariable String id,
            @Valid @RequestBody ResolveAppealRequest req,
            Authentication auth) {
        try {
            User resolver = resolveUser(auth);
            AppealDto dto = appealService.resolveAppeal(id, req, resolver);
            return ResponseEntity.ok(dto);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }

    // ── Phase 5: Quorum Voting Endpoints ─────────────────────────────────────

    /**
     * POST /api/appeals/{id}/vote — COMMITTEE only.
     * Casts an individual quorum vote (APPROVE or REJECT) on the disclosure request.
     * Returns the updated QuorumStatusDto after evaluating the quorum threshold.
     * Returns 409 Conflict if the caller has already voted.
     */
    @PostMapping("/appeals/{id}/vote")
    @PreAuthorize("hasRole('COMMITTEE')")
    public ResponseEntity<?> castVote(
            @PathVariable String id,
            @Valid @RequestBody CastVoteRequest req,
            Authentication auth) {
        try {
            User voter = resolveUser(auth);
            QuorumStatusDto status = quorumService.castVote(id, voter, req.getDecision(), req.getRationale());
            return ResponseEntity.ok(status);
        } catch (IllegalStateException ex) {
            // Duplicate vote or closed request
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse(false, ex.getMessage()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    /**
     * GET /api/appeals/{id}/votes — COMMITTEE, ADMIN, INSTRUCTOR.
     * Returns the current quorum tally: vote breakdown, threshold progress, and per-member votes.
     */
    @GetMapping("/appeals/{id}/votes")
    @PreAuthorize("hasAnyRole('COMMITTEE','ADMIN','INSTRUCTOR')")
    public ResponseEntity<?> getVotes(@PathVariable String id, Authentication auth) {
        try {
            User user = resolveUser(auth);
            QuorumStatusDto status = quorumService.getQuorumStatus(id, user);
            return ResponseEntity.ok(status);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    /**
     * GET /api/reviews/{id}/disclosed-identity.
     * Returns reviewer identity strictly bounded by approved DisclosureLevel.
     * Defaults to LEVEL_0_ANONYMOUS unless disclosure quorum is APPROVED.
     */
    @GetMapping("/reviews/{id}/disclosed-identity")
    public ResponseEntity<?> getDisclosedIdentity(@PathVariable String id, Authentication auth) {
        try {
            User user = resolveUser(auth);
            DisclosedIdentityDto dto = appealService.getDisclosedIdentity(id, user);
            return ResponseEntity.ok(dto);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    private User resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}