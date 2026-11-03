package com.trustreview.repository;

import com.trustreview.model.Assignment;
import com.trustreview.model.AssignmentPseudonym;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssignmentPseudonymRepository extends JpaRepository<AssignmentPseudonym, String> {
    Optional<AssignmentPseudonym> findByStudentAndAssignment(User student, Assignment assignment);
}
