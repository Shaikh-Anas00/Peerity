package com.trustreview.controller;

import com.trustreview.dto.*;
import com.trustreview.service.UserService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

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
        String clientIp = clientIpResolver.resolveClientIp(httpRequest);
        UserDto updated = userService.updateProfile(auth.getName(), request, clientIp);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(@Valid @RequestBody UpdateSettingsRequest request,
                                            Authentication auth,
                                            HttpServletRequest httpRequest) {
        String clientIp = clientIpResolver.resolveClientIp(httpRequest);
        UserDto updated = userService.updateSettings(auth.getName(), request, clientIp);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/verify-password")
    public ResponseEntity<?> verifyPassword(@Valid @RequestBody VerifyPasswordRequest request,
                                            Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse(false, "Not authenticated"));
        }
        boolean valid = userService.verifyCurrentPassword(auth.getName(), request.getCurrentPassword());
        if (!valid) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, "Current password is incorrect"));
        }
        return ResponseEntity.ok(new ApiResponse(true, "Current password verified"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                            Authentication auth,
                                            HttpServletRequest httpRequest) {
        String clientIp = clientIpResolver.resolveClientIp(httpRequest);
        userService.changePassword(auth.getName(), request, clientIp);
        return ResponseEntity.ok(new ApiResponse(true, "Password successfully updated"));
    }

    @PostMapping("/data-request")
    public ResponseEntity<?> requestDataAction(@Valid @RequestBody AccountDataActionRequest request,
                                               Authentication auth,
                                               HttpServletRequest httpRequest) {
        String clientIp = clientIpResolver.resolveClientIp(httpRequest);
        UserDto updated = userService.requestDataAction(auth.getName(), request, clientIp);
        return ResponseEntity.ok(updated);
    }

    /**
     * GET /api/users/me/export — real-time GDPR data export (Art. 15/20).
     * Returns the authenticated caller's own profile, submissions, reviews, and appeals as a
     * downloadable JSON file. Always scoped to the caller — there is no userId parameter.
     */
    @GetMapping("/me/export")
    public ResponseEntity<UserDataExportDto> exportMyData(Authentication auth, HttpServletRequest httpRequest) {
        String clientIp = clientIpResolver.resolveClientIp(httpRequest);
        UserDataExportDto export = userService.exportMyData(auth.getName(), clientIp);
        String filename = "peerity-data-export-" + Instant.now().toEpochMilli() + ".json";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(export);
    }
}
