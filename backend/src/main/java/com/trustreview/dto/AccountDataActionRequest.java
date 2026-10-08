package com.trustreview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AccountDataActionRequest {

    @NotBlank(message = "Action type is required")
    @Pattern(regexp = "^(EXPORT|DELETION)$", message = "Action type must be EXPORT or DELETION")
    private String actionType;

    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;

    public AccountDataActionRequest() {
    }

    public AccountDataActionRequest(String actionType, String reason) {
        this.actionType = actionType;
        this.reason = reason;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
