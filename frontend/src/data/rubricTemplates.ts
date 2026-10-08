import { RubricCriterion } from "../api/assignmentApi";

export interface RubricTemplate {
  id: string;
  name: string;
  description: string;
  criteria: RubricCriterion[];
}

export const RUBRIC_TEMPLATES: RubricTemplate[] = [
  {
    id: "code-submission",
    name: "Code Submission",
    description: "Ideal for software engineering labs, algorithms, and technical implementations.",
    criteria: [
      {
        name: "Correctness",
        description: "Does the code satisfy all functional requirements, specifications, and edge cases?",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Passes all requirements and edge cases; no defects or runtime failures found." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Meets core requirements; minor edge-case oversights that do not crash the system." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Core happy path works; several required edge cases or secondary requirements fail." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Does not compile, crashes frequently, or fails the majority of specifications." }
        ]
      },
      {
        name: "Code Quality & Readability",
        description: "Adherence to clean code principles, idiomatic style, modularity, and formatting.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Clean, elegant, self-documenting code with excellent separation of concerns." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Well-structured and readable code with consistent conventions and naming." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Readable but contains noticeable code smells, monolithic functions, or inconsistent style." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Messy, disorganized, poorly formatted, or excessively convoluted logic." }
        ]
      },
      {
        name: "Testing & Validation",
        description: "Sufficiency and rigor of automated tests, assertion quality, and boundary coverage.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Exhaustive unit and integration test suite covering boundary conditions and failure modes." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Meaningful test coverage for primary user stories and common failure paths." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Sparse test suite with superficial assertions or missing key test scenarios." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "No automated tests provided or existing tests fail to run." }
        ]
      },
      {
        name: "Documentation & Architecture",
        description: "Clarity of setup instructions, inline comments, and architectural design justification.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Outstanding README with architecture diagrams, setup scripts, and insightful comments." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Clear setup guide and adequate code comments on complex logic." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Minimal documentation; requires guesswork to set up or understand design choices." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Missing documentation or contradictory and obsolete instructions." }
        ]
      }
    ]
  },
  {
    id: "written-report",
    name: "Written Report",
    description: "Designed for essays, research papers, technical analyses, and case studies.",
    criteria: [
      {
        name: "Thesis & Argument",
        description: "Clarity, depth, and persuasiveness of the central thesis and supporting claims.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Compelling, original, and tightly reasoned argument throughout." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Clear and focused thesis supported by structured, logical arguments." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Identifiable thesis but arguments wander or lack analytical depth." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Vague or absent thesis; claims lack logical foundation." }
        ]
      },
      {
        name: "Evidence & Analysis",
        description: "Relevance, quality, and rigorous interpretation of data, citations, and evidence.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Rich, credible evidence critically synthesized with insightful evaluation." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Appropriate evidence cited to validate arguments with sound interpretation." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Relies on superficial or limited evidence; accepts sources uncritically." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Inaccurate, fabricated, or missing evidence to support statements." }
        ]
      },
      {
        name: "Organization & Clarity",
        description: "Structural flow, paragraph transitions, grammar, and technical prose quality.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Flawless narrative flow, elegant transitions, and articulate prose." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Logical section sequencing, coherent paragraphs, and clear academic tone." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Choppy transitions, redundant phrasing, or frequent grammatical issues." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Disorganized, incoherent, or difficult to read." }
        ]
      },
      {
        name: "Sources & Rigor",
        description: "Proper citation formatting, academic integrity, and breadth of literature surveyed.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Exemplary bibliography adhering strictly to citation standards." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Consistent citations with minor formatting discrepancies." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Inconsistent citation style or incomplete bibliographic entries." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Missing attribution, improper quotations, or suspected plagiarism." }
        ]
      }
    ]
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "Suited for oral presentations, lightning talks, and project demos.",
    criteria: [
      {
        name: "Content Accuracy & Depth",
        description: "Mastery of the topic, factual accuracy, and appropriateness for the audience.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Demonstrates authoritative command of subject matter with nuanced insights." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Accurate coverage of key concepts appropriate for target audience level." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Basic understanding with notable omissions or minor technical errors." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Significant factual errors or superficial grasp of subject." }
        ]
      },
      {
        name: "Structure & Flow",
        description: "Introduction hook, narrative coherence, timing, and effective conclusion.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Captivating storyline, seamless transitions, and punctually paced." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Clear roadmap, well-organized flow, and fits within time budget." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Rushed timing, abrupt topic changes, or weak closing summary." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "No clear roadmap, severely over or under time limits." }
        ]
      },
      {
        name: "Delivery & Engagement",
        description: "Vocal projection, eye contact, pacing, enthusiasm, and audience rapport.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Dynamic speaker, engaging cadence, and confident audience interaction." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Audible, clear speech with good eye contact and poised delivery." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Monotone delivery, reads directly from slides, or excessive filler words." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Inaudible, disengaged, or unprepared to present." }
        ]
      },
      {
        name: "Visual Aids & Q&A",
        description: "Quality and legibility of slide decks, media, and poise answering questions.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Visually stunning, clean visuals; adept and insightful responses during Q&A." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Clear, legible slides that complement speech; handles questions effectively." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Cluttered slides with walls of text; hesitates or struggles with questions." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Distracting, illegible visual aids; unable to answer basic questions." }
        ]
      }
    ]
  },
  {
    id: "design-project",
    name: "Design Project",
    description: "Tailored for UI/UX projects, architectural designs, and product prototyping.",
    criteria: [
      {
        name: "Problem Framing & Research",
        description: "Understanding of target user needs, problem constraints, and contextual research.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Deeply empathic user research and lucid articulation of problem space." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Clear user personas, sound problem definition, and solid research baseline." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Generic user assumptions with limited primary user investigation." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Solution looking for a problem; no user research or problem context." }
        ]
      },
      {
        name: "Design Rationale & Concept",
        description: "Justification of visual hierarchy, interactions, affordances, and trade-offs.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Every decision backed by user data, design principles, and heuristic rigor." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Thoughtful rationale for layout, typography, and interaction patterns." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Arbitrary visual choices without clear justification of usability." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Contradictory design rationale; ignores fundamental usability heuristics." }
        ]
      },
      {
        name: "Craft & Execution",
        description: "Visual polish, typography, spacing, accessibility (contrast), and prototype fidelity.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Pixel-perfect craft, WCAG AAA accessibility, and delightful micro-interactions." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "High visual polish, consistent spacing, and standard WCAG AA contrast." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Inconsistent margins, alignment quirks, or accessibility contrast warnings." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "Unpolished prototype, illegible fonts, or broken navigation flows." }
        ]
      },
      {
        name: "Evaluation & Iteration",
        description: "Usability testing evidence, user feedback synthesis, and iterative refinements.",
        weight: null,
        levels: [
          { label: "Exemplary", score: 10, scoreRange: "9-10", description: "Rigorous usability testing cycles with documented pivot decisions." },
          { label: "Proficient", score: 8, scoreRange: "7-8", description: "Evidence of user testing and meaningful iterations made from feedback." },
          { label: "Developing", score: 6, scoreRange: "5-6", description: "Surface usability check with superficial tweaks; resists major feedback." },
          { label: "Needs Improvement", score: 2, scoreRange: "0-4", description: "No testing or iteration; first draft presented as finished design." }
        ]
      }
    ]
  }
];
