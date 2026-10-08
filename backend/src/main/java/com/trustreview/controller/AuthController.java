package com.trustreview.controller;

import com.trustreview.dto.ApiResponse;
import com.trustreview.dto.LoginRequest;
import com.trustreview.dto.RegisterRequest;
import com.trustreview.dto.UserDto;
import com.trustreview.service.AuditLedgerService;
import com.trustreview.service.LoginAttemptService;
import com.trustreview.service.UserService;
import com.trustreview.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final AuditLedgerService auditLedgerService;
    private final LoginAttemptService loginAttemptService;
    private final ClientIpResolver clientIpResolver;

    public AuthController(AuthenticationManager authenticationManager,
                          UserService userService,
                          AuditLedgerService auditLedgerService,
                          LoginAttemptService loginAttemptService,
                          ClientIpResolver clientIpResolver) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.auditLedgerService = auditLedgerService;
        this.loginAttemptService = loginAttemptService;
        this.clientIpResolver = clientIpResolver;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request,
                                     HttpServletRequest httpRequest) {
        try {
            String clientIp = getClientIp(httpRequest);
            UserDto registeredUser = userService.register(request, clientIp);

            // Auto-login newly registered user
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
            session.setAttribute("userId", registeredUser.getId());
            session.setAttribute("role", registeredUser.getRole());

            return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse(false, ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
                                  HttpServletRequest httpRequest) {
        String clientKey = getClientIp(httpRequest);

        // ── Rate-limit check (Item 2) ─────────────────────────────────────────
        if (loginAttemptService.isBlocked(clientKey)) {
            long remaining = loginAttemptService.getRemainingLockoutSeconds(clientKey);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(remaining))
                .body(Map.of(
                    "success", false,
                    "message", "Too many failed login attempts. Please try again in " + remaining + " seconds.",
                    "retryAfterSeconds", remaining
                ));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
            );

            // Clear any previous failure counter on success
            loginAttemptService.recordSuccess(clientKey);

            // Prevent session fixation by invalidating old session and creating new session
            HttpSession oldSession = httpRequest.getSession(false);
            if (oldSession != null) {
                oldSession.invalidate();
            }
            HttpSession newSession = httpRequest.getSession(true);

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            newSession.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

            UserDto user = userService.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("User not found"));

            newSession.setAttribute("userId", user.getId());
            newSession.setAttribute("role", user.getRole());

            // Log login event via cryptographic ledger
            auditLedgerService.logEvent(
                "USER_LOGIN",
                user.getEmail(),
                "User",
                user.getId(),
                "Successful session login from IP: " + clientKey,
                clientKey
            );

            return ResponseEntity.ok(user);

        } catch (BadCredentialsException ex) {
            // Record failure — will lock after MAX_ATTEMPTS
            loginAttemptService.recordFailure(clientKey);

            int attemptsLeft = LoginAttemptService.MAX_ATTEMPTS
                - (loginAttemptService.isBlocked(clientKey) ? LoginAttemptService.MAX_ATTEMPTS : 0);

            String message = loginAttemptService.isBlocked(clientKey)
                ? "Too many failed login attempts. Please try again in "
                    + loginAttemptService.getRemainingLockoutSeconds(clientKey) + " seconds."
                : "Invalid email or password.";

            return ResponseEntity.status(
                    loginAttemptService.isBlocked(clientKey) ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, message));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            String userId = (String) session.getAttribute("userId");
            if (userId != null) {
                auditLedgerService.logEvent(
                    "USER_LOGOUT",
                    null,
                    "User",
                    userId,
                    "User logged out, session terminated",
                    getClientIp(request)
                );
            }
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(new ApiResponse(true, "Successfully logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse(false, "Not authenticated"));
        }

        String email = authentication.getName();
        return userService.findByEmail(email)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    private String getClientIp(HttpServletRequest request) {
        return clientIpResolver.resolveClientIp(request);
    }
}
