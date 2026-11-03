package com.trustreview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateCourseRoomRequest {

    @NotBlank(message = "Course room name is required")
    @Size(max = 150, message = "Course room name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Course code is required")
    @Size(max = 50, message = "Course code must not exceed 50 characters")
    private String courseCode;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    public CreateCourseRoomRequest() {}

    public CreateCourseRoomRequest(String name, String courseCode, String description) {
        this.name = name;
        this.courseCode = courseCode;
        this.description = description;
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
}
