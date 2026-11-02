package com.trustreview.dto;

import java.time.Instant;
import java.util.List;

/**
 * Self-service GDPR data export bundle (Art. 15 "right of access" / Art. 20 "right to
 * data portability"). Contains only the requesting user's own records — every list here
 * is sourced from the same "my"-scoped service methods the authenticated UI already uses
 * (SubmissionService.findMySubmissions, ReviewService.getAssignedToMe/getMyFeedback,
 * AppealService.getMyAppeals), so this cannot leak another user's data.
 */
public class UserDataExportDto {
    private UserDto profile;
    private List<SubmissionDto> submissions;
    private List<ReviewDto> reviewsGiven;
    private List<ReviewDto> feedbackReceived;
    private List<AppealDto> appeals;
    private Instant exportedAt;

    public UserDataExportDto() {
    }

    public UserDataExportDto(UserDto profile, List<SubmissionDto> submissions, List<ReviewDto> reviewsGiven,
                              List<ReviewDto> feedbackReceived, List<AppealDto> appeals, Instant exportedAt) {
        this.profile = profile;
        this.submissions = submissions;
        this.reviewsGiven = reviewsGiven;
        this.feedbackReceived = feedbackReceived;
        this.appeals = appeals;
        this.exportedAt = exportedAt;
    }

    public UserDto getProfile() {
        return profile;
    }

    public void setProfile(UserDto profile) {
        this.profile = profile;
    }

    public List<SubmissionDto> getSubmissions() {
        return submissions;
    }

    public void setSubmissions(List<SubmissionDto> submissions) {
        this.submissions = submissions;
    }

    public List<ReviewDto> getReviewsGiven() {
        return reviewsGiven;
    }

    public void setReviewsGiven(List<ReviewDto> reviewsGiven) {
        this.reviewsGiven = reviewsGiven;
    }

    public List<ReviewDto> getFeedbackReceived() {
        return feedbackReceived;
    }

    public void setFeedbackReceived(List<ReviewDto> feedbackReceived) {
        this.feedbackReceived = feedbackReceived;
    }

    public List<AppealDto> getAppeals() {
        return appeals;
    }

    public void setAppeals(List<AppealDto> appeals) {
        this.appeals = appeals;
    }

    public Instant getExportedAt() {
        return exportedAt;
    }

    public void setExportedAt(Instant exportedAt) {
        this.exportedAt = exportedAt;
    }
}
