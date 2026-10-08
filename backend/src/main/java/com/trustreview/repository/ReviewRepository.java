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

    @Query("SELECT r FROM Review r WHERE r.submission.author = :author ORDER BY r.createdAt DESC")
    List<Review> findCompletedReviewsForAuthor(@Param("author") User author);

    long countByStatus(String status);
    List<Review> findByStatus(String status);
}
