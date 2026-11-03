package com.trustreview.repository;

import com.trustreview.model.CourseRoom;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRoomRepository extends JpaRepository<CourseRoom, String> {

    Optional<CourseRoom> findByJoinCode(String joinCode);

    Optional<CourseRoom> findByJoinCodeIgnoreCase(String joinCode);

    boolean existsByJoinCode(String joinCode);

    List<CourseRoom> findByInstructorOrderByCreatedAtDesc(User instructor);

    List<CourseRoom> findAllByOrderByCreatedAtDesc();
}
