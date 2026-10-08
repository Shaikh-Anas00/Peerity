package com.trustreview.repository;

import com.trustreview.model.Assignment;
import com.trustreview.model.Submission;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, String> {
    List<Submission> findByAuthorOrderBySubmittedAtDesc(User author);
    List<Submission> findByAssignmentOrderBySubmittedAtAsc(Assignment assignment);
    Optional<Submission> findByAuthorAndAssignment(User author, Assignment assignment);
    boolean existsByAuthorAndAssignment(User author, Assignment assignment);
}
