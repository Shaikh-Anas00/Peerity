package com.trustreview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustreview.dto.PerformanceLevelDto;
import com.trustreview.dto.RubricCriterionDto;
import com.trustreview.dto.RubricOptionDto;
import com.trustreview.dto.RubricQuestionDto;
import com.trustreview.model.CalibrationSample;
import com.trustreview.model.EvaluationType;

import java.util.*;

/**
 * Parsing, validation and normalisation of assignment rubrics.
 *
 * <p>Storage format (column {@code assignments.rubric_criteria}):
 * <ul>
 *   <li><b>v2</b>: JSON array of criterion objects, each with four performance levels.</li>
 *   <li><b>legacy</b>: JSON array of criterion-name strings. These are upgraded at read time
 *       to criteria with the four default level labels and no descriptors, so existing data
 *       keeps working without a migration.</li>
 * </ul>
 *
 * <p>Score maps everywhere stay {@code {criterionName: integer 0-10}}. For v2 rubrics each value
 * must be one of the fixed level anchors (10/8/6/2); the server overwrites any client-supplied
 * anchors so they cannot drift. Legacy criteria accept any integer 0-10.
 *
 * <p>A criterion may instead be {@link EvaluationType#QUESTION_BASED}: the reviewer answers
 * questions by choosing one of five sentences each (values 1-5) and the criterion score is
 * {@link #resolveQuestionScore(int[])} = half-up({@code 2 x average}), an integer in 2-10. It is
 * stored in the same score map, so calibration, analytics and the policy engine are unchanged.
 *
 * <p>This is a static helper (not a bean) because the DTO factories that need it are static.
 */
public final class RubricSupport {

    public static final int MAX_CRITERIA = 8;
    public static final int[] ANCHORS = {10, 8, 6, 2};
    public static final String[] RANGES = {"9-10", "7-8", "5-6", "0-4"};
    public static final String[] DEFAULT_LABELS = {"Exemplary", "Proficient", "Developing", "Needs Improvement"};

    /** Limits chosen so the worst-case rubric JSON stays well under a 64 KB TEXT column. */
    public static final int MAX_QUESTIONS_PER_CRITERION = 4;
    public static final int OPTIONS_PER_QUESTION = 5;
    public static final int MAX_QUESTION_PROMPT_LENGTH = 250;
    public static final int MAX_OPTION_TEXT_LENGTH = 200;
    /** Lowest / highest score a question-based criterion can resolve to. */
    public static final int QUESTION_SCORE_MIN = 2;
    public static final int QUESTION_SCORE_MAX = 10;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private RubricSupport() {}

    // ── Defaults / legacy upgrade ────────────────────────────────────────────

    /** The four default levels with no descriptor text (used for legacy criteria). */
    public static List<PerformanceLevelDto> defaultLevels() {
        List<PerformanceLevelDto> levels = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            levels.add(new PerformanceLevelDto(DEFAULT_LABELS[i], ANCHORS[i], RANGES[i], null));
        }
        return levels;
    }

    private static RubricCriterionDto legacyCriterion(String name) {
        return new RubricCriterionDto(name, null, null, defaultLevels());
    }

    /** Builds legacy criteria from bare criterion names (e.g. calibration samples with no assignment). */
    public static List<RubricCriterionDto> fromScoreKeys(Collection<String> names) {
        List<RubricCriterionDto> out = new ArrayList<>();
        for (String n : names) {
            out.add(legacyCriterion(n));
        }
        return out;
    }

    /** True when the criterion is scored by answering questions (absent type means level-based). */
    public static boolean isQuestionBased(RubricCriterionDto c) {
        return c != null && c.getEvaluationType() == EvaluationType.QUESTION_BASED;
    }

    /** True when at least one criterion of the rubric is question-based. */
    public static boolean hasQuestionBased(List<RubricCriterionDto> rubric) {
        if (rubric == null) return false;
        for (RubricCriterionDto c : rubric) {
            if (isQuestionBased(c)) return true;
        }
        return false;
    }

    private static boolean isLegacyCriterion(RubricCriterionDto c) {
        if (isQuestionBased(c)) return false;
        if (c.getLevels() == null || c.getLevels().size() != 4) return true;
        for (PerformanceLevelDto l : c.getLevels()) {
            if (l.getDescription() == null || l.getDescription().isBlank()) return true;
        }
        return false;
    }

    // ── Parse / serialise ────────────────────────────────────────────────────

    /** Reads either storage format; never returns null. Unparseable input yields one legacy criterion. */
    public static List<RubricCriterionDto> parse(String json) {
        List<RubricCriterionDto> out = new ArrayList<>();
        if (json == null || json.isBlank()) return out;
        try {
            JsonNode root = MAPPER.readTree(json);
            if (!root.isArray()) {
                out.add(legacyCriterion(json.trim()));
                return out;
            }
            for (JsonNode n : root) {
                if (n.isTextual()) {
                    String t = n.asText().trim();
                    if (!t.isEmpty()) out.add(legacyCriterion(t));
                } else if (n.isObject()) {
                    RubricCriterionDto c = MAPPER.treeToValue(n, RubricCriterionDto.class);
                    if (c.getName() == null || c.getName().isBlank()) continue;
                    if (isQuestionBased(c)) {
                        // Levels are only used to label a resolved score (e.g. calibration level agreement).
                        c.setLevels(defaultLevels());
                        if (c.getQuestions() == null) c.setQuestions(new ArrayList<>());
                    } else if (c.getLevels() == null || c.getLevels().size() != 4) {
                        c.setLevels(defaultLevels());
                    }
                    out.add(c);
                }
            }
        } catch (Exception e) {
            out.clear();
            out.add(legacyCriterion(json.trim()));
        }
        return out;
    }

    public static String toJson(List<RubricCriterionDto> rubric) {
        try {
            return MAPPER.writeValueAsString(rubric);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialise rubric: " + e.getMessage());
        }
    }

    // ── Authoring validation ─────────────────────────────────────────────────

    /**
     * Validates an instructor-authored rubric and returns the server-normalised copy
     * (trimmed text, anchors/ranges forced to the fixed values).
     */
    public static List<RubricCriterionDto> normalize(List<RubricCriterionDto> in) {
        if (in == null || in.isEmpty()) {
            throw new IllegalArgumentException("At least one rubric criterion is required.");
        }
        if (in.size() > MAX_CRITERIA) {
            throw new IllegalArgumentException("A rubric can have at most " + MAX_CRITERIA + " criteria.");
        }

        List<RubricCriterionDto> out = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        int weighted = 0;
        int weightSum = 0;

        for (RubricCriterionDto c : in) {
            String name = c.getName() == null ? "" : c.getName().trim();
            if (name.isEmpty()) throw new IllegalArgumentException("Every criterion needs a name.");
            if (name.length() > 80) throw new IllegalArgumentException("Criterion name '" + name + "' exceeds 80 characters.");
            if (!seen.add(name.toLowerCase(Locale.ROOT))) {
                throw new IllegalArgumentException("Duplicate criterion name: '" + name + "'.");
            }

            String desc = c.getDescription() == null ? null : c.getDescription().trim();
            if (desc != null && desc.isEmpty()) desc = null;
            if (desc != null && desc.length() > 500) {
                throw new IllegalArgumentException("Description of '" + name + "' exceeds 500 characters.");
            }

            List<PerformanceLevelDto> levels;
            List<RubricQuestionDto> questions = null;
            EvaluationType type = null;
            if (isQuestionBased(c)) {
                type = EvaluationType.QUESTION_BASED;
                questions = normalizeQuestions(name, c.getQuestions());
                levels = defaultLevels();
            } else {
                if (c.getLevels() == null || c.getLevels().size() != 4) {
                    throw new IllegalArgumentException("Criterion '" + name + "' must define exactly 4 performance levels.");
                }
                levels = new ArrayList<>();
                for (int i = 0; i < 4; i++) {
                    PerformanceLevelDto l = c.getLevels().get(i);
                    String label = l.getLabel() == null ? "" : l.getLabel().trim();
                    if (label.isEmpty()) label = DEFAULT_LABELS[i];
                    if (label.length() > 40) {
                        throw new IllegalArgumentException("Level label '" + label + "' exceeds 40 characters.");
                    }
                    String ld = l.getDescription() == null ? "" : l.getDescription().trim();
                    if (ld.isEmpty()) {
                        throw new IllegalArgumentException(
                            "Level '" + label + "' of criterion '" + name + "' needs a descriptor.");
                    }
                    if (ld.length() > 300) {
                        throw new IllegalArgumentException(
                            "Descriptor for level '" + label + "' of '" + name + "' exceeds 300 characters.");
                    }
                    levels.add(new PerformanceLevelDto(label, ANCHORS[i], RANGES[i], ld));
                }
            }

            Integer weight = c.getWeight();
            if (weight != null) {
                if (weight < 1 || weight > 100) {
                    throw new IllegalArgumentException("Weight of '" + name + "' must be between 1 and 100.");
                }
                weighted++;
                weightSum += weight;
            }
            RubricCriterionDto normalized = new RubricCriterionDto(name, desc, weight, levels);
            normalized.setEvaluationType(type);
            normalized.setQuestions(questions);
            out.add(normalized);
        }

        if (weighted != 0 && weighted != out.size()) {
            throw new IllegalArgumentException("Either every criterion has a weight or none do.");
        }
        if (weighted != 0 && weightSum != 100) {
            throw new IllegalArgumentException("Criterion weights must sum to 100 (currently " + weightSum + ").");
        }
        return out;
    }

    // ── Question-based criteria ──────────────────────────────────────────────

    /**
     * Validates and normalises the questions of a question-based criterion: 1..4 questions,
     * each with a non-blank prompt and exactly five distinct non-blank option sentences.
     * {@code scoreValue} is forced to the option's position (1..5).
     */
    private static List<RubricQuestionDto> normalizeQuestions(String criterionName, List<RubricQuestionDto> in) {
        if (in == null || in.isEmpty()) {
            throw new IllegalArgumentException("Question-based criterion '" + criterionName + "' needs at least one question.");
        }
        if (in.size() > MAX_QUESTIONS_PER_CRITERION) {
            throw new IllegalArgumentException("Criterion '" + criterionName + "' can have at most "
                    + MAX_QUESTIONS_PER_CRITERION + " questions.");
        }
        List<RubricQuestionDto> out = new ArrayList<>();
        int qNo = 0;
        for (RubricQuestionDto q : in) {
            qNo++;
            String prompt = q == null || q.getPrompt() == null ? "" : q.getPrompt().trim();
            if (prompt.isEmpty()) {
                throw new IllegalArgumentException("Question " + qNo + " of '" + criterionName + "' needs a prompt.");
            }
            if (prompt.length() > MAX_QUESTION_PROMPT_LENGTH) {
                throw new IllegalArgumentException("Question " + qNo + " of '" + criterionName + "' exceeds "
                        + MAX_QUESTION_PROMPT_LENGTH + " characters.");
            }
            List<RubricOptionDto> opts = q.getOptions();
            if (opts == null || opts.size() != OPTIONS_PER_QUESTION) {
                throw new IllegalArgumentException("Question " + qNo + " of '" + criterionName + "' must have exactly "
                        + OPTIONS_PER_QUESTION + " options.");
            }
            List<RubricOptionDto> normalizedOpts = new ArrayList<>();
            Set<String> seenText = new HashSet<>();
            for (int i = 0; i < OPTIONS_PER_QUESTION; i++) {
                RubricOptionDto o = opts.get(i);
                String text = o == null || o.getText() == null ? "" : o.getText().trim();
                if (text.isEmpty()) {
                    throw new IllegalArgumentException("Option " + (i + 1) + " of question " + qNo + " in '"
                            + criterionName + "' needs text.");
                }
                if (text.length() > MAX_OPTION_TEXT_LENGTH) {
                    throw new IllegalArgumentException("Option " + (i + 1) + " of question " + qNo + " in '"
                            + criterionName + "' exceeds " + MAX_OPTION_TEXT_LENGTH + " characters.");
                }
                if (!seenText.add(text.toLowerCase(Locale.ROOT))) {
                    throw new IllegalArgumentException("Question " + qNo + " of '" + criterionName
                            + "' has duplicate option text.");
                }
                normalizedOpts.add(new RubricOptionDto(text, i + 1));
            }
            out.add(new RubricQuestionDto(prompt, normalizedOpts));
        }
        return out;
    }

    /**
     * The single source of truth for turning chosen option values (each 1..5) into the criterion's
     * 0-10 score: the exact integer half-up of {@code 2 x average}, i.e.
     * {@code floor((4 * sum + n) / (2 * n))}. Integer arithmetic keeps Java and the TypeScript
     * mirror from ever disagreeing through float rounding. Result is an integer in 2..10.
     */
    public static int resolveQuestionScore(int[] optionValues) {
        if (optionValues == null || optionValues.length == 0) {
            throw new IllegalArgumentException("At least one answer is required to resolve a question-based score.");
        }
        int sum = 0;
        for (int v : optionValues) {
            if (v < 1 || v > OPTIONS_PER_QUESTION) {
                throw new IllegalArgumentException("Answer values must be between 1 and " + OPTIONS_PER_QUESTION + ".");
            }
            sum += v;
        }
        int n = optionValues.length;
        return (4 * sum + n) / (2 * n);
    }

    /** Strictly parses {@code {criterionName: [optionValue, ...]}}. */
    public static Map<String, List<Integer>> parseAnswers(String json) {
        if (json == null || json.isBlank()) {
            throw new IllegalArgumentException("Answers are required for question-based criteria.");
        }
        try {
            JsonNode root = MAPPER.readTree(json);
            if (root == null || !root.isObject()) {
                throw new IllegalArgumentException("Answers must be a JSON object of criterion to list of option values.");
            }
            Map<String, List<Integer>> out = new LinkedHashMap<>();
            Iterator<Map.Entry<String, JsonNode>> it = root.fields();
            while (it.hasNext()) {
                Map.Entry<String, JsonNode> e = it.next();
                if (!e.getValue().isArray()) {
                    throw new IllegalArgumentException("Answers for '" + e.getKey() + "' must be a list.");
                }
                List<Integer> values = new ArrayList<>();
                for (JsonNode v : e.getValue()) {
                    if (!v.isNumber() || v.doubleValue() != Math.rint(v.doubleValue())) {
                        throw new IllegalArgumentException("Answers for '" + e.getKey() + "' must be whole numbers.");
                    }
                    values.add(v.intValue());
                }
                out.put(e.getKey(), values);
            }
            return out;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Answers are not valid JSON.");
        }
    }

    public static String answersToJson(Map<String, List<Integer>> answers) {
        try {
            return MAPPER.writeValueAsString(answers);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialise answers: " + e.getMessage());
        }
    }

    /**
     * Verifies the reviewer's per-question answers against the rubric: answers must cover exactly
     * the question-based criteria, give one value (1..5) per question, and resolve to the score
     * submitted for that criterion. Level-based criteria are not part of {@code answers}.
     */
    public static void validateAnswers(Map<String, List<Integer>> answers,
                                       List<RubricCriterionDto> rubric,
                                       Map<String, Integer> scores) {
        Map<String, RubricCriterionDto> qb = new LinkedHashMap<>();
        if (rubric != null) {
            for (RubricCriterionDto c : rubric) {
                if (isQuestionBased(c)) qb.put(c.getName(), c);
            }
        }
        if (qb.isEmpty()) return;

        Set<String> unknown = new LinkedHashSet<>(answers.keySet());
        unknown.removeAll(qb.keySet());
        if (!unknown.isEmpty()) {
            throw new IllegalArgumentException("Answers given for non question-based criteria: "
                    + String.join(", ", unknown) + ".");
        }
        for (Map.Entry<String, RubricCriterionDto> e : qb.entrySet()) {
            String name = e.getKey();
            List<Integer> chosen = answers.get(name);
            int expected = e.getValue().getQuestions() == null ? 0 : e.getValue().getQuestions().size();
            if (chosen == null || chosen.size() != expected) {
                throw new IllegalArgumentException("Criterion '" + name + "' needs exactly " + expected
                        + " answers (one per question).");
            }
            int[] values = new int[chosen.size()];
            for (int i = 0; i < values.length; i++) {
                Integer v = chosen.get(i);
                if (v == null || v < 1 || v > OPTIONS_PER_QUESTION) {
                    throw new IllegalArgumentException("Answer " + (i + 1) + " for '" + name + "' must be between 1 and "
                            + OPTIONS_PER_QUESTION + ".");
                }
                values[i] = v;
            }
            Integer submitted = scores.get(name);
            if (submitted == null || submitted != resolveQuestionScore(values)) {
                throw new IllegalArgumentException("Score for '" + name + "' does not match the selected answers.");
            }
        }
    }

    // ── Score validation / helpers ───────────────────────────────────────────

    /** Strictly parses a {@code {criterion: integer}} JSON object, preserving key order. */
    public static Map<String, Integer> parseScoreMap(String json) {
        if (json == null || json.isBlank()) {
            throw new IllegalArgumentException("Scores are required for every rubric criterion.");
        }
        try {
            JsonNode root = MAPPER.readTree(json);
            if (root == null || !root.isObject()) {
                throw new IllegalArgumentException("Scores must be a JSON object of criterion to integer score.");
            }
            Map<String, Integer> out = new LinkedHashMap<>();
            Iterator<Map.Entry<String, JsonNode>> it = root.fields();
            while (it.hasNext()) {
                Map.Entry<String, JsonNode> e = it.next();
                JsonNode v = e.getValue();
                if (!v.isNumber() || v.doubleValue() != Math.rint(v.doubleValue())) {
                    throw new IllegalArgumentException("Score for '" + e.getKey() + "' must be a whole number.");
                }
                out.put(e.getKey(), v.intValue());
            }
            return out;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Scores are not valid JSON.");
        }
    }

    /**
     * Ensures {@code scores} covers exactly the rubric's criteria and each value is allowed:
     * a level anchor for v2 criteria, any integer 0-10 for legacy criteria.
     * An empty rubric (nothing to validate against) only requires non-empty scores.
     */
    public static void validateScores(Map<String, Integer> scores, List<RubricCriterionDto> rubric) {
        if (scores == null || scores.isEmpty()) {
            throw new IllegalArgumentException("Scores are required for every rubric criterion.");
        }
        if (rubric == null || rubric.isEmpty()) return;

        Set<String> expected = new LinkedHashSet<>();
        for (RubricCriterionDto c : rubric) expected.add(c.getName());

        Set<String> missing = new LinkedHashSet<>(expected);
        missing.removeAll(scores.keySet());
        Set<String> unexpected = new LinkedHashSet<>(scores.keySet());
        unexpected.removeAll(expected);
        if (!missing.isEmpty()) {
            throw new IllegalArgumentException("Missing score for: " + String.join(", ", missing) + ".");
        }
        if (!unexpected.isEmpty()) {
            throw new IllegalArgumentException("Unknown criteria: " + String.join(", ", unexpected) + ".");
        }

        for (RubricCriterionDto c : rubric) {
            Integer v = scores.get(c.getName());
            if (v == null) {
                throw new IllegalArgumentException("Missing score for: " + c.getName() + ".");
            }
            if (isQuestionBased(c)) {
                if (v < QUESTION_SCORE_MIN || v > QUESTION_SCORE_MAX) {
                    throw new IllegalArgumentException("Score for '" + c.getName() + "' must be between "
                            + QUESTION_SCORE_MIN + " and " + QUESTION_SCORE_MAX + ".");
                }
            } else if (isLegacyCriterion(c)) {
                if (v < 0 || v > 10) {
                    throw new IllegalArgumentException("Score for '" + c.getName() + "' must be between 0 and 10.");
                }
            } else {
                boolean ok = false;
                for (PerformanceLevelDto l : c.getLevels()) {
                    if (l.getScore() != null && l.getScore().equals(v)) { ok = true; break; }
                }
                if (!ok) {
                    throw new IllegalArgumentException(
                        "Score for '" + c.getName() + "' must match one of the rubric performance levels.");
                }
            }
        }
    }

    /** Maps a 0-10 score to its level index (0 = Exemplary ... 3 = Needs Improvement). */
    public static int levelIndex(int score) {
        if (score >= 9) return 0;
        if (score >= 7) return 1;
        if (score >= 5) return 2;
        return 3;
    }

    /** Label of the level a score falls in, for a given criterion. */
    public static String levelLabel(RubricCriterionDto criterion, int score) {
        List<PerformanceLevelDto> levels = criterion.getLevels();
        int idx = levelIndex(score);
        return (levels != null && levels.size() == 4) ? levels.get(idx).getLabel() : DEFAULT_LABELS[idx];
    }

    /** Per-criterion weight factors: weight/100 when every criterion is weighted, otherwise equal (1.0). */
    public static Map<String, Double> weights(List<RubricCriterionDto> rubric) {
        Map<String, Double> w = new HashMap<>();
        boolean all = rubric != null && !rubric.isEmpty();
        if (rubric != null) {
            for (RubricCriterionDto c : rubric) {
                if (c.getWeight() == null) { all = false; break; }
            }
        }
        if (rubric != null) {
            for (RubricCriterionDto c : rubric) {
                w.put(c.getName(), all ? c.getWeight() / 100.0 : 1.0);
            }
        }
        return w;
    }

    /**
     * The rubric a calibration sample is scored against: the assignment's rubric when its criteria
     * match the expert score keys exactly, otherwise a legacy rubric built from the expert keys.
     * This guarantees reviewers always score the same criteria the expert did.
     */
    public static List<RubricCriterionDto> rubricForSample(CalibrationSample sample) {
        Set<String> expertKeys;
        try {
            expertKeys = parseScoreMap(sample.getExpertScores()).keySet();
        } catch (IllegalArgumentException e) {
            expertKeys = Collections.emptySet();
        }
        if (sample.getAssignment() != null) {
            List<RubricCriterionDto> fromAssignment = parse(sample.getAssignment().getRubricCriteria());
            Set<String> names = new LinkedHashSet<>();
            for (RubricCriterionDto c : fromAssignment) names.add(c.getName());
            if (!fromAssignment.isEmpty() && names.equals(expertKeys)) {
                return fromAssignment;
            }
        }
        return fromScoreKeys(expertKeys);
    }
}
