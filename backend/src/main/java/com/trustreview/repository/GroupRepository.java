package com.trustreview.repository;

import com.trustreview.model.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRepository extends JpaRepository<Group, String> {
    Page<Group> findByAssignmentId(String assignmentId, Pageable pageable);
    Page<Group> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
