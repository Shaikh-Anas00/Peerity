package com.trustreview.dto;

import com.trustreview.model.AppealStatus;
import jakarta.validation.constraints.NotNull;

public class ResolveAppealRequest {

    @NotNull(message = "status is required")
    private AppealStatus status;

    private boolean approveDisclosure;
    private String resolutionNote;

    public ResolveAppealRequest() {}

    public AppealStatus getStatus() {
        return status;
    }

    public void setStatus(AppealStatus status) {
        this.status = status;
    }

    public boolean isApproveDisclosure() {
        return approveDisclosure;
    }

    public void setApproveDisclosure(boolean approveDisclosure) {
        this.approveDisclosure = approveDisclosure;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }
}