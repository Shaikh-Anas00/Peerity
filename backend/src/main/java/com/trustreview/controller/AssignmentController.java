package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.AssignmentDto;
import com.trustreview.dto.CreateAssignmentRequest;
import com.trustreview.model.User;
import com.trustreview.security.PeerityUserDetails;
import com.trustreview.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    /** POST /api/assignments — INSTRUCTOR or ADMIN only */
    @PostMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody CreateAssignmentRequest req,
                                    @AuthenticationPrincipal PeerityUserDetails principal) {
        User creator = principal.getUser();
        AssignmentDto dto = assignmentService.create(req, creator);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /** GET /api/assignments — All authenticated users */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AssignmentDto>> findAll(@AuthenticationPrincipal PeerityUserDetails principal) {
        User user = principal != null ? principal.getUser() : null;
        return ResponseEntity.ok(assignmentService.findAll(user));
    }

    /** GET /api/assignments/{id} — All authenticated users */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> findById(@PathVariable String id, @AuthenticationPrincipal PeerityUserDetails principal) {
        User user = principal != null ? principal.getUser() : null;
        return assignmentService.findById(id, user)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Assignment not found")));
    }
}
