package com.trustreview.dto;

import java.util.ArrayList;
import java.util.List;

public class ClassroomWorkspaceDto {

    private CourseRoomDto classroom;
    private List<AssignmentDto> assignments = new ArrayList<>();
    private List<SubmissionDto> mySubmissions = new ArrayList<>();
    private List<ReviewDto> myReviews = new ArrayList<>();
    private List<CourseRoomStudentDto> students = new ArrayList<>();
    private boolean canManage;
    private long totalSubmissions;
    private long totalReviews;

    public ClassroomWorkspaceDto() {}

    public CourseRoomDto getClassroom() {
        return classroom;
    }

    public void setClassroom(CourseRoomDto classroom) {
        this.classroom = classroom;
    }

    public List<AssignmentDto> getAssignments() {
        return assignments;
    }

    public void setAssignments(List<AssignmentDto> assignments) {
        this.assignments = assignments;
    }

    public List<SubmissionDto> getMySubmissions() {
        return mySubmissions;
    }

    public void setMySubmissions(List<SubmissionDto> mySubmissions) {
        this.mySubmissions = mySubmissions;
    }

    public List<ReviewDto> getMyReviews() {
        return myReviews;
    }

    public void setMyReviews(List<ReviewDto> myReviews) {
        this.myReviews = myReviews;
    }

    public List<CourseRoomStudentDto> getStudents() {
        return students;
    }

    public void setStudents(List<CourseRoomStudentDto> students) {
        this.students = students;
    }

    public boolean isCanManage() {
        return canManage;
    }

    public void setCanManage(boolean canManage) {
        this.canManage = canManage;
    }

    public long getTotalSubmissions() {
        return totalSubmissions;
    }

    public void setTotalSubmissions(long totalSubmissions) {
        this.totalSubmissions = totalSubmissions;
    }

    public long getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(long totalReviews) {
        this.totalReviews = totalReviews;
    }
}
