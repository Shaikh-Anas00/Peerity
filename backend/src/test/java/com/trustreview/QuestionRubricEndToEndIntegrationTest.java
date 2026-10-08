package com.trustreview;

import com.trustreview.dto.CreateAssignmentRequest;
import com.trustreview.dto.ReviewDto;
import com.trustreview.dto.RubricCriterionDto;
import com.trustreview.dto.SubmitReviewRequest;
import com.trustreview.model.*;
import com.trustreview.repository.*;
import com.trustreview.service.AssignmentService;
import com.trustreview.service.ReviewService;
import com.trustreview.service.RubricSupport;
import com.trustreview.service.StarterTemplates;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Question-Based Rubric End-to-End Workflow Integration Test")
public class QuestionRubricEndToEndIntegrationTest {

    @Autowired private AssignmentService assignmentService;
    @Autowired private ReviewService reviewService;
    @Autowired private AssignmentRepository assignmentRepository;
    @Autowired private SubmissionRepository submissionRepository;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RubricTemplateRepository templateRepository;

    private User instructor;
    private User student1;
    private User student2;

    @BeforeEach
    void setupUsers() {
        instructor = userRepository.findByEmail("e2e_inst@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("e2e_inst@trustreview.edu", "pw", "E2E Instructor", Role.INSTRUCTOR, "CS", "CS")));

        student1 = userRepository.findByEmail("e2e_student1@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("e2e_student1@trustreview.edu", "pw", "E2E Student 1", Role.STUDENT, "CS", "CS")));

        student2 = userRepository.findByEmail("e2e_student2@trustreview.edu").orElseGet(() ->
                userRepository.save(new User("e2e_student2@trustreview.edu", "pw", "E2E Student 2", Role.STUDENT, "CS", "CS")));
    }

    @Test
    @DisplayName("End-to-End: Coding Template Assignment creation, distribution, question-based evaluation, and score persistence")
    void testCodingTemplateEndToEnd() {
        // 1. Instructor selects the Coding starter template
        List<RubricTemplate> starters = StarterTemplates.all();
        RubricTemplate codingTpl = starters.stream()
                .filter(t -> t.getName().equals(StarterTemplates.CODING))
                .findFirst().orElseThrow();
        List<RubricCriterionDto> clonedCriteria = RubricSupport.parse(codingTpl.getCriteriaJson());

        // 2. Instructor creates an assignment using cloned criteria
        CreateAssignmentRequest createReq = new CreateAssignmentRequest();
        createReq.setTitle("E2E Coding Project: Distributed Cache");
        createReq.setDescription("Implement a thread-safe distributed cache with LRU eviction.");
        createReq.setRubric(clonedCriteria);
        createReq.setDeadline(LocalDateTime.now().plusDays(7));
        createReq.setReviewDeadline(LocalDateTime.now().plusDays(14));

        var assignmentDto = assignmentService.create(createReq, instructor);
        assertNotNull(assignmentDto.getId());
        Assignment assignment = assignmentRepository.findById(assignmentDto.getId()).orElseThrow();
        assertTrue(RubricSupport.hasQuestionBased(RubricSupport.parse(assignment.getRubricCriteria())));

        // 3. Students submit work
        Submission sub1 = createSubmission(assignment, student1, "cache_impl.zip");
        Submission sub2 = createSubmission(assignment, student2, "lru_cache.zip");

        // 4. Distribute reviews (peer review assignment)
        reviewService.distribute(assignment.getId(), 1, instructor);

        // 5. Reviewer (student2) grades student1's submission using Question-Based options
        List<ReviewDto> assignedToStudent2 = reviewService.getAssignedToMe(student2);
        assertFalse(assignedToStudent2.isEmpty(), "Student 2 should be assigned a review");
        ReviewDto reviewCard = assignedToStudent2.get(0);

        // Exact criteria from StarterTemplates:
        // "Code Quality": Q1=5, Q2=4 -> avg=4.5 -> resolved=9
        // "Correctness & Edge-Case Handling": Q1=4, Q2=5 -> avg=4.5 -> resolved=9
        // "Documentation": Q1=3, Q2=4 -> avg=3.5 -> resolved=7
        String answersJson = "{" +
                "\"Code Quality\":[5,4]," +
                "\"Correctness & Edge-Case Handling\":[4,5]," +
                "\"Documentation\":[3,4]" +
                "}";

        String scoresJson = "{" +
                "\"Code Quality\":9," +
                "\"Correctness & Edge-Case Handling\":9," +
                "\"Documentation\":7" +
                "}";

        SubmitReviewRequest submitReq = new SubmitReviewRequest();
        submitReq.setScores(scoresJson);
        submitReq.setAnswers(answersJson);
        submitReq.setFeedbackText("Clean modular architecture and robust synchronization primitives. Minor documentation gaps in eviction policies.");

        ReviewDto submittedReview = reviewService.submitReview(reviewCard.getId(), submitReq, student2);

        // 6. Verify review persistence and downstream equivalence
        assertEquals("COMPLETED", submittedReview.getStatus());
        assertEquals(scoresJson, submittedReview.getScores());
        assertNotNull(submittedReview.getAnswers());
        assertEquals(answersJson, submittedReview.getAnswers());

        Review reloaded = reviewRepository.findById(reviewCard.getId()).orElseThrow();
        assertEquals("COMPLETED", reloaded.getStatus());
        assertEquals(answersJson, reloaded.getAnswers());
        Map<String, Integer> scoreMap = RubricSupport.parseScoreMap(reloaded.getScores());
        assertEquals(9, scoreMap.get("Code Quality"));
        assertEquals(9, scoreMap.get("Correctness & Edge-Case Handling"));
        assertEquals(7, scoreMap.get("Documentation"));
    }

    @Test
    @DisplayName("End-to-End: Essay Template Assignment creation, distribution, question-based evaluation, and score persistence")
    void testEssayTemplateEndToEnd() {
        // 1. Instructor selects the Essay starter template
        List<RubricTemplate> starters = StarterTemplates.all();
        RubricTemplate essayTpl = starters.stream()
                .filter(t -> t.getName().equals(StarterTemplates.ESSAY))
                .findFirst().orElseThrow();
        List<RubricCriterionDto> clonedCriteria = RubricSupport.parse(essayTpl.getCriteriaJson());

        CreateAssignmentRequest createReq = new CreateAssignmentRequest();
        createReq.setTitle("E2E Essay: Ethics of Autonomous Systems");
        createReq.setDescription("Write a 2000-word critical analysis on algorithmic bias.");
        createReq.setRubric(clonedCriteria);
        createReq.setDeadline(LocalDateTime.now().plusDays(5));
        createReq.setReviewDeadline(LocalDateTime.now().plusDays(10));

        var assignmentDto = assignmentService.create(createReq, instructor);
        Assignment assignment = assignmentRepository.findById(assignmentDto.getId()).orElseThrow();

        // 2. Students submit and distribute
        Submission sub1 = createSubmission(assignment, student1, "ethics_paper.pdf");
        Submission sub2 = createSubmission(assignment, student2, "autonomous_ethics.pdf");
        reviewService.distribute(assignment.getId(), 1, instructor);

        // 3. Reviewer (student1) grades student2's submission
        List<ReviewDto> assignedToStudent1 = reviewService.getAssignedToMe(student1);
        ReviewDto reviewCard = assignedToStudent1.get(0);

        // Essay has 4 criteria with 2 questions each:
        // "Argument Clarity": [5,5] -> 10
        // "Evidence Use": [4,4] -> 8
        // "Organization": [4,5] -> 9
        // "Mechanics": [5,4] -> 9
        String answersJson = "{" +
                "\"Argument Clarity\":[5,5]," +
                "\"Evidence Use\":[4,4]," +
                "\"Organization\":[4,5]," +
                "\"Mechanics\":[5,4]" +
                "}";

        String scoresJson = "{" +
                "\"Argument Clarity\":10," +
                "\"Evidence Use\":8," +
                "\"Organization\":9," +
                "\"Mechanics\":9" +
                "}";

        SubmitReviewRequest submitReq = new SubmitReviewRequest();
        submitReq.setScores(scoresJson);
        submitReq.setAnswers(answersJson);
        submitReq.setFeedbackText("Compelling thesis statement supported by rigorous empirical studies. Transitions between sections are fluid.");

        ReviewDto submittedReview = reviewService.submitReview(reviewCard.getId(), submitReq, student1);

        assertEquals("COMPLETED", submittedReview.getStatus());
        assertEquals(scoresJson, submittedReview.getScores());
        assertNotNull(submittedReview.getAnswers());
        assertEquals(answersJson, submittedReview.getAnswers());
    }

    @Test
    @DisplayName("End-to-End: Presentation Template Assignment creation, distribution, question-based evaluation, and score persistence")
    void testPresentationTemplateEndToEnd() {
        // 1. Instructor selects the Presentation starter template
        List<RubricTemplate> starters = StarterTemplates.all();
        RubricTemplate presTpl = starters.stream()
                .filter(t -> t.getName().equals(StarterTemplates.PRESENTATION))
                .findFirst().orElseThrow();
        List<RubricCriterionDto> clonedCriteria = RubricSupport.parse(presTpl.getCriteriaJson());

        CreateAssignmentRequest createReq = new CreateAssignmentRequest();
        createReq.setTitle("E2E Presentation: Capstone Demo");
        createReq.setDescription("Deliver a 10-minute slide deck presentation and system demo.");
        createReq.setRubric(clonedCriteria);
        createReq.setDeadline(LocalDateTime.now().plusDays(4));
        createReq.setReviewDeadline(LocalDateTime.now().plusDays(8));

        var assignmentDto = assignmentService.create(createReq, instructor);
        Assignment assignment = assignmentRepository.findById(assignmentDto.getId()).orElseThrow();

        // 2. Students submit and distribute
        Submission sub1 = createSubmission(assignment, student1, "capstone_deck.pdf");
        Submission sub2 = createSubmission(assignment, student2, "project_demo.pdf");
        reviewService.distribute(assignment.getId(), 1, instructor);

        // 3. Reviewer grades
        List<ReviewDto> assignedToStudent2 = reviewService.getAssignedToMe(student2);
        ReviewDto reviewCard = assignedToStudent2.get(0);

        // Presentation has 4 criteria with 2 questions each:
        // "Content": [4,4] -> 8
        // "Delivery": [3,3] -> 6
        // "Engagement": [4,5] -> 9
        // "Structure": [5,4] -> 9
        String answersJson = "{" +
                "\"Content\":[4,4]," +
                "\"Delivery\":[3,3]," +
                "\"Engagement\":[4,5]," +
                "\"Structure\":[5,4]" +
                "}";

        String scoresJson = "{" +
                "\"Content\":8," +
                "\"Delivery\":6," +
                "\"Engagement\":9," +
                "\"Structure\":9" +
                "}";

        SubmitReviewRequest submitReq = new SubmitReviewRequest();
        submitReq.setScores(scoresJson);
        submitReq.setAnswers(answersJson);
        submitReq.setFeedbackText("Excellent visuals and clear slide pacing. Vocal delivery could be more varied and confident.");

        ReviewDto submittedReview = reviewService.submitReview(reviewCard.getId(), submitReq, student2);

        assertEquals("COMPLETED", submittedReview.getStatus());
        assertEquals(scoresJson, submittedReview.getScores());
        assertNotNull(submittedReview.getAnswers());
        assertEquals(answersJson, submittedReview.getAnswers());
    }

    private Submission createSubmission(Assignment assignment, User author, String fileName) {
        Submission s = new Submission();
        s.setAssignment(assignment);
        s.setAuthor(author);
        s.setOriginalFileName(fileName);
        s.setFilePath(fileName + ".enc");
        s.setFileHash("hash-" + fileName);
        s.setFileSize("150 KB");
        s.setFileType("application/pdf");
        s.setStatus("SUBMITTED");
        s.setSubmittedAt(LocalDateTime.now());
        return submissionRepository.save(s);
    }
}
