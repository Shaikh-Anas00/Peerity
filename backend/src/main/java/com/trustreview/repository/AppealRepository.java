package com.trustreview.repository;

import com.trustreview.model.Appeal;
import com.trustreview.model.AppealStatus;
import com.trustreview.model.Review;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppealRepository extends JpaRepository<Appeal, String> {
    List<Appeal> findByAppellantOrderByCreatedAtDesc(User appellant);
    Optional<Appeal> findByReview(Review review);
    boolean existsByReview(Review review);
    List<Appeal> findByStatus(AppealStatus status);

    @Query("SELECT a FROM Appeal a WHERE a.status IN ('SUBMITTED', 'UNDER_INVESTIGATION') ORDER BY a.createdAt ASC")
    List<Appeal> findOpenAppeals();
}