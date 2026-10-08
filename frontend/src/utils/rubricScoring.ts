import { RubricCriterion } from "../api/assignmentApi";

/**
 * Checks whether a criterion is configured for QUESTION_BASED evaluation.
 */
export function isQuestionBased(c: RubricCriterion | string | null | undefined): boolean {
  if (!c || typeof c === "string") return false;
  return (
    c.evaluationType === "QUESTION_BASED" &&
    Array.isArray(c.questions) &&
    c.questions.length > 0
  );
}

/**
 * Resolves an array of 1..5 option values into an integer score in the range [2, 10].
 * Formula: floor((4 * sum + n) / (2 * n))
 * Equivalent to half-up rounding of 2 * (sum / n).
 */
export function resolveQuestionScore(optionValues: number[]): number {
  if (!optionValues || optionValues.length === 0) return 0;
  const n = optionValues.length;
  const sum = optionValues.reduce((a, b) => a + b, 0);
  return Math.floor((4 * sum + n) / (2 * n));
}

/**
 * Maps a numeric 0..10 score to a standard performance level label.
 */
export function levelLabelForScore(score: number): string {
  if (score >= 9) return "Exemplary";
  if (score >= 7) return "Proficient";
  if (score >= 5) return "Developing";
  return "Needs Improvement";
}

/**
 * Returns true if all questions for a given question-based criterion have been answered.
 */
export function isQuestionCriterionComplete(
  criterion: RubricCriterion,
  answers: number[] | undefined
): boolean {
  if (!isQuestionBased(criterion)) return false;
  const total = criterion.questions?.length ?? 0;
  if (total === 0) return false;
  if (!answers || answers.length !== total) return false;
  return answers.every((val) => typeof val === "number" && val >= 1 && val <= 5);
}
