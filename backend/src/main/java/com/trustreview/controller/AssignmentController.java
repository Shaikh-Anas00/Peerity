package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.AssignmentDto;
import com.trustreview.dto.CreateAssignmentRequest;
import com.trustreview.model.User;
import com.trustreview.repository.UserRepository;
import com.trustreview.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final UserRepository userRepository;

    public AssignmentController(AssignmentService assignmentService, UserRepository userRepository) {
        this.assignmentService = assignmentService;
        this.userRepository = userRepository;
    }

    /** POST /api/assignments � INSTRUCTOR or ADMIN only */
    @PostMapping
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<?> create(@Valid @RequestBody CreateAssignmentRequest req,
                                    Authentication auth) {
        try {
            User creator = resolveUser(auth);
            AssignmentDto dto = assignmentService.create(req, creator);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
        }
    }

    /** GET /api/assignments — All authenticated users */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AssignmentDto>> findAll(Authentication auth) {
        User user = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            user = userRepository.findByEmail(auth.getName()).orElse(null);
        }
        return ResponseEntity.ok(assignmentService.findAll(user));
    }

    /** GET /api/assignments/{id} — All authenticated users */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> findById(@PathVariable String id, Authentication auth) {
        User user = null;
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            user = userRepository.findByEmail(auth.getName()).orElse(null);
        }
        return assignmentService.findById(id, user)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse(false, "Assignment not found")));
    }

    private User resolveUser(Authentication auth) {
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }
}
