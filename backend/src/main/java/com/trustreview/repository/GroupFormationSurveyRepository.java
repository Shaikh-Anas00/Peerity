package com.trustreview.repository;

import com.trustreview.model.GroupFormationSurvey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupFormationSurveyRepository extends JpaRepository<GroupFormationSurvey, String> {
}
