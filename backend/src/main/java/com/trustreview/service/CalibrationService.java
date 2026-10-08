package com.trustreview.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustreview.dto.*;
import com.trustreview.model.*;
import com.trustreview.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class CalibrationService {

    private static final Logger log = LoggerFactory.getLogger(CalibrationService.class);
    public static final int MIN_CALIBRATION_SAMPLES = 2;

    private final CalibrationSampleRepository sampleRepository;
    private final CalibrationScoreRepository scoreRepository;
    private final AssignmentRepository assignmentRepository;
    private final AuditLedgerService auditLedgerService;
    private final ObjectMapper objectMapper;

    public CalibrationService(CalibrationSampleRepository sampleRepository,
                              CalibrationScoreRepository scoreRepository,
                              AssignmentRepository assignmentRepository,
                              AuditLedgerService auditLedgerService,
                              ObjectMapper objectMapper) {
        this.sampleRepository = sampleRepository;
        this.scoreRepository = scoreRepository;
        this.assignmentRepository = assignmentRepository;
        this.auditLedgerService = auditLedgerService;
        this.objectMapper = objectMapper;
    }

    /**
     * Lists calibration samples for an assignment or general course.
     * Anti-cheat: expertScores and expertFeedback are withheld unless user has already completed the sample or is staff.
     */
    @Transactional(readOnly = true)
    public List<CalibrationSampleDto> getSamples(String assignmentId, User currentUser) {
        List<CalibrationSample> samples;
        if (assignmentId != null && !assignmentId.isBlank()) {
            Assignment assignment = assignmentRepository.findById(assignmentId).orElse(null);
            samples = assignment != null
                    ? sampleRepository.findByAssignmentOrderByCreatedAtAsc(assignment)
                    : sampleRepository.findAllByOrderByCreatedAtAsc();
        } else {
            samples = sampleRepository.findAllByOrderByCreatedAtAsc();
        }

        return samples.stream().map(s -> {
            Optional<CalibrationScore> scoreOpt = scoreRepository.findBySampleAndStudent(s, currentUser);
            boolean isCompleted = scoreOpt.isPresent();
            Double accuracy = scoreOpt.map(CalibrationScore::getAccuracyPercentage).orElse(null);
            return CalibrationSampleDto.from(s, isCompleted, accuracy);
        }).collect(Collectors.toList());
    }

    /**
     * Evaluates a student's calibration attempt against the expert benchmark.
     */
    @Transactional
    public CalibrationResultDto evaluateCalibration(String sampleId, SubmitCalibrationRequest req, User student, String clientIp) {
        CalibrationSample sample = sampleRepository.findById(sampleId)
                .orElseThrow(() -> new IllegalArgumentException("Calibration sample not found: " + sampleId));

        if (scoreRepository.existsBySampleAndStudent(sample, student)) {
            throw new IllegalStateException("You have already completed this calibration sample.");
        }

        Map<String, Integer> expertMap = parseScoreMap(sample.getExpertScores());
        Map<String, Integer> studentMap = req.getScores();

        List<RubricCriterionDto> rubric = RubricSupport.rubricForSample(sample);
        RubricSupport.validateScores(studentMap, rubric);

        // Calculate Mean Absolute Error (MAE) with optional rubric weights
        Map<String, Double> weights = RubricSupport.weights(rubric);
        double totalDiff = 0.0;
        double totalWeight = 0.0;
        int matchingLevels = 0;
        int evaluatedCriteria = 0;

        Map<String, String> studentLevels = new LinkedHashMap<>();
        Map<String, String> expertLevels = new LinkedHashMap<>();

        for (RubricCriterionDto criterion : rubric) {
            String key = criterion.getName();
            Integer studentScore = studentMap.get(key);
            Integer expertScore = expertMap.get(key);
            if (studentScore != null && expertScore != null) {
                double w = weights.getOrDefault(key, 1.0);
                totalDiff += Math.abs(studentScore - expertScore) * w;
                totalWeight += w;
                evaluatedCriteria++;

                String sLevel = RubricSupport.levelLabel(criterion, studentScore);
                String eLevel = RubricSupport.levelLabel(criterion, expertScore);
                studentLevels.put(key, sLevel);
                expertLevels.put(key, eLevel);
                if (RubricSupport.levelIndex(studentScore) == RubricSupport.levelIndex(expertScore)) {
                    matchingLevels++;
                }
            }
        }

        double mae = totalWeight > 0 ? (totalDiff / totalWeight) : 0.0;
        // Formula: max(0.0, min(100.0, 100.0 - (MAE * 10.0)))
        double accuracy = Math.max(0.0, Math.min(100.0, 100.0 - (mae * 10.0)));
        double levelAgreementPct = evaluatedCriteria > 0
                ? Math.round(((double) matchingLevels / evaluatedCriteria) * 1000.0) / 10.0
                : 0.0;

        CalibrationScore score = new CalibrationScore();
        score.setSample(sample);
        score.setStudent(student);
        score.setStudentScores(writeScoreMap(studentMap));
        score.setStudentRationale(req.getRationale());
        score.setMeanAbsoluteError(Math.round(mae * 100.0) / 100.0);
        score.setAccuracyPercentage(Math.round(accuracy * 10.0) / 10.0);

        CalibrationScore saved = scoreRepository.save(score);

        // Audit log
        auditLedgerService.logEvent(
                "CALIBRATION_EVALUATED",
                student.getEmail(),
                "CalibrationScore",
                saved.getId(),
                "Calibration completed for sample '" + sample.getTitle() + "' | MAE: " + score.getMeanAbsoluteError() + " | Accuracy: " + score.getAccuracyPercentage() + "%",
                clientIp
        );

        ReviewerReliabilityDto reliability = getStudentReliability(student);

        CalibrationResultDto result = new CalibrationResultDto();
        result.setSampleId(sample.getId());
        result.setSampleTitle(sample.getTitle());
        result.setStudentScores(studentMap);
        result.setExpertScores(expertMap);
        result.setExpertFeedback(sample.getExpertFeedback());
        result.setMeanAbsoluteError(saved.getMeanAbsoluteError());
        result.setAccuracyPercentage(saved.getAccuracyPercentage());
        result.setLevelAgreementPct(levelAgreementPct);
        result.setStudentLevels(studentLevels);
        result.setExpertLevels(expertLevels);
        result.setOverallReliabilityScore(reliability.getReliabilityScore());
        result.setReliabilityTier(reliability.getReliabilityTier());

        return result;
    }

    /**
     * Calculates the student's aggregate reliability across all completed calibration samples.
     * Enforces minimum sample floor (MIN_CALIBRATION_SAMPLES = 2).
     */
    @Transactional(readOnly = true)
    public ReviewerReliabilityDto getStudentReliability(User student) {
        List<CalibrationScore> scores = scoreRepository.findByStudent(student);
        ReviewerReliabilityDto dto = new ReviewerReliabilityDto();
        dto.setStudentId(student.getId());
        dto.setStudentName(student.getFullName());
        dto.setSamplesCompleted(scores.size());

        if (scores.size() < MIN_CALIBRATION_SAMPLES) {
            dto.setCalibrated(false);
            dto.setReliabilityTier("INSUFFICIENT_DATA");
            dto.setReliabilityScore(null);
            return dto;
        }

        double sumAccuracy = scores.stream().mapToDouble(CalibrationScore::getAccuracyPercentage).sum();
        double avgAccuracy = Math.round((sumAccuracy / scores.size()) * 10.0) / 10.0;

        dto.setCalibrated(true);
        dto.setReliabilityScore(avgAccuracy);

        if (avgAccuracy >= 80.0) {
            dto.setReliabilityTier("HIGH");
        } else if (avgAccuracy >= 65.0) {
            dto.setReliabilityTier("MODERATE");
        } else {
            dto.setReliabilityTier("LOW");
        }

        return dto;
    }

    @Transactional
    public CalibrationSample createSample(String assignmentId, String title, String description,
                                          String sampleContent, Map<String, Integer> expertScores,
                                          String expertFeedback, User instructor) {
        CalibrationSample sample = new CalibrationSample();
        if (assignmentId != null && !assignmentId.isBlank()) {
            assignmentRepository.findById(assignmentId).ifPresent(sample::setAssignment);
        }
        if (sample.getAssignment() != null) {
            List<RubricCriterionDto> rubric = RubricSupport.parse(sample.getAssignment().getRubricCriteria());
            RubricSupport.validateScores(expertScores, rubric);
        }
        sample.setTitle(title);
        sample.setDescription(description);
        sample.setSampleContent(sampleContent);
        sample.setExpertScores(writeScoreMap(expertScores));
        sample.setExpertFeedback(expertFeedback);
        sample.setCreatedBy(instructor);
        return sampleRepository.save(sample);
    }

    private Map<String, Integer> parseScoreMap(String json) {
        try {
            if (json == null || json.isBlank()) return Collections.emptyMap();
            return objectMapper.readValue(json, new TypeReference<Map<String, Integer>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse scores JSON: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private String writeScoreMap(Map<String, Integer> map) {
        try {
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }
}
