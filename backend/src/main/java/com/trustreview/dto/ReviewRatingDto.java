package com.trustreview.dto;

import com.trustreview.model.ReviewRating;
import java.time.LocalDateTime;

public class ReviewRatingDto {
    private String id;
    private String reviewId;
    private String reviewerPseudonym;
    private Integer rating;
    private Boolean isHelpful;
    private String comment;
    private LocalDateTime createdAt;

    public ReviewRatingDto() {}

    public static ReviewRatingDto from(ReviewRating r) {
        ReviewRatingDto dto = new ReviewRatingDto();
        dto.id = r.getId();
        if (r.getReview() != null) {
            dto.reviewId = r.getReview().getId();
        }
        dto.rating = r.getRating();
        dto.isHelpful = r.getIsHelpful();
        dto.comment = r.getComment();
        dto.createdAt = r.getCreatedAt();
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getReviewerPseudonym() { return reviewerPseudonym; }
    public void setReviewerPseudonym(String reviewerPseudonym) { this.reviewerPseudonym = reviewerPseudonym; }
    public String getReviewId() { return reviewId; }
    public void setReviewId(String reviewId) { this.reviewId = reviewId; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public Boolean getIsHelpful() { return isHelpful; }
    public void setIsHelpful(Boolean helpful) { isHelpful = helpful; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
