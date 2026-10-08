package com.trustreview.repository;

import com.trustreview.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, String> {
    List<Group> findByAssignmentId(String assignmentId);
    List<Group> findAllByOrderByCreatedAtDesc();
}
