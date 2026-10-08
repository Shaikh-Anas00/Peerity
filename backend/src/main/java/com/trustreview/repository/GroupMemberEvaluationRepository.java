package com.trustreview.repository;

import com.trustreview.model.GroupMemberEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupMemberEvaluationRepository extends JpaRepository<GroupMemberEvaluation, String> {
    List<GroupMemberEvaluation> findByGroupId(String groupId);
    List<GroupMemberEvaluation> findByEvaluateeId(String evaluateeId);
    List<GroupMemberEvaluation> findByGroupIdAndEvaluateeId(String groupId, String evaluateeId);
    boolean existsByGroupIdAndEvaluatorIdAndEvaluateeId(String groupId, String evaluatorId, String evaluateeId);
}
