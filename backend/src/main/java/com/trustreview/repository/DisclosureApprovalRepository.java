package com.trustreview.repository;

import com.trustreview.model.DisclosureApproval;
import com.trustreview.model.DisclosureRequest;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisclosureApprovalRepository extends JpaRepository<DisclosureApproval, String> {

    /**
     * Checks whether a committee member has already voted on a specific disclosure request.
     */
    boolean existsByDisclosureRequestAndCommitteeMember(DisclosureRequest disclosureRequest, User committeeMember);

    /**
     * Returns all votes for a disclosure request ordered chronologically.
     */
    List<DisclosureApproval> findByDisclosureRequestOrderByVotedAtAsc(DisclosureRequest disclosureRequest);

    /**
     * Finds the specific vote of a committee member on a disclosure request (if any).
     */
    Optional<DisclosureApproval> findByDisclosureRequestAndCommitteeMember(DisclosureRequest disclosureRequest, User committeeMember);
}
