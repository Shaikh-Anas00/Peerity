package com.trustreview.dto;

import jakarta.validation.constraints.NotBlank;

public class VerifyPasswordRequest {

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    public VerifyPasswordRequest() {}

    public VerifyPasswordRequest(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }
}
