package com.trustreview.repository;

import com.trustreview.model.GroupMembership;
import com.trustreview.model.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMembershipRepository extends JpaRepository<GroupMembership, String> {
    List<GroupMembership> findByGroupId(String groupId);
    List<GroupMembership> findByUserId(String userId);
    List<GroupMembership> findByUserIdAndStatus(String userId, MembershipStatus status);
    Optional<GroupMembership> findByGroupIdAndUserId(String groupId, String userId);
}
