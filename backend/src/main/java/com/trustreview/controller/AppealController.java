package com.trustreview.controller;

import com.trustreview.dto.*;
import com.trustreview.model.User;
import com.trustreview.security.PeerityUserDetails;
import com.trustreview.service.AppealService;
import com.trustreview.service.QuorumService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AppealController {

    private final AppealService appealService;
    private final QuorumService quorumService;
    private final ClientIpResolver clientIpResolver;

    public AppealController(AppealService appealService,
                            QuorumService quorumService,
                            ClientIpResolver clientIpResolver) {
        this.appealService = appealService;
        this.quorumService = quorumService;
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
            @AuthenticationPrincipal PeerityUserDetails principal,
            HttpServletRequest httpRequest) {
        User appellant = principal.getUser();
        String clientIp = clientIpResolver.resolveClientIp(httpRequest);
        AppealDto dto = appealService.createAppeal(req, appellant, clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /**
     * GET /api/appeals/my-appeals — STUDENT only.
     * Returns all appeals submitted by the logged-in student.
     */
    @GetMapping("/appeals/my-appeals")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<AppealDto>> getMyAppeals(@AuthenticationPrincipal PeerityUserDetails principal) {
        User appellant = principal.getUser();
        return ResponseEntity.ok(appealService.getMyAppeals(appellant));
    }

    /**
     * GET /api/appeals/pending — COMMITTEE, ADMIN, INSTRUCTOR.
     * Returns open disputes awaiting adjudication (paginated).
     */
    @GetMapping("/appeals/pending")
    @PreAuthorize("hasAnyRole('COMMITTEE','ADMIN','INSTRUCTOR')")
    public ResponseEntity<Page<AppealDto>> getPendingAppeals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(appealService.getPendingAppeals(page, size));
    }

    // ── Phase 5: Quorum Voting Endpoints ─────────────────────────────────────
    // (The Phase 4 single-admin `/resolve` override has been removed: disclosure may only
    //  be authorized via QuorumService.castVote(), never by a unilateral admin action.)

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
            @AuthenticationPrincipal PeerityUserDetails principal) {
        try {
            User voter = principal.getUser();
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
    public ResponseEntity<?> getVotes(@PathVariable String id, @AuthenticationPrincipal PeerityUserDetails principal) {
        try {
            User user = principal.getUser();
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
    public ResponseEntity<?> getDisclosedIdentity(@PathVariable String id, @AuthenticationPrincipal PeerityUserDetails principal) {
        try {
            User user = principal.getUser();
            DisclosedIdentityDto dto = appealService.getDisclosedIdentity(id, user);
            return ResponseEntity.ok(dto);
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(false, ex.getMessage()));
        }
    }
}
