package com.trustreview.dto;

import jakarta.validation.constraints.Size;

public class UpdateSettingsRequest {

    private Boolean notifyNewReview;
    private Boolean notifyDeadlineApproaching;
    private Boolean notifyDisputeStatusChange;

    @Size(max = 50, message = "Timezone must not exceed 50 characters")
    private String timezone;

    public UpdateSettingsRequest() {
    }

    public UpdateSettingsRequest(Boolean notifyNewReview, Boolean notifyDeadlineApproaching, Boolean notifyDisputeStatusChange, String timezone) {
        this.notifyNewReview = notifyNewReview;
        this.notifyDeadlineApproaching = notifyDeadlineApproaching;
        this.notifyDisputeStatusChange = notifyDisputeStatusChange;
        this.timezone = timezone;
    }

    public Boolean getNotifyNewReview() {
        return notifyNewReview;
    }

    public void setNotifyNewReview(Boolean notifyNewReview) {
        this.notifyNewReview = notifyNewReview;
    }

    public Boolean getNotifyDeadlineApproaching() {
        return notifyDeadlineApproaching;
    }

    public void setNotifyDeadlineApproaching(Boolean notifyDeadlineApproaching) {
        this.notifyDeadlineApproaching = notifyDeadlineApproaching;
    }

    public Boolean getNotifyDisputeStatusChange() {
        return notifyDisputeStatusChange;
    }

    public void setNotifyDisputeStatusChange(Boolean notifyDisputeStatusChange) {
        this.notifyDisputeStatusChange = notifyDisputeStatusChange;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }
}
