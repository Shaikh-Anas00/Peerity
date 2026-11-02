package com.trustreview.controller;

import com.trustreview.dto.*;
import com.trustreview.model.User;
import com.trustreview.security.PeerityUserDetails;
import com.trustreview.service.GroupService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * REST controller for Group Formation and Group Member Evaluation.
 *
 * Authorization boundary (hard rule — enforced by @PreAuthorize on every method):
 *
 *   /api/groups/{id}/evaluations/my-aggregate  → STUDENT only (aggregate, no evaluator names)
 *   /api/groups/{id}/evaluations/all           → INSTRUCTOR, ADMIN only (full attribution, audit logged)
 *   COMMITTEE → 403 on the /all endpoint intentionally (accountability via audit, not grievance access)
 */
@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final ClientIpResolver clientIpResolver;

    public GroupController(GroupService groupService,
                           ClientIpResolver clientIpResolver) {
        this.groupService = groupService;
        this.clientIpResolver = clientIpResolver;
    }

    /** POST /api/groups — INSTRUCTOR or ADMIN creates a group */
    @PostMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<GroupDto> createGroup(@RequestBody CreateGroupRequest request,
                                                @AuthenticationPrincipal PeerityUserDetails principal,
                                                HttpServletRequest req) {
        User user = principal.getUser();
        String ip = clientIpResolver.resolveClientIp(req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(groupService.createGroup(request, user, ip));
    }

    /** GET /api/groups — INSTRUCTOR or ADMIN lists all groups (paginated) */
    @GetMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<Page<GroupDto>> getAllGroups(
            @RequestParam(required = false) String assignmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(groupService.getAllGroups(assignmentId, page, size));
    }

    /** GET /api/groups/my — any authenticated user sees their own groups */
    @GetMapping("/my")
    public ResponseEntity<List<GroupDto>> getMyGroups(@AuthenticationPrincipal PeerityUserDetails principal) {
        User user = principal.getUser();
        return ResponseEntity.ok(groupService.getMyGroups(user.getId()));
    }

    /** POST /api/groups/{groupId}/join — STUDENT joins a group (goes to PENDING until approved) */
    @PostMapping("/{groupId}/join")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse> joinGroup(@PathVariable String groupId,
                                                 @AuthenticationPrincipal PeerityUserDetails principal,
                                                 HttpServletRequest req) {
        User user = principal.getUser();
        String ip = clientIpResolver.resolveClientIp(req);
        groupService.joinGroup(groupId, user, ip);
        return ResponseEntity.ok(new ApiResponse(true, "Join request submitted."));
    }

    /** GET /api/groups/{groupId}/members — authenticated users see members of a group */
    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMemberDto>> getGroupMembers(@PathVariable String groupId) {
        try {
            return ResponseEntity.ok(groupService.getGroupMembers(groupId));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /** POST /api/groups/{groupId}/members/{userId}/approve — INSTRUCTOR or ADMIN approves a pending member */
    @PostMapping("/{groupId}/members/{userId}/approve")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse> approveMember(@PathVariable String groupId,
                                                     @PathVariable String userId,
                                                     @AuthenticationPrincipal PeerityUserDetails principal,
                                                     HttpServletRequest req) {
        User actor = principal.getUser();
        String ip = clientIpResolver.resolveClientIp(req);
        groupService.approveMember(groupId, userId, actor, ip);
        return ResponseEntity.ok(new ApiResponse(true, "Member approved."));
    }

    /** DELETE /api/groups/{groupId}/members/{userId} — INSTRUCTOR or ADMIN removes a member */
    @DeleteMapping("/{groupId}/members/{userId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse> removeMember(@PathVariable String groupId,
                                                    @PathVariable String userId,
                                                    @AuthenticationPrincipal PeerityUserDetails principal,
                                                    HttpServletRequest req) {
        User actor = principal.getUser();
        String ip = clientIpResolver.resolveClientIp(req);
        groupService.removeMember(groupId, userId, actor, ip);
        return ResponseEntity.ok(new ApiResponse(true, "Member removed."));
    }

    /**
     * DELETE /api/groups/{groupId} — INSTRUCTOR or ADMIN deletes or archives a group.
     * Guarded delete:
     * - If 0 evaluations exist: permanently deletes memberships and group.
     * - If evaluations exist and force=false: returns 409 Conflict with guidance to archive/close.
     * - If evaluations exist and force=true: sets status = CLOSED to preserve academic integrity.
     */
    @DeleteMapping("/{groupId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse> deleteGroup(@PathVariable String groupId,
                                                   @RequestParam(value = "force", defaultValue = "false") boolean force,
                                                   Authentication auth,
                                                   HttpServletRequest req) {
        User actor = resolveUser(auth);
        String ip = clientIpResolver.resolveClientIp(req);
        try {
            String resultMessage = groupService.deleteGroup(groupId, force, actor, ip);
            return ResponseEntity.ok(new ApiResponse(true, resultMessage));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse(false, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, e.getMessage()));
        }
    }

    /**
     * POST /api/groups/{groupId}/evaluations — STUDENT submits a peer evaluation.
     * The evaluator identity is stored server-side but NEVER returned to the evaluated student.
     */
    @PostMapping("/{groupId}/evaluations")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse> submitEvaluation(@PathVariable String groupId,
                                                        @RequestBody SubmitGroupEvaluationRequest request,
                                                        @AuthenticationPrincipal PeerityUserDetails principal,
                                                        HttpServletRequest req) {
        request.setGroupId(groupId);
        User evaluator = principal.getUser();
        String ip = clientIpResolver.resolveClientIp(req);
        groupService.submitEvaluation(request, evaluator, ip);
        return ResponseEntity.ok(new ApiResponse(true, "Evaluation submitted."));
    }

    /**
     * GET /api/groups/{groupId}/evaluations/my-aggregate — STUDENT views aggregate scores only.
     *
     * PRIVACY GUARANTEE: This endpoint NEVER exposes evaluator identities.
     * Feedback text is withheld if fewer than 3 evaluations have been received (k-anonymity floor).
     */
    @GetMapping("/{groupId}/evaluations/my-aggregate")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<GroupMemberEvaluationDto> getMyAggregateEvaluation(
            @PathVariable String groupId, @AuthenticationPrincipal PeerityUserDetails principal) {
        User user = principal.getUser();
        try {
            return ResponseEntity.ok(groupService.getMyAggregateEvaluation(groupId, user.getId()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * GET /api/groups/{groupId}/evaluations/all — INSTRUCTOR and ADMIN only.
     *
     * Returns FULL attributed evaluations including evaluator names.
     * Every access is audit-logged for accountability (who viewed what, when, from where).
     * COMMITTEE is intentionally excluded — they have quorum voting rights on appeals,
     * not grievance investigation rights over individual performance data.
     */
    @GetMapping("/{groupId}/evaluations/all")
    @PreAuthorize("hasAnyRole('INSTRUCTOR', 'ADMIN')")
    public ResponseEntity<List<GroupMemberEvaluationAdminDto>> getAllEvaluations(
            @PathVariable String groupId,
            @AuthenticationPrincipal PeerityUserDetails principal,
            HttpServletRequest req) {
        User actor = principal.getUser();
        String ip = clientIpResolver.resolveClientIp(req);
        try {
            return ResponseEntity.ok(groupService.getAllEvaluations(groupId, actor, ip));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }
}
