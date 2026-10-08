package com.trustreview.repository;

import com.trustreview.model.Assignment;
import com.trustreview.model.CalibrationSample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalibrationSampleRepository extends JpaRepository<CalibrationSample, String> {
    List<CalibrationSample> findByAssignmentOrderByCreatedAtAsc(Assignment assignment);
    List<CalibrationSample> findAllByOrderByCreatedAtAsc();
}
