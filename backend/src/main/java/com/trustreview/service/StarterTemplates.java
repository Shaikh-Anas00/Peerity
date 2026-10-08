package com.trustreview.service;

import com.trustreview.dto.RubricCriterionDto;
import com.trustreview.dto.RubricOptionDto;
import com.trustreview.dto.RubricQuestionDto;
import com.trustreview.model.EvaluationType;
import com.trustreview.model.RubricTemplate;
import com.trustreview.model.RubricTemplateCategory;

import java.util.ArrayList;
import java.util.List;

/**
 * The three built-in starter rubric templates (Coding, Essay, Presentation). Every criterion is
 * QUESTION_BASED: each question offers five full-sentence options ordered from weakest (1) to
 * strongest (5). Built as unsaved entities so the seeder and the tests share the exact content.
 */
public final class StarterTemplates {

    public static final String CODING = "Coding Project";
    public static final String ESSAY = "Essay / Written Report";
    public static final String PRESENTATION = "Presentation";

    private StarterTemplates() {}

    public static List<RubricTemplate> all() {
        return List.of(coding(), essay(), presentation());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static RubricQuestionDto q(String prompt, String o1, String o2, String o3, String o4, String o5) {
        List<RubricOptionDto> opts = new ArrayList<>();
        String[] texts = {o1, o2, o3, o4, o5};
        for (int i = 0; i < texts.length; i++) {
            opts.add(new RubricOptionDto(texts[i], i + 1));
        }
        return new RubricQuestionDto(prompt, opts);
    }

    private static RubricCriterionDto criterion(String name, String description, RubricQuestionDto... questions) {
        RubricCriterionDto c = new RubricCriterionDto(name, description, null, RubricSupport.defaultLevels());
        c.setEvaluationType(EvaluationType.QUESTION_BASED);
        c.setQuestions(new ArrayList<>(List.of(questions)));
        return c;
    }

    private static RubricTemplate template(String name, RubricTemplateCategory category, String description,
                                           RubricCriterionDto... criteria) {
        RubricTemplate t = new RubricTemplate();
        t.setName(name);
        t.setCategory(category);
        t.setDescription(description);
        t.setCriteriaJson(RubricSupport.toJson(RubricSupport.normalize(List.of(criteria))));
        return t;
    }

    // ── Coding ───────────────────────────────────────────────────────────────

    private static RubricTemplate coding() {
        return template(CODING, RubricTemplateCategory.CODING,
            "For programming assignments: code quality, correctness and edge-case handling, and documentation.",
            criterion("Code Quality", "Readability, structure and maintainability of the source code.",
                q("How readable and consistently structured is the code?",
                    "The code is very hard to follow, with unclear names, inconsistent formatting, and no visible organization.",
                    "Parts of the code can be understood with effort, but naming and formatting are inconsistent enough to slow comprehension.",
                    "The code is generally readable with mostly sensible names and formatting, though some sections are confusing or inconsistent.",
                    "The code is clearly written with descriptive names and consistent style, and only minor spots need clarification.",
                    "The code reads almost like prose, with precise names, uniform style, and a layout that makes the intent obvious at a glance."),
                q("How well is the code broken into focused, reusable units without unnecessary duplication?",
                    "Logic is lumped into a few huge blocks, and the same code is copied in many places.",
                    "Some functions or modules exist, but many are overloaded with responsibilities and noticeable duplication remains.",
                    "The code is reasonably divided into functions or modules, with a few oversized pieces or repeated snippets.",
                    "Each function or module has a clear purpose, and duplication is rare and easy to justify.",
                    "Every unit has a single clear responsibility, shared logic is neatly reused, and the structure would be easy to extend or test.")),
            criterion("Correctness & Edge-Case Handling",
                "Whether the code produces correct results, including for unusual or invalid input.",
                q("How reliably does the submitted code produce correct results across normal, boundary, and invalid inputs?",
                    "The program fails on basic inputs or crashes during ordinary use, and no edge cases appear to have been considered.",
                    "Common cases usually work, but boundary values or malformed input cause incorrect output or unhandled errors.",
                    "Typical and several boundary cases work correctly, though a few unusual inputs still produce wrong or unclear results.",
                    "Nearly all normal and boundary cases are handled correctly, and invalid input is rejected with clear, predictable behavior.",
                    "Every normal, boundary, and invalid input I tried behaves correctly, with errors handled gracefully and no crashes or silent failures."),
                q("How convincingly does the submission demonstrate that its behavior was tested or verified?",
                    "There is no evidence of testing, and I could not tell whether the code was ever run successfully.",
                    "Testing is mentioned or minimal, such as a single sample run, and it does not cover meaningful scenarios.",
                    "Some tests or sample runs cover the main features, but important scenarios and failure cases are untested.",
                    "A solid set of tests or documented runs covers the main features and several edge cases, with clear results.",
                    "Comprehensive tests or verification cover normal, boundary, and failure scenarios, are easy to run, and clearly show the results.")),
            criterion("Documentation", "How well the project explains how to use it and how it works.",
                q("How well does the README or setup guide let a new reader build and run the project?",
                    "There is no usable setup information, so I could not tell how to build or run the project.",
                    "Some setup hints exist, but key steps, dependencies, or commands are missing or wrong.",
                    "The instructions cover the basic steps, but I had to guess at a few details to get the project running.",
                    "The instructions are clear and complete enough that I could build and run the project with only minor questions.",
                    "The instructions are precise, complete, and ordered, with prerequisites and example usage so anyone could run the project on the first try."),
                q("How useful are the inline comments and API documentation for understanding why the code works the way it does?",
                    "There are no comments or documentation, or they are so wrong or trivial that they do not help.",
                    "Comments are sparse or mostly restate the code, and they rarely explain intent or design choices.",
                    "Comments explain some important parts, though many non-obvious decisions are left unexplained.",
                    "Comments and API notes explain most non-obvious decisions and make the interfaces easy to understand.",
                    "Comments and API documentation consistently explain the reasoning behind the design and document every public interface with its inputs, outputs, and edge cases.")));
    }

    // ── Essay ────────────────────────────────────────────────────────────────

    private static RubricTemplate essay() {
        return template(ESSAY, RubricTemplateCategory.ESSAY,
            "For essays and written reports: argument clarity, use of evidence, organization, and mechanics.",
            criterion("Argument Clarity", "How clear, arguable and logically developed the central argument is.",
                q("How clear and arguable is the thesis or central claim?",
                    "I could not identify a main claim, or the claim is too vague or obvious to argue about.",
                    "A claim is present but is broad or unclear, and I had to infer what the author is trying to prove.",
                    "The central claim is stated, though it could be sharper or more specific about what is being argued.",
                    "The central claim is clear, specific, and arguable, and it guides most of the essay.",
                    "The central claim is precise, insightful, and clearly arguable, and every section visibly serves it."),
                q("How logically does the reasoning move from point to point toward the conclusion?",
                    "The points are disconnected or contradict each other, so the conclusion does not follow from them.",
                    "Some connections between points are visible, but there are frequent gaps or unsupported leaps.",
                    "The reasoning mostly holds together, with a few steps that are weak or not fully explained.",
                    "The reasoning is sound and easy to follow, with only minor gaps and a conclusion that follows from the points made.",
                    "Each point builds convincingly on the previous one, counterarguments are considered, and the conclusion feels earned.")),
            criterion("Evidence Use", "The relevance, credibility and integration of the evidence supporting the claims.",
                q("How relevant and credible is the evidence used to support the claims?",
                    "Claims are made with little or no evidence, or the evidence has nothing to do with the claims.",
                    "Some evidence is given, but it is weak, outdated, or only loosely related to the claims.",
                    "The evidence is generally relevant, though some claims lack support or rely on questionable sources.",
                    "Most claims are backed by relevant and credible evidence from appropriate sources.",
                    "Every major claim is backed by specific, credible, and well-chosen evidence that clearly strengthens the argument."),
                q("How well is the evidence explained, integrated, and cited?",
                    "Evidence is dropped in without explanation, and sources are not cited.",
                    "Evidence is quoted or listed with little explanation, and citations are inconsistent or incomplete.",
                    "Evidence is introduced and partly explained, with citations that are mostly present but not always consistent.",
                    "Evidence is smoothly introduced, explained in relation to the claim, and consistently cited.",
                    "Evidence is woven seamlessly into the argument, each piece is analyzed to show why it matters, and citations are accurate and consistent.")),
            criterion("Organization", "How the writing is structured from the introduction to the conclusion.",
                q("How well is the essay structured into paragraphs that each develop one main idea?",
                    "The essay has no discernible structure, and ideas are mixed together within paragraphs.",
                    "There are paragraphs, but they often combine several ideas or wander away from the topic.",
                    "Most paragraphs focus on one idea, though some are unfocused or in an awkward order.",
                    "Paragraphs are focused and logically ordered, with only occasional lapses.",
                    "Every paragraph develops one clear idea and the order of paragraphs makes the whole essay easy to follow."),
                q("How effective are the introduction, transitions, and conclusion?",
                    "The essay lacks a real introduction or conclusion, and there are no transitions between ideas.",
                    "The introduction and conclusion are present but generic, and transitions are abrupt or missing.",
                    "The introduction and conclusion do their basic job, and transitions are present but sometimes mechanical.",
                    "The introduction frames the topic well, transitions are smooth, and the conclusion summarizes the argument effectively.",
                    "The introduction draws the reader in and previews the argument, transitions guide the reader smoothly, and the conclusion leaves a lasting, well-reasoned final impression.")),
            criterion("Mechanics", "Grammar, spelling, punctuation, tone and word choice.",
                q("How correct is the grammar, spelling, and punctuation?",
                    "Frequent errors in grammar, spelling, or punctuation make the writing hard to understand.",
                    "Errors are common enough to distract me and occasionally obscure the meaning.",
                    "There are some noticeable errors, but they rarely get in the way of understanding.",
                    "There are only a few minor errors that do not affect readability.",
                    "The writing is virtually free of errors in grammar, spelling, and punctuation."),
                q("How appropriate and effective are the tone, word choice, and sentence variety?",
                    "The tone is inappropriate for the audience, and word choice and sentence structure make the writing confusing or monotonous.",
                    "The tone or word choice is often awkward, and sentences are repetitive or hard to read.",
                    "The tone is mostly appropriate and the wording is clear, though sentence variety and precision are limited.",
                    "The tone suits the audience, the word choice is precise, and sentences are varied and readable.",
                    "The tone is polished and fits the purpose perfectly, with vivid, precise word choice and well-crafted sentences that vary naturally.")));
    }

    // ── Presentation ─────────────────────────────────────────────────────────

    private static RubricTemplate presentation() {
        return template(PRESENTATION, RubricTemplateCategory.PRESENTATION,
            "For oral or recorded presentations: content, delivery, engagement, and structure.",
            criterion("Content", "The accuracy, depth and suitability of the information presented.",
                q("How accurate and in-depth is the information presented?",
                    "The presentation contains major errors or is so shallow that it conveys almost nothing of substance.",
                    "Some correct information is shared, but there are noticeable errors or very little depth.",
                    "The information is mostly accurate and covers the basics, though depth is limited in places.",
                    "The information is accurate and demonstrates solid understanding with well-chosen detail.",
                    "The information is accurate, thorough, and shows deep understanding, including insights beyond the obvious."),
                q("How well does the content fit the audience and purpose of the presentation?",
                    "The content ignores who the audience is and what the presentation is supposed to achieve.",
                    "Some content is relevant, but much of it is off-topic or pitched at the wrong level for the audience.",
                    "The content generally suits the audience and purpose, though some parts are too basic, too technical, or unrelated.",
                    "The content is well-matched to the audience and purpose, with only minor lapses.",
                    "Every part of the content is carefully tailored to the audience and clearly advances the purpose of the presentation.")),
            criterion("Delivery", "The speaker's voice, pacing, confidence and body language.",
                q("How clear and well-paced is the speaker's voice?",
                    "The speech is very hard to hear or understand, with a pace that is far too fast, too slow, or full of fillers.",
                    "The voice is sometimes unclear, and the pace or filler words distract from the message.",
                    "The speech is understandable, with occasional problems in volume, pace, or filler words.",
                    "The speaker is clear and audible with a steady pace and few distracting fillers.",
                    "The speaker's voice is clear, expressive, and well-paced, using emphasis and pauses to reinforce key points."),
                q("How confident and natural is the speaker's body language and eye contact?",
                    "The speaker reads almost entirely from notes or slides and shows no connection with the audience.",
                    "The speaker relies heavily on notes and makes little eye contact, and body language is stiff or distracting.",
                    "The speaker looks at the audience at times, but still depends on notes and appears nervous in places.",
                    "The speaker maintains regular eye contact and appears comfortable, with natural gestures.",
                    "The speaker appears confident and relaxed, maintains steady eye contact with the whole audience, and uses purposeful gestures.")),
            criterion("Engagement", "How well the presentation holds attention and uses visual support.",
                q("How well does the presenter hold the audience's interest and involve them?",
                    "The presentation is difficult to pay attention to, with no effort to involve the audience.",
                    "The presenter makes little effort to engage the audience, and attention drifts for much of the time.",
                    "The presentation holds attention in places, with some attempts such as questions or examples to involve the audience.",
                    "The presenter keeps the audience interested with relevant examples, questions, or interaction.",
                    "The presenter captivates the audience throughout, using stories, questions, or interaction that make the audience want to think and participate."),
                q("How effective are the slides or visual aids at supporting the message?",
                    "The visuals are missing, unreadable, or so cluttered that they distract from the message.",
                    "The visuals are hard to read or overloaded with text and add little to the message.",
                    "The visuals are readable and relevant, though some are crowded or simply repeat what is said.",
                    "The visuals are clear and well-designed and support the main points.",
                    "The visuals are clean, striking, and purposeful, making complex ideas easy to understand without overwhelming the speaker.")),
            criterion("Structure", "How the presentation opens, flows, manages time and closes.",
                q("How clearly does the opening establish the topic and preview what is coming?",
                    "The presentation starts without any introduction, and I could not tell what it would be about.",
                    "The opening names the topic but gives no sense of the direction of the talk.",
                    "The opening introduces the topic and gives a basic outline of what will follow.",
                    "The opening clearly introduces the topic, explains why it matters, and previews the main points.",
                    "The opening grabs attention, establishes why the topic matters, and gives a clear roadmap that the rest of the talk follows."),
                q("How well do the main points flow, fit within the time limit, and end in a clear conclusion?",
                    "The ideas jump around with no order, the time limit is badly missed, and there is no conclusion.",
                    "The order of ideas is hard to follow, the timing is noticeably off, and the ending is abrupt.",
                    "The main points follow a recognizable order, the timing is acceptable, and there is a basic conclusion.",
                    "The points flow logically, the talk stays within the time limit, and the conclusion summarizes the key takeaways.",
                    "The points build in a seamless order, timing is managed precisely, and the conclusion ties everything together with a memorable takeaway.")));
    }
}
