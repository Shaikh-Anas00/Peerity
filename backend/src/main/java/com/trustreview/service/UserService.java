package com.trustreview.service;

import com.trustreview.dto.RegisterRequest;
import com.trustreview.dto.UserDto;
import com.trustreview.model.AuditLog;
import com.trustreview.model.Role;
import com.trustreview.model.User;
import com.trustreview.repository.AuditLogRepository;
import com.trustreview.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AuditLedgerService auditLedgerService;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       AuditLedgerService auditLedgerService,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.auditLedgerService = auditLedgerService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserDto register(RegisterRequest request, String ipAddress) {
        if (request.getConsentAgreed() == null || !request.getConsentAgreed()) {
            throw new IllegalArgumentException("You must understand that submissions are reviewed anonymously and agree to quorum-governed disclosure policy");
        }
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full name is required");
        }
        if (request.getInstitution() == null || request.getInstitution().trim().isEmpty()) {
            throw new IllegalArgumentException("Institution is required");
        }
        if (request.getDepartment() == null || request.getDepartment().trim().isEmpty()) {
            throw new IllegalArgumentException("Department is required");
        }
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("Email address is already registered");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        // Public self-registration is strictly locked to Role.STUDENT.
        // Incoming role parameters are discarded entirely.
        Role role = Role.STUDENT;

        User user = new User(
                request.getEmail().trim().toLowerCase(),
                hashedPassword,
                request.getFullName().trim(),
                role,
                request.getInstitution().trim(),
                request.getDepartment().trim(),
                true
        );

        User savedUser = userRepository.save(user);

        // Audit log via cryptographic ledger
        auditLedgerService.logEvent(
                "USER_REGISTER",
                savedUser.getEmail(),
                "User",
                savedUser.getId(),
                "Student self-registered with mandatory anonymous review consent and locked role " + savedUser.getRole(),
                ipAddress
        );

        return new UserDto(savedUser);
    }

    /**
     * Creates a privileged account (INSTRUCTOR, COMMITTEE, ADMIN).
     * Restricted to authenticated ADMIN callers.
     */
    @Transactional
    public UserDto createPrivilegedUser(com.trustreview.dto.CreateUserRequest request, String adminEmail, String ipAddress) {
        if (request.getRole() == Role.STUDENT) {
            throw new IllegalArgumentException("Use the public /register endpoint for student accounts. Admin endpoint is restricted to privileged roles.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email address is already registered");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User user = new User(
                request.getEmail().trim().toLowerCase(),
                hashedPassword,
                request.getFullName().trim(),
                request.getRole(),
                request.getInstitution(),
                request.getDepartment()
        );

        User savedUser = userRepository.save(user);

        auditLedgerService.logEvent(
                "PRIVILEGED_USER_CREATED",
                adminEmail,
                "User",
                savedUser.getId(),
                "Privileged user created with role " + savedUser.getRole() + " by Admin " + adminEmail,
                ipAddress
        );

        return new UserDto(savedUser);
    }

    @Transactional
    public UserDto updateProfile(String userEmail, com.trustreview.dto.UpdateProfileRequest request, String ipAddress) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        user.setFullName(request.getFullName().trim());
        user.setInstitution(request.getInstitution().trim());
        user.setDepartment(request.getDepartment().trim());

        if (request.getAcademicStanding() != null) {
            user.setAcademicStanding(request.getAcademicStanding().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        User saved = userRepository.save(user);

        auditLedgerService.logEvent(
                "USER_PROFILE_UPDATED",
                user.getEmail(),
                "User",
                user.getId(),
                "User updated profile (institution=" + user.getInstitution() + ", department=" + user.getDepartment() + ")",
                ipAddress
        );

        return new UserDto(saved);
    }

    @Transactional
    public UserDto updateSettings(String userEmail, com.trustreview.dto.UpdateSettingsRequest request, String ipAddress) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        if (request.getNotifyNewReview() != null) {
            user.setNotifyNewReview(request.getNotifyNewReview());
        }
        if (request.getNotifyDeadlineApproaching() != null) {
            user.setNotifyDeadlineApproaching(request.getNotifyDeadlineApproaching());
        }
        if (request.getNotifyDisputeStatusChange() != null) {
            user.setNotifyDisputeStatusChange(request.getNotifyDisputeStatusChange());
        }
        if (request.getTimezone() != null && !request.getTimezone().trim().isEmpty()) {
            user.setTimezone(request.getTimezone().trim());
        }

        User saved = userRepository.save(user);
        return new UserDto(saved);
    }

    public boolean verifyCurrentPassword(String userEmail, String currentPassword) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));
        return passwordEncoder.matches(currentPassword, user.getPasswordHash());
    }

    @Transactional
    public void changePassword(String userEmail, com.trustreview.dto.ChangePasswordRequest request, String ipAddress) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirmation do not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditLedgerService.logEvent(
                "USER_PASSWORD_CHANGED",
                user.getEmail(),
                "User",
                user.getId(),
                "User successfully updated their password",
                ipAddress
        );
    }

    @Transactional
    public UserDto requestDataAction(String userEmail, com.trustreview.dto.AccountDataActionRequest request, String ipAddress) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userEmail));

        String type = request.getActionType().toUpperCase();
        if ("EXPORT".equals(type)) {
            user.setDataExportRequested(true);
            user.setDataRequestStatus("EXPORT_REQUESTED");
            auditLedgerService.logEvent(
                    "DATA_EXPORT_REQUESTED",
                    user.getEmail(),
                    "User",
                    user.getId(),
                    "User filed formal account data export request. Reason: " + (request.getReason() != null ? request.getReason() : "None provided"),
                    ipAddress
            );
        } else if ("DELETION".equals(type)) {
            user.setDataDeletionRequested(true);
            user.setDataRequestStatus("DELETION_REQUESTED");
            auditLedgerService.logEvent(
                    "DATA_DELETION_REQUESTED",
                    user.getEmail(),
                    "User",
                    user.getId(),
                    "User filed formal account deletion/anonymization request. Reason: " + (request.getReason() != null ? request.getReason() : "None provided"),
                    ipAddress
            );
        } else {
            throw new IllegalArgumentException("Invalid action type: " + type);
        }

        User saved = userRepository.save(user);
        return new UserDto(saved);
    }

    public Optional<UserDto> findByEmail(String email) {
        return userRepository.findByEmail(email).map(UserDto::new);
    }

    public Optional<UserDto> findById(String id) {
        return userRepository.findById(id).map(UserDto::new);
    }
}
