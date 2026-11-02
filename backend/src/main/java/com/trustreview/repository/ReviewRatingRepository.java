package com.trustreview.repository;

import com.trustreview.model.Review;
import com.trustreview.model.ReviewRating;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRatingRepository extends JpaRepository<ReviewRating, String> {
    Optional<ReviewRating> findByReview(Review review);
    boolean existsByReview(Review review);
    List<ReviewRating> findByReview_Reviewer(User reviewer);

    // ── Analytics (see AnalyticsService) ──────────────────────────────────────

    @Query("SELECT AVG(rr.rating) FROM ReviewRating rr")
    Double findAverageRating();

    @Query("SELECT COUNT(rr) FROM ReviewRating rr WHERE rr.isHelpful = true")
    long countHelpful();
}
