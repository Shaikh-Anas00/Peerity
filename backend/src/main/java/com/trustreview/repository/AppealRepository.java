package com.trustreview.repository;

import com.trustreview.model.Appeal;
import com.trustreview.model.AppealStatus;
import com.trustreview.model.Review;
import com.trustreview.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    Page<Appeal> findOpenAppeals(Pageable pageable);

    // ── Analytics (instructor-scoped aggregation, see AnalyticsService) ──────

    @Query("SELECT COUNT(a) FROM Appeal a WHERE (:instructorId IS NULL OR a.review.submission.assignment.createdBy.id = :instructorId)")
    long countAllScoped(@Param("instructorId") String instructorId);

    @Query("SELECT a.reason, COUNT(a) FROM Appeal a WHERE (:instructorId IS NULL OR a.review.submission.assignment.createdBy.id = :instructorId) GROUP BY a.reason")
    List<Object[]> countGroupedByReasonScoped(@Param("instructorId") String instructorId);

    @Query("SELECT a.status, COUNT(a) FROM Appeal a WHERE (:instructorId IS NULL OR a.review.submission.assignment.createdBy.id = :instructorId) GROUP BY a.status")
    List<Object[]> countGroupedByStatusScoped(@Param("instructorId") String instructorId);
}