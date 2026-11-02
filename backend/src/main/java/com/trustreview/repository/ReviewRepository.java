package com.trustreview.repository;

import com.trustreview.model.Review;
import com.trustreview.model.Submission;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByReviewerOrderByCreatedAtDesc(User reviewer);
    List<Review> findBySubmissionOrderByCreatedAtDesc(Submission submission);
    boolean existsByReviewerAndSubmission(User reviewer, Submission submission);
    List<Review> findBySubmissionIn(List<Submission> submissions);

    @Query("SELECT r FROM Review r WHERE r.submission.author = :author ORDER BY r.createdAt DESC")
    List<Review> findCompletedReviewsForAuthor(@Param("author") User author);

    long countByStatus(String status);
    List<Review> findByStatus(String status);

    // ── Analytics (instructor-scoped aggregation, see AnalyticsService) ──────
    // instructorId = null means unscoped (ADMIN view); non-null scopes to reviews whose
    // submission's assignment was created by that instructor.

    @Query("SELECT COUNT(r) FROM Review r WHERE (:instructorId IS NULL OR r.submission.assignment.createdBy.id = :instructorId)")
    long countAllScoped(@Param("instructorId") String instructorId);

    @Query("SELECT r FROM Review r WHERE r.status = :status AND (:instructorId IS NULL OR r.submission.assignment.createdBy.id = :instructorId)")
    List<Review> findByStatusScoped(@Param("status") String status, @Param("instructorId") String instructorId);
}
