package com.trustreview.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public class SubmitCalibrationRequest {

    @NotNull(message = "Scores map is required")
    private Map<String, Integer> scores;

    @NotBlank(message = "Evaluation rationale is required")
    private String rationale;

    public SubmitCalibrationRequest() {}

    public Map<String, Integer> getScores() { return scores; }
    public void setScores(Map<String, Integer> scores) { this.scores = scores; }
    public String getRationale() { return rationale; }
    public void setRationale(String rationale) { this.rationale = rationale; }
}
