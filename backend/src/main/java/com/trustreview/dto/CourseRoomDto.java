package com.trustreview.dto;

import com.trustreview.model.CourseRoom;
import com.trustreview.model.User;

import java.time.LocalDateTime;

public class CourseRoomDto {

    private String id;
    private String name;
    private String courseCode;
    private String description;
    private String joinCode;
    private String instructorId;
    private String instructorName;
    private String instructorEmail;
    private boolean active;
    private long enrolledCount;
    private boolean isEnrolled;
    private LocalDateTime createdAt;

    public CourseRoomDto() {}

    public static CourseRoomDto fromEntity(CourseRoom room, long enrolledCount, boolean isEnrolled) {
        CourseRoomDto dto = new CourseRoomDto();
        dto.id = room.getId();
        dto.name = room.getName();
        dto.courseCode = room.getCourseCode();
        dto.description = room.getDescription();
        dto.joinCode = room.getJoinCode();
        dto.active = room.isActive();
        dto.enrolledCount = enrolledCount;
        dto.isEnrolled = isEnrolled;
        dto.createdAt = room.getCreatedAt();

        User instructor = room.getInstructor();
        if (instructor != null) {
            dto.instructorId = instructor.getId();
            dto.instructorName = instructor.getFullName();
            dto.instructorEmail = instructor.getEmail();
        }
        return dto;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCourseCode() {
        return courseCode;
    }

    public void setCourseCode(String courseCode) {
        this.courseCode = courseCode;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getJoinCode() {
        return joinCode;
    }

    public void setJoinCode(String joinCode) {
        this.joinCode = joinCode;
    }

    public String getInstructorId() {
        return instructorId;
    }

    public void setInstructorId(String instructorId) {
        this.instructorId = instructorId;
    }

    public String getInstructorName() {
        return instructorName;
    }

    public void setInstructorName(String instructorName) {
        this.instructorName = instructorName;
    }

    public String getInstructorEmail() {
        return instructorEmail;
    }

    public void setInstructorEmail(String instructorEmail) {
        this.instructorEmail = instructorEmail;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public long getEnrolledCount() {
        return enrolledCount;
    }

    public void setEnrolledCount(long enrolledCount) {
        this.enrolledCount = enrolledCount;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isEnrolled")
    public boolean isEnrolled() {
        return isEnrolled;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isEnrolled")
    public void setEnrolled(boolean enrolled) {
        this.isEnrolled = enrolled;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
