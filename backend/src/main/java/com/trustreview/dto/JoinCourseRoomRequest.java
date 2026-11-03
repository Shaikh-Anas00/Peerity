package com.trustreview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class JoinCourseRoomRequest {

    @NotBlank(message = "Join code is required")
    @Size(min = 4, max = 12, message = "Join code must be between 4 and 12 characters")
    private String joinCode;

    public JoinCourseRoomRequest() {}

    public JoinCourseRoomRequest(String joinCode) {
        this.joinCode = joinCode;
    }

    public String getJoinCode() {
        return joinCode;
    }

    public void setJoinCode(String joinCode) {
        this.joinCode = joinCode;
    }
}
