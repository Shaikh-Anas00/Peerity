package com.trustreview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "review_ratings",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_rating_review", columnNames = {"review_id"})
       },
       indexes = {
           @Index(name = "idx_rating_author", columnList = "author_id"),
           @Index(name = "idx_rating_review", columnList = "review_id")
       })
public class ReviewRating {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    /** 1 to 5 stars */
    @Column(nullable = false)
    private Integer rating;

    @Column(name = "is_helpful", nullable = false)
    private Boolean isHelpful;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public ReviewRating() {
        this.id = UUID.randomUUID().toString();
    }

    public ReviewRating(Review review, User author, Integer rating, Boolean isHelpful, String comment) {
        this.id = UUID.randomUUID().toString();
        this.review = review;
        this.author = author;
        this.rating = rating;
        this.isHelpful = isHelpful != null ? isHelpful : (rating >= 3);
        this.comment = comment;
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Review getReview() { return review; }
    public void setReview(Review review) { this.review = review; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }
    public Boolean getIsHelpful() { return isHelpful; }
    public void setIsHelpful(Boolean helpful) { isHelpful = helpful; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
