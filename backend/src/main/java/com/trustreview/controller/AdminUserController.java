package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.CreateUserRequest;
import com.trustreview.dto.UserDto;
import com.trustreview.service.UserService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for administrative user management.
 * Privileged accounts (INSTRUCTOR, COMMITTEE, ADMIN) can only be created via this endpoint.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;
    private final ClientIpResolver clientIpResolver;

    public AdminUserController(UserService userService, ClientIpResolver clientIpResolver) {
        this.userService = userService;
        this.clientIpResolver = clientIpResolver;
    }

    /**
     * POST /api/admin/users — ADMIN only.
     * Provisions a privileged user account with role INSTRUCTOR, COMMITTEE, or ADMIN.
     */
    @PostMapping("/users")
    public ResponseEntity<?> createPrivilegedUser(
            @Valid @RequestBody CreateUserRequest request,
            Authentication auth,
            HttpServletRequest httpRequest) {
        try {
            String clientIp = getClientIp(httpRequest);
            UserDto createdUser = userService.createPrivilegedUser(request, auth.getName(), clientIp);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    private String getClientIp(HttpServletRequest request) {
        return clientIpResolver.resolveClientIp(request);
    }
}
