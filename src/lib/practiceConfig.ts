// Practice catalogue. We start with Product Manager only; adding a role means
// adding an entry to PRACTICE_ROLES with engine interview types that the
// interview engine already supports (see asparagus create-interview type map).

export type EngineLevel = 'junior' | 'mid' | 'senior';

export interface PracticeInterviewType {
  /** Engine interview_type — must match a rubric in interview-engine/interview_config.py */
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Example prompts shown on the setup screen so candidates know what to expect */
  sampleQuestions: string[];
  /** Mirrors the engine rubric (mid level) so we can preview what gets scored */
  rubric: { label: string; weight: number }[];
}

export interface PracticeLevel {
  id: EngineLevel;
  name: string;
  years: string;
}

export interface PracticeRole {
  id: string;
  title: string;
  interviewTypes: PracticeInterviewType[];
  levels: PracticeLevel[];
}

export const PRODUCT_MANAGER: PracticeRole = {
  id: 'product_manager',
  title: 'Product Manager',
  levels: [
    { id: 'junior', name: 'Associate PM', years: '0–2 yrs' },
    { id: 'mid', name: 'Product Manager', years: '2–5 yrs' },
    { id: 'senior', name: 'Senior PM', years: '5+ yrs' },
  ],
  interviewTypes: [
    {
      id: 'product_sense',
      name: 'Product Sense',
      tagline: 'Design & improve products',
      description: 'Frame a fuzzy problem, pick a user segment, prioritise pain points, and land on a solution with clear success metrics.',
      sampleQuestions: [
        'Design a product to help first-time home buyers.',
        'How would you improve Google Maps for commuters?',
      ],
      rubric: [
        { label: 'Problem Framing', weight: 0.2 },
        { label: 'User Empathy', weight: 0.2 },
        { label: 'Prioritisation', weight: 0.2 },
        { label: 'Solution Quality', weight: 0.25 },
        { label: 'Success Metrics', weight: 0.15 },
      ],
    },
    {
      id: 'execution',
      name: 'Execution',
      tagline: 'Ship, trade off, lead',
      description: 'Plan a launch, make trade-offs under constraints, and lead engineering, design and go-to-market partners.',
      sampleQuestions: [
        'Your launch is slipping by three weeks. Walk me through what you do.',
        'Engineering wants to cut scope — how do you decide what goes?',
      ],
      rubric: [
        { label: 'Planning & Rigour', weight: 0.2 },
        { label: 'Trade-off Reasoning', weight: 0.25 },
        { label: 'Cross-functional Leadership', weight: 0.25 },
        { label: 'Technical Depth', weight: 0.15 },
        { label: 'Launch & GTM Thinking', weight: 0.15 },
      ],
    },
    {
      id: 'analytical',
      name: 'Analytical & Metrics',
      tagline: 'Metrics, diagnosis, experiments',
      description: 'Define the right metrics, diagnose a sudden drop, form hypotheses, and design experiments to test them.',
      sampleQuestions: [
        'Daily active users dropped 10% overnight. How do you investigate?',
        'What is the north-star metric for a food delivery app?',
      ],
      rubric: [
        { label: 'Structured Approach', weight: 0.25 },
        { label: 'Metric Definition Quality', weight: 0.25 },
        { label: 'Hypothesis-Driven Thinking', weight: 0.2 },
        { label: 'Data Intuition', weight: 0.15 },
        { label: 'Experimentation Literacy', weight: 0.15 },
      ],
    },
    {
      id: 'behavioural',
      name: 'Behavioural',
      tagline: 'Leadership & ownership stories',
      description: 'Tell structured stories about ownership, conflict, failure and impact — the "tell me about a time" round.',
      sampleQuestions: [
        'Tell me about a time you disagreed with your engineering lead.',
        'Describe a product decision you got wrong. What did you learn?',
      ],
      rubric: [
        { label: 'Situation Clarity', weight: 0.15 },
        { label: 'Ownership & Initiative', weight: 0.25 },
        { label: 'Impact & Outcome', weight: 0.25 },
        { label: 'Self-Awareness & Reflection', weight: 0.2 },
        { label: 'Communication Clarity', weight: 0.15 },
      ],
    },
  ],
};

export const PRACTICE_ROLES: PracticeRole[] = [PRODUCT_MANAGER];

export function findRole(roleId: string): PracticeRole | undefined {
  return PRACTICE_ROLES.find(r => r.id === roleId);
}

export function findInterviewType(role: PracticeRole, typeId: string): PracticeInterviewType | undefined {
  return role.interviewTypes.find(t => t.id === typeId);
}

export function findLevel(role: PracticeRole, levelId: string): PracticeLevel | undefined {
  return role.levels.find(l => l.id === levelId);
}

/**
 * The engine tailors questions from job_description. Practice sessions have no
 * real job posting, so we synthesise a representative one for the chosen level
 * (and target company, if the candidate gave one).
 */
export function buildJobDescription(role: PracticeRole, level: PracticeLevel, targetCompany?: string | null): string {
  const company = targetCompany?.trim();
  const atCompany = company ? ` at ${company}` : '';
  const scope: Record<EngineLevel, string> = {
    junior: 'Own a well-defined feature area under the guidance of a senior PM. Write clear specs, partner closely with design and engineering, and learn to make data-informed decisions.',
    mid: 'Own a product area end to end: discover user problems, set strategy and roadmap, define success metrics, and lead a cross-functional team from idea through launch and iteration.',
    senior: 'Own a multi-team product surface. Set multi-quarter strategy, make hard prioritisation calls with incomplete data, influence senior stakeholders, and mentor other PMs.',
  };
  return [
    `${level.name}${atCompany}.`,
    scope[level.id],
    'Key skills: product sense and user empathy, prioritisation, metrics and experimentation, execution and trade-off reasoning, cross-functional leadership, and crisp communication.',
    company ? `Where natural, ground scenarios in ${company}'s products, users and market.` : '',
  ].filter(Boolean).join('\n\n');
}

/** Passed to the engine as interview_guidelines — adjusts Jane's tone for practice. */
export const PRACTICE_GUIDELINES = [
  'This is a PRACTICE (mock) interview. The candidate is preparing for real Product Manager interviews and will receive the evaluation as personal coaching feedback.',
  'Run it like a realistic interview at the chosen level: same rigour, same follow-ups, same depth. Do not give hints or feedback mid-interview.',
  'Keep a warm, encouraging tone. If the candidate asks to end early, close gracefully.',
].join(' ');
