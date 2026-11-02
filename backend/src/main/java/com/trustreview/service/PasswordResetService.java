package com.trustreview.service;

import com.trustreview.model.PasswordResetToken;
import com.trustreview.model.User;
import com.trustreview.repository.PasswordResetTokenRepository;
import com.trustreview.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

/**
 * Self-service "forgot password" flow: generate a time-limited, single-use token on request,
 * store only its SHA-256 hash, and let the holder of the raw token (from the reset link)
 * rotate the password once, before expiry.
 *
 * Delivery is currently a stub: the reset link is written to the application log rather than
 * emailed, since no SMTP provider is configured yet. Swapping in a real provider later only
 * means replacing the single {@code logger.info} call in {@link #requestReset} — nothing
 * about the token lifecycle (generation, hashing, expiry, single-use redemption) changes.
 */
@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);
    private static final long TOKEN_VALIDITY_MINUTES = 30;
    private static final int TOKEN_BYTES = 32;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditLedgerService auditLedgerService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${trustreview.client.url}")
    private String clientUrl;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                AuditLedgerService auditLedgerService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditLedgerService = auditLedgerService;
    }

    /**
     * Issues a new reset token for the given email, if an account with that email exists.
     * Deliberately silent (no exception, no signal in the response) when it doesn't — the
     * caller must not be able to tell a registered email from an unregistered one.
     */
    @Transactional
    public void requestReset(String email, String ipAddress) {
        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);
        if (userOpt.isEmpty()) {
            logger.info("Password reset requested for an email with no matching account: {}", normalizedEmail);
            return;
        }
        User user = userOpt.get();

        // Invalidate any previously issued, still-unused tokens so only the newest link works.
        tokenRepository.findByUserIdAndUsedFalse(user.getId())
                .forEach(t -> {
                    t.setUsed(true);
                    tokenRepository.save(t);
                });

        String rawToken = generateRawToken();
        PasswordResetToken token = new PasswordResetToken(
                user, sha256Hex(rawToken), LocalDateTime.now().plusMinutes(TOKEN_VALIDITY_MINUTES));
        tokenRepository.save(token);

        String resetLink = clientUrl + "/reset-password?token=" + rawToken;
        logger.info("Password reset link for {} (valid {} minutes): {}", user.getEmail(), TOKEN_VALIDITY_MINUTES, resetLink);

        auditLedgerService.logEvent(
                "PASSWORD_RESET_REQUESTED",
                user.getEmail(),
                "User",
                user.getId(),
                "Password reset token issued (delivered via server log — no email provider configured yet).",
                ipAddress
        );
    }

    /**
     * Redeems a raw reset token: validates it (exists, unused, unexpired), rotates the
     * account's password hash, and marks the token spent so it cannot be reused.
     */
    @Transactional
    public void redeemReset(String rawToken, String newPassword, String confirmPassword, String ipAddress) {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("New password and confirmation do not match");
        }

        PasswordResetToken token = tokenRepository.findByTokenHash(sha256Hex(rawToken))
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset link"));

        if (token.isUsed()) {
            throw new IllegalArgumentException("This reset link has already been used");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This reset link has expired — please request a new one");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        auditLedgerService.logEvent(
                "PASSWORD_RESET_COMPLETED",
                user.getEmail(),
                "User",
                user.getId(),
                "Password successfully reset via a self-service reset link.",
                ipAddress
        );
    }

    private String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
