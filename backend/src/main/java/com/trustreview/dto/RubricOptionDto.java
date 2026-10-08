package com.trustreview.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One selectable answer of a {@link RubricQuestionDto}: a full descriptive sentence plus the
 * score value (1 = lowest ... 5 = highest). The server forces {@code scoreValue} from the
 * option's position so clients cannot drift it, mirroring how level anchors work.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class RubricOptionDto {
    private String text;
    private Integer scoreValue;

    public RubricOptionDto() {}

    public RubricOptionDto(String text, Integer scoreValue) {
        this.text = text;
        this.scoreValue = scoreValue;
    }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public Integer getScoreValue() { return scoreValue; }
    public void setScoreValue(Integer scoreValue) { this.scoreValue = scoreValue; }
}
