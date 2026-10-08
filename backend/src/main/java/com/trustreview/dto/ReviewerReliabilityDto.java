package com.trustreview.dto;

public class ReviewerReliabilityDto {
    private String studentId;
    private String studentName;
    private Double reliabilityScore; // 0.0 to 100.0%
    private String reliabilityTier;   // "HIGH" | "MODERATE" | "LOW" | "UNCALIBRATED"
    private int samplesCompleted;
    private boolean isCalibrated;

    public ReviewerReliabilityDto() {}

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public Double getReliabilityScore() { return reliabilityScore; }
    public void setReliabilityScore(Double reliabilityScore) { this.reliabilityScore = reliabilityScore; }
    public String getReliabilityTier() { return reliabilityTier; }
    public void setReliabilityTier(String reliabilityTier) { this.reliabilityTier = reliabilityTier; }
    public int getSamplesCompleted() { return samplesCompleted; }
    public void setSamplesCompleted(int samplesCompleted) { this.samplesCompleted = samplesCompleted; }
    public boolean isCalibrated() { return isCalibrated; }
    public void setCalibrated(boolean calibrated) { isCalibrated = calibrated; }
}
