package com.trustreview.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SubmitReviewRatingRequest {

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1 star")
    @Max(value = 5, message = "Rating cannot exceed 5 stars")
    private Integer rating;

    private Boolean isHelpful;

    private String comment;

    public SubmitReviewRatingRequest() {}

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public Boolean getIsHelpful() { return isHelpful; }
    public void setIsHelpful(Boolean helpful) { isHelpful = helpful; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
