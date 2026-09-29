// Section patterns follow the published IBPS prelims structure (100 questions, 60 minutes,
// 1/4 negative marking). Generated mocks are scaled practice versions, never official papers.
export type MockPattern = {
  id: string;
  name: string;
  exam: string;
  officialNote: string;
  sections: { subjectId: string; name: string; officialQuestions: number; officialMinutes: number }[];
  negativeMarking: number;
};

export const MOCK_PATTERNS: MockPattern[] = [
  {
    id: "ibps-po-pre",
    name: "IBPS PO Prelims",
    exam: "IBPS PO",
    officialNote: "Official: English 30 Q / 20 min, Quant 35 Q / 20 min, Reasoning 35 Q / 20 min.",
    sections: [
      { subjectId: "english", name: "English Language", officialQuestions: 30, officialMinutes: 20 },
      { subjectId: "quant", name: "Quantitative Aptitude", officialQuestions: 35, officialMinutes: 20 },
      { subjectId: "reasoning", name: "Reasoning Ability", officialQuestions: 35, officialMinutes: 20 },
    ],
    negativeMarking: 0.25,
  },
  {
    id: "ibps-clerk-pre",
    name: "IBPS Clerk Prelims",
    exam: "IBPS Clerk",
    officialNote: "Official: English 30 Q, Numerical Ability 35 Q, Reasoning 35 Q — 20 min per section.",
    sections: [
      { subjectId: "english", name: "English Language", officialQuestions: 30, officialMinutes: 20 },
      { subjectId: "quant", name: "Numerical Ability", officialQuestions: 35, officialMinutes: 20 },
      { subjectId: "reasoning", name: "Reasoning Ability", officialQuestions: 35, officialMinutes: 20 },
    ],
    negativeMarking: 0.25,
  },
  {
    id: "ibps-rrb-po-pre",
    name: "IBPS RRB PO (Officer Scale I) Prelims",
    exam: "IBPS RRB PO",
    officialNote: "Official: Reasoning 40 Q, Quant 40 Q — 45 min composite time.",
    sections: [
      { subjectId: "reasoning", name: "Reasoning", officialQuestions: 40, officialMinutes: 22.5 },
      { subjectId: "quant", name: "Quantitative Aptitude", officialQuestions: 40, officialMinutes: 22.5 },
    ],
    negativeMarking: 0.25,
  },
  {
    id: "ibps-rrb-clerk-pre",
    name: "IBPS RRB Clerk (Office Assistant) Prelims",
    exam: "IBPS RRB Clerk",
    officialNote: "Official: Reasoning 40 Q, Numerical Ability 40 Q — 45 min composite time.",
    sections: [
      { subjectId: "reasoning", name: "Reasoning", officialQuestions: 40, officialMinutes: 22.5 },
      { subjectId: "quant", name: "Numerical Ability", officialQuestions: 40, officialMinutes: 22.5 },
    ],
    negativeMarking: 0.25,
  },
];

export const MOCK_SIZES = { mini: 10, half: 15 } as const;
