package com.trustreview;

import com.trustreview.dto.RubricCriterionDto;
import com.trustreview.model.*;
import com.trustreview.repository.AssignmentRepository;
import com.trustreview.repository.RubricTemplateRepository;
import com.trustreview.repository.UserRepository;
import com.trustreview.service.RubricSupport;
import com.trustreview.service.StarterTemplates;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Rubric Template & Cloning Tests")
public class RubricTemplateTest {

    @Autowired private RubricTemplateRepository templateRepository;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private UserRepository userRepository;

    @Test
    @DisplayName("Starter Templates: All 3 templates are valid, pass normalization, and have realistic sentences")
    void testStarterTemplatesValidity() {
        List<RubricTemplate> templates = StarterTemplates.all();
        assertEquals(3, templates.size());

        for (RubricTemplate t : templates) {
            assertNotNull(t.getName());
            assertNotNull(t.getCategory());
            assertNotNull(t.getDescription());

            List<RubricCriterionDto> criteria = RubricSupport.parse(t.getCriteriaJson());
            assertFalse(criteria.isEmpty(), "Template " + t.getName() + " must have criteria");

            // Normalization must pass without exceptions
            List<RubricCriterionDto> normalized = RubricSupport.normalize(criteria);
            assertEquals(criteria.size(), normalized.size());

            for (RubricCriterionDto c : normalized) {
                assertEquals(EvaluationType.QUESTION_BASED, c.getEvaluationType());
                assertNotNull(c.getQuestions());
                assertFalse(c.getQuestions().isEmpty());

                for (var q : c.getQuestions()) {
                    assertTrue(q.getPrompt().length() >= 10, "Prompt must be a real sentence: " + q.getPrompt());
                    assertEquals(5, q.getOptions().size(), "Must have exactly 5 options");

                    for (int i = 0; i < 5; i++) {
                        var opt = q.getOptions().get(i);
                        assertEquals(i + 1, opt.getScoreValue());
                        assertTrue(opt.getText().length() >= 15, "Option must be a full sentence: " + opt.getText());
                    }
                }
            }
        }
    }

    @Test
    @DisplayName("Clone Independence: Assignments clone template criteria; subsequent template mutations do not affect assignment")
    void testCloneIndependence() {
        RubricTemplate codingTpl = templateRepository.findAllByOrderByNameAsc().stream()
                .filter(t -> t.getName().equals(StarterTemplates.CODING))
                .findFirst()
                .orElseGet(() -> templateRepository.save(StarterTemplates.all().stream()
                        .filter(t -> t.getName().equals(StarterTemplates.CODING))
                        .findFirst().orElseThrow()));

        // 1. Instructor clones template criteria into a new Assignment
        User instructor = userRepository.findByEmail("inst_clone@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("inst_clone@trustreview.edu", "pw", "Inst Clone", Role.INSTRUCTOR, "Apex", "CS")));

        List<RubricCriterionDto> clonedCriteria = RubricSupport.parse(codingTpl.getCriteriaJson());

        Assignment assignment = new Assignment();
        assignment.setTitle("Cloned Coding Assignment");
        assignment.setDescription("Using cloned criteria");
        assignment.setRubricCriteria(RubricSupport.toJson(clonedCriteria));
        assignment.setDeadline(LocalDateTime.now().plusDays(10));
        assignment.setCreatedBy(instructor);
        assignment = assignmentRepository.save(assignment);

        // 2. Simulate template being modified or replaced in the database
        codingTpl.setCriteriaJson("[]"); // cleared template
        templateRepository.save(codingTpl);

        // 3. Verify assignment criteria remain completely intact
        Assignment reloaded = assignmentRepository.findById(assignment.getId()).orElseThrow();
        List<RubricCriterionDto> assignmentCriteria = RubricSupport.parse(reloaded.getRubricCriteria());

        assertFalse(assignmentCriteria.isEmpty());
        assertEquals(3, assignmentCriteria.size());
        assertEquals("Code Quality", assignmentCriteria.get(0).getName());
    }
}
