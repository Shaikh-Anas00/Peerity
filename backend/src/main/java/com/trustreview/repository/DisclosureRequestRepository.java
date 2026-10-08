package com.trustreview.repository;

import com.trustreview.model.Appeal;
import com.trustreview.model.DisclosureRequest;
import com.trustreview.model.DisclosureStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisclosureRequestRepository extends JpaRepository<DisclosureRequest, String> {
    Optional<DisclosureRequest> findByAppeal(Appeal appeal);
    List<DisclosureRequest> findByStatus(DisclosureStatus status);
}