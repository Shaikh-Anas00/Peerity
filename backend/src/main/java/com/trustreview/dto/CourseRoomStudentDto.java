package com.trustreview.dto;

import com.trustreview.model.CourseRoomEnrollment;
import com.trustreview.model.User;

import java.time.LocalDateTime;

public class CourseRoomStudentDto {

    private String id;
    private String fullName;
    private String email;
    private String department;
    private String academicStanding;
    private LocalDateTime enrolledAt;

    public CourseRoomStudentDto() {}

    public static CourseRoomStudentDto fromEnrollment(CourseRoomEnrollment enrollment) {
        CourseRoomStudentDto dto = new CourseRoomStudentDto();
        User student = enrollment.getStudent();
        if (student != null) {
            dto.id = student.getId();
            dto.fullName = student.getFullName();
            dto.email = student.getEmail();
            dto.department = student.getDepartment();
            dto.academicStanding = student.getAcademicStanding();
        }
        dto.enrolledAt = enrollment.getEnrolledAt();
        return dto;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getAcademicStanding() {
        return academicStanding;
    }

    public void setAcademicStanding(String academicStanding) {
        this.academicStanding = academicStanding;
    }

    public LocalDateTime getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(LocalDateTime enrolledAt) {
        this.enrolledAt = enrolledAt;
    }
}
