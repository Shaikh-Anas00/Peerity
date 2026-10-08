package com.trustreview.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "calibration_scores",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_sample_student", columnNames = {"sample_id", "student_id"})
       },
       indexes = {
           @Index(name = "idx_cal_score_student", columnList = "student_id")
       })
public class CalibrationScore {

    @Id
    @Column(length = 36, nullable = false, updatable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sample_id", nullable = false)
    private CalibrationSample sample;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    /** JSON map of student criterion -> score */
    @Column(name = "student_scores", columnDefinition = "TEXT", nullable = false)
    private String studentScores;

    @Column(name = "student_rationale", columnDefinition = "TEXT")
    private String studentRationale;

    /** Mean Absolute Error across all rubric criteria */
    @Column(name = "mean_absolute_error", nullable = false)
    private Double meanAbsoluteError;

    /** Reliability accuracy percentage: max(0.0, 100.0 - (MAE * 10.0)) */
    @Column(name = "accuracy_percentage", nullable = false)
    private Double accuracyPercentage;

    @Column(name = "evaluated_at", nullable = false, updatable = false)
    private LocalDateTime evaluatedAt;

    public CalibrationScore() {
        this.id = UUID.randomUUID().toString();
    }

    @PrePersist
    protected void onCreate() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
        this.evaluatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public CalibrationSample getSample() { return sample; }
    public void setSample(CalibrationSample sample) { this.sample = sample; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public String getStudentScores() { return studentScores; }
    public void setStudentScores(String studentScores) { this.studentScores = studentScores; }
    public String getStudentRationale() { return studentRationale; }
    public void setStudentRationale(String studentRationale) { this.studentRationale = studentRationale; }
    public Double getMeanAbsoluteError() { return meanAbsoluteError; }
    public void setMeanAbsoluteError(Double meanAbsoluteError) { this.meanAbsoluteError = meanAbsoluteError; }
    public Double getAccuracyPercentage() { return accuracyPercentage; }
    public void setAccuracyPercentage(Double accuracyPercentage) { this.accuracyPercentage = accuracyPercentage; }
    public LocalDateTime getEvaluatedAt() { return evaluatedAt; }
    public void setEvaluatedAt(LocalDateTime evaluatedAt) { this.evaluatedAt = evaluatedAt; }
}
