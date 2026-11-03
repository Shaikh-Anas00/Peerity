package com.trustreview.repository;

import com.trustreview.model.CourseRoom;
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

    @Query("SELECT COUNT(r) FROM Review r WHERE UPPER(r.status) = UPPER(:status) AND (:instructorId IS NULL OR r.submission.assignment.createdBy.id = :instructorId)")
    long countByStatusScoped(@Param("status") String status, @Param("instructorId") String instructorId);

    @Query("SELECT r.scores FROM Review r WHERE UPPER(r.status) = 'COMPLETED' AND r.scores IS NOT NULL AND (:instructorId IS NULL OR r.submission.assignment.createdBy.id = :instructorId)")
    List<String> findCompletedScoresScoped(@Param("instructorId") String instructorId);

    @Query("SELECT r FROM Review r WHERE r.reviewer = :reviewer AND (r.submission.courseRoom = :courseRoom OR r.submission.assignment.courseRoom = :courseRoom) ORDER BY r.createdAt DESC")
    List<Review> findByReviewerAndCourseRoom(@Param("reviewer") User reviewer, @Param("courseRoom") CourseRoom courseRoom);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.submission.courseRoom = :courseRoom OR r.submission.assignment.courseRoom = :courseRoom")
    long countByCourseRoom(@Param("courseRoom") CourseRoom courseRoom);
}
