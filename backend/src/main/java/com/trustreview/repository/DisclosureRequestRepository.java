package com.trustreview.repository;

import com.trustreview.model.Appeal;
import com.trustreview.model.DisclosureRequest;
import com.trustreview.model.DisclosureStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisclosureRequestRepository extends JpaRepository<DisclosureRequest, String> {
    Optional<DisclosureRequest> findByAppeal(Appeal appeal);
    List<DisclosureRequest> findByStatus(DisclosureStatus status);

    // ── Analytics (instructor-scoped aggregation, see AnalyticsService) ──────

    @Query("SELECT COUNT(dr) FROM DisclosureRequest dr WHERE dr.status = :status AND (:instructorId IS NULL OR dr.appeal.review.submission.assignment.createdBy.id = :instructorId)")
    long countByStatusScoped(@Param("status") DisclosureStatus status, @Param("instructorId") String instructorId);

    @Query("SELECT dr.requestedLevel, COUNT(dr) FROM DisclosureRequest dr WHERE dr.status = :status AND (:instructorId IS NULL OR dr.appeal.review.submission.assignment.createdBy.id = :instructorId) GROUP BY dr.requestedLevel")
    List<Object[]> countGroupedByRequestedLevelScoped(@Param("status") DisclosureStatus status, @Param("instructorId") String instructorId);
}