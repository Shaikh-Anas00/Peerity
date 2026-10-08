package com.trustreview.model;

/**
 * How a rubric criterion is scored by a reviewer.
 *
 * <ul>
 *   <li>{@link #SCALE_WITH_LEVELS}: pick one of four performance levels (the original model).
 *       This is also what a criterion means when the field is absent in stored JSON.</li>
 *   <li>{@link #QUESTION_BASED}: answer one or more questions, each by choosing one of five
 *       full-sentence options. The criterion score is derived from the chosen options and
 *       resolves to the same 0-10 integer the level model produces.</li>
 * </ul>
 */
public enum EvaluationType {
    SCALE_WITH_LEVELS,
    QUESTION_BASED
}
