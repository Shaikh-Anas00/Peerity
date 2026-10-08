package com.trustreview.repository;

import com.trustreview.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {

    /**
     * Retrieves the latest block in the ledger to chain the next entry.
     */
    Optional<AuditLog> findTopByOrderBySequenceNumberDesc();

    /**
     * Traverses the entire audit table in sequence order for integrity verification.
     */
    List<AuditLog> findAllByOrderBySequenceNumberAsc();

    /**
     * Paginated audit feed for the admin dashboard (newest blocks first).
     */
    Page<AuditLog> findAllByOrderBySequenceNumberDesc(Pageable pageable);

    List<AuditLog> findByActorEmail(String actorEmail);
    List<AuditLog> findByAction(String action);
}
