package com.trustreview.repository;

import com.trustreview.model.GroupFormationResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupFormationResponseRepository extends JpaRepository<GroupFormationResponse, String> {
}
