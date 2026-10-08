package com.trustreview.repository;

import com.trustreview.model.Assignment;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, String> {
    List<Assignment> findAllByOrderByCreatedAtDesc();
    List<Assignment> findByCreatedByOrderByCreatedAtDesc(User createdBy);
}
