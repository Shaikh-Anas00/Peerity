package com.trustreview.controller;

import com.trustreview.dto.*;
import com.trustreview.service.UserService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserService userService;
    private final ClientIpResolver clientIpResolver;

    public UserController(UserService userService, ClientIpResolver clientIpResolver) {
        this.userService = userService;
        this.clientIpResolver = clientIpResolver;
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse(false, "Not authenticated"));
        }
        return userService.findByEmail(auth.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request,
                                           Authentication auth,
                                           HttpServletRequest httpRequest) {
        try {
            String clientIp = clientIpResolver.resolveClientIp(httpRequest);
            UserDto updated = userService.updateProfile(auth.getName(), request, clientIp);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(@Valid @RequestBody UpdateSettingsRequest request,
                                            Authentication auth,
                                            HttpServletRequest httpRequest) {
        try {
            String clientIp = clientIpResolver.resolveClientIp(httpRequest);
            UserDto updated = userService.updateSettings(auth.getName(), request, clientIp);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(@Valid @RequestBody VerifyPasswordRequest request,
                                            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse(false, "Not authenticated"));
        }
        try {
            boolean valid = userService.verifyCurrentPassword(auth.getName(), request.getCurrentPassword());
            if (!valid) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Current password is incorrect"));
            }
            return ResponseEntity.ok(new ApiResponse(true, "Current password verified"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                            Authentication auth,
                                            HttpServletRequest httpRequest) {
        try {
            String clientIp = clientIpResolver.resolveClientIp(httpRequest);
            userService.changePassword(auth.getName(), request, clientIp);
            return ResponseEntity.ok(new ApiResponse(true, "Password successfully updated"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @PostMapping("/data-request")
    public ResponseEntity<?> requestDataAction(@Valid @RequestBody AccountDataActionRequest request,
                                               Authentication auth,
                                               HttpServletRequest httpRequest) {
        try {
            String clientIp = clientIpResolver.resolveClientIp(httpRequest);
            UserDto updated = userService.requestDataAction(auth.getName(), request, clientIp);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, ex.getMessage()));
        }
    }
}
