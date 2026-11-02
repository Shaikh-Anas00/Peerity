package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.RedeemPasswordResetRequest;
import com.trustreview.dto.RequestPasswordResetRequest;
import com.trustreview.service.PasswordResetService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public, unauthenticated self-service password reset ("forgot password") endpoints.
 * Both are deliberately outside the authenticated API surface — see SecurityConfig's
 * permitAll + CSRF-ignore lists, same treatment as /api/auth/login and /register.
 */
@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;
    private final ClientIpResolver clientIpResolver;

    public PasswordResetController(PasswordResetService passwordResetService,
                                   ClientIpResolver clientIpResolver) {
        this.passwordResetService = passwordResetService;
        this.clientIpResolver = clientIpResolver;
    }

    /**
     * POST /api/auth/forgot-password — always returns the same generic success message,
     * whether or not the email belongs to a real account, to avoid revealing which emails
     * are registered.
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody RequestPasswordResetRequest request,
                                                       HttpServletRequest httpRequest) {
        String clientIp = clientIpResolver.resolveClientIp(httpRequest);
        passwordResetService.requestReset(request.getEmail(), clientIp);
        return ResponseEntity.ok(new ApiResponse(true,
                "If an account exists for that email, a password reset link has been issued."));
    }

    /**
     * POST /api/auth/reset-password — redeems a token and rotates the account's password.
     * An invalid/expired/already-used token or a mismatched confirmation throws
     * IllegalArgumentException, mapped to 400 by GlobalExceptionHandler.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody RedeemPasswordResetRequest request,
                                                      HttpServletRequest httpRequest) {
        String clientIp = clientIpResolver.resolveClientIp(httpRequest);
        passwordResetService.redeemReset(request.getToken(), request.getNewPassword(),
                request.getConfirmPassword(), clientIp);
        return ResponseEntity.ok(new ApiResponse(true, "Password successfully reset. You can now log in."));
    }
}
