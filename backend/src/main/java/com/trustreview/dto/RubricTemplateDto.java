package com.trustreview.dto;

import com.trustreview.model.RubricTemplate;
import com.trustreview.model.RubricTemplateCategory;
import com.trustreview.service.RubricSupport;

import java.util.List;

/** Read model of a starter rubric template; criteria are a fresh copy parsed from storage. */
public class RubricTemplateDto {
    private String id;
    private String name;
    private RubricTemplateCategory category;
    private String description;
    private List<RubricCriterionDto> criteria;

    public static RubricTemplateDto from(RubricTemplate t) {
        RubricTemplateDto dto = new RubricTemplateDto();
        dto.id = t.getId();
        dto.name = t.getName();
        dto.category = t.getCategory();
        dto.description = t.getDescription();
        dto.criteria = RubricSupport.parse(t.getCriteriaJson());
        return dto;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public RubricTemplateCategory getCategory() { return category; }
    public String getDescription() { return description; }
    public List<RubricCriterionDto> getCriteria() { return criteria; }
}
