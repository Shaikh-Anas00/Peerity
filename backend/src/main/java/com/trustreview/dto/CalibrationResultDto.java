package com.trustreview.dto;

import java.util.Map;

public class CalibrationResultDto {
    private String sampleId;
    private String sampleTitle;
    private Map<String, Integer> studentScores;
    private Map<String, Integer> expertScores;
    private String expertFeedback;
    private Double meanAbsoluteError;
    private Double accuracyPercentage;
    private Double levelAgreementPct;
    private Map<String, String> studentLevels;
    private Map<String, String> expertLevels;
    private Double overallReliabilityScore;
    private String reliabilityTier; // "HIGH" | "MODERATE" | "LOW"

    public CalibrationResultDto() {}

    public String getSampleId() { return sampleId; }
    public void setSampleId(String sampleId) { this.sampleId = sampleId; }
    public String getSampleTitle() { return sampleTitle; }
    public void setSampleTitle(String sampleTitle) { this.sampleTitle = sampleTitle; }
    public Map<String, Integer> getStudentScores() { return studentScores; }
    public void setStudentScores(Map<String, Integer> studentScores) { this.studentScores = studentScores; }
    public Map<String, Integer> getExpertScores() { return expertScores; }
    public void setExpertScores(Map<String, Integer> expertScores) { this.expertScores = expertScores; }
    public String getExpertFeedback() { return expertFeedback; }
    public void setExpertFeedback(String expertFeedback) { this.expertFeedback = expertFeedback; }
    public Double getMeanAbsoluteError() { return meanAbsoluteError; }
    public void setMeanAbsoluteError(Double meanAbsoluteError) { this.meanAbsoluteError = meanAbsoluteError; }
    public Double getAccuracyPercentage() { return accuracyPercentage; }
    public void setAccuracyPercentage(Double accuracyPercentage) { this.accuracyPercentage = accuracyPercentage; }
    public Double getLevelAgreementPct() { return levelAgreementPct; }
    public void setLevelAgreementPct(Double levelAgreementPct) { this.levelAgreementPct = levelAgreementPct; }
    public Map<String, String> getStudentLevels() { return studentLevels; }
    public void setStudentLevels(Map<String, String> studentLevels) { this.studentLevels = studentLevels; }
    public Map<String, String> getExpertLevels() { return expertLevels; }
    public void setExpertLevels(Map<String, String> expertLevels) { this.expertLevels = expertLevels; }
    public Double getOverallReliabilityScore() { return overallReliabilityScore; }
    public void setOverallReliabilityScore(Double overallReliabilityScore) { this.overallReliabilityScore = overallReliabilityScore; }
    public String getReliabilityTier() { return reliabilityTier; }
    public void setReliabilityTier(String reliabilityTier) { this.reliabilityTier = reliabilityTier; }
}
