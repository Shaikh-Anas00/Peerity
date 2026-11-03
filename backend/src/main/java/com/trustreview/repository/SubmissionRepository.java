package com.trustreview.repository;

import com.trustreview.model.Assignment;
import com.trustreview.model.CourseRoom;
import com.trustreview.model.Submission;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, String> {
    List<Submission> findByAuthorOrderBySubmittedAtDesc(User author);
    List<Submission> findByAuthorAndCourseRoomOrderBySubmittedAtDesc(User author, CourseRoom courseRoom);
    List<Submission> findByAssignmentOrderBySubmittedAtAsc(Assignment assignment);
    List<Submission> findByAssignmentAndCourseRoomOrderBySubmittedAtAsc(Assignment assignment, CourseRoom courseRoom);
    List<Submission> findByCourseRoomOrderBySubmittedAtDesc(CourseRoom courseRoom);
    Optional<Submission> findByAuthorAndAssignment(User author, Assignment assignment);
    boolean existsByAuthorAndAssignment(User author, Assignment assignment);
    long countByAssignment(Assignment assignment);
    long countByAssignmentAndCourseRoom(Assignment assignment, CourseRoom courseRoom);
    long countByCourseRoom(CourseRoom courseRoom);

    @Query("SELECT COUNT(DISTINCT s.author) FROM Submission s WHERE s.assignment = :assignment")
    long countDistinctAuthorsByAssignment(@Param("assignment") Assignment assignment);

    @Query("SELECT COUNT(DISTINCT s.author) FROM Submission s WHERE s.assignment = :assignment AND s.courseRoom = :courseRoom")
    long countDistinctAuthorsByAssignmentAndCourseRoom(@Param("assignment") Assignment assignment, @Param("courseRoom") CourseRoom courseRoom);
}
