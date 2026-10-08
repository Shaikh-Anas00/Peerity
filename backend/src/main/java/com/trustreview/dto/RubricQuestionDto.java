package com.trustreview.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

/** A question belonging to a QUESTION_BASED criterion, with exactly five ordered options. */
@JsonIgnoreProperties(ignoreUnknown = true)
public class RubricQuestionDto {
    private String prompt;
    private List<RubricOptionDto> options = new ArrayList<>();

    public RubricQuestionDto() {}

    public RubricQuestionDto(String prompt, List<RubricOptionDto> options) {
        this.prompt = prompt;
        this.options = options;
    }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }
    public List<RubricOptionDto> getOptions() { return options; }
    public void setOptions(List<RubricOptionDto> options) { this.options = options; }
}
