package com.trustreview.repository;

import com.trustreview.model.CalibrationSample;
import com.trustreview.model.CalibrationScore;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CalibrationScoreRepository extends JpaRepository<CalibrationScore, String> {
    List<CalibrationScore> findByStudent(User student);
    Optional<CalibrationScore> findBySampleAndStudent(CalibrationSample sample, User student);
    boolean existsBySampleAndStudent(CalibrationSample sample, User student);
    long countByStudent(User student);
}
