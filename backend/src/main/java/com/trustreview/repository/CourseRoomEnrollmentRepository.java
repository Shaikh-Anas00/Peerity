package com.trustreview.repository;

import com.trustreview.model.CourseRoom;
import com.trustreview.model.CourseRoomEnrollment;
import com.trustreview.model.EnrollmentStatus;
import com.trustreview.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRoomEnrollmentRepository extends JpaRepository<CourseRoomEnrollment, String> {

    boolean existsByCourseRoomAndStudent(CourseRoom courseRoom, User student);

    Optional<CourseRoomEnrollment> findByCourseRoomAndStudent(CourseRoom courseRoom, User student);

    List<CourseRoomEnrollment> findByStudentOrderByEnrolledAtDesc(User student);

    List<CourseRoomEnrollment> findByCourseRoomOrderByEnrolledAtDesc(CourseRoom courseRoom);

    long countByCourseRoom(CourseRoom courseRoom);

    boolean existsByCourseRoomAndStudentAndStatus(CourseRoom courseRoom, User student, EnrollmentStatus status);

    List<CourseRoomEnrollment> findByCourseRoomAndStatus(CourseRoom courseRoom, EnrollmentStatus status);

    long countByCourseRoomAndStatus(CourseRoom courseRoom, EnrollmentStatus status);
}
