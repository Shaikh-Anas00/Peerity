package com.trustreview.repository;

import com.trustreview.model.Review;
import com.trustreview.model.ReviewRating;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRatingRepository extends JpaRepository<ReviewRating, String> {
    Optional<ReviewRating> findByReview(Review review);
    boolean existsByReview(Review review);
    List<ReviewRating> findByReview_Reviewer(User reviewer);
}
