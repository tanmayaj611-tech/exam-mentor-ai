import { z } from "zod";

import {
  COACH_MODEL,
  COACH_PROVIDER_OPTIONS,
  createLovableAiGatewayRunIdFetch,
  createLovableResponsesProvider,
} from "./ai-gateway.server";
import { DIFFICULTY_LABELS } from "./coach-prompt";

export type GeneratedQuestion = {
  question: string;
  options: string[];
  correct_option: number;
  explanation: string;
  shortcut?: string | null | undefined;
  topic?: string | null | undefined;
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = (fenced?.[1] ?? text).trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The coach returned an unexpected format.");
  return JSON.parse(raw.slice(start, end + 1));
}

const GeneratedPayload = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(3),
        options: z.array(z.string().min(1)).length(4),
        correct_option: z.number().int().min(0).max(3),
        explanation: z.string().min(3),
        shortcut: z.string().nullish(),
        topic: z.string().nullish(),
      }),
    )
    .min(1),
});

export async function generateQuestions(params: {
  count: number;
  topic: string;
  subjectId: string;
  difficulty: number;
  targetExam: string;
  language: string;
  mixTopics?: boolean;
}): Promise<GeneratedQuestion[]> {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = await createLovableResponsesProvider(runIdFetch);
  const { streamText } = await import("ai");

  const prompt = [
    `Create ${params.count} exam-style multiple-choice practice questions for the Indian banking exam "${params.targetExam}".`,
    params.mixTopics
      ? `Section: ${params.topic}. Mix the topics the way the real exam section does (e.g. puzzles, inequality, syllogism for Reasoning; simplification, DI, arithmetic for Quant; RC, cloze, error spotting, fillers for English). Put the specific topic name in "topic".`
      : `Topic: ${params.topic}. Subject area: ${params.subjectId}.`,
    `Difficulty: ${DIFFICULTY_LABELS[params.difficulty]}.`,
    params.language === "mr"
      ? "Write the explanation in simple Marathi but keep the question, options, formulas and technical terms in English."
      : "Write everything in simple English.",
    "Every question must have exactly 4 options and exactly one correct option.",
    "For numerical questions, solve them fully yourself and verify the arithmetic before you output them; the correct option must match your verified answer.",
    "Explanations must be step-by-step and beginner friendly. Add a 'shortcut' only when a genuine exam shortcut exists.",
    "MATHS FORMATTING (strict): write every formula, fraction, power, root, ratio and equation in LaTeX — inline maths inside $...$ and a whole step on its own line inside $$...$$.",
    'Examples: "Simplify $\\\\frac{3}{4} + \\\\frac{5}{6}$", options like "$\\\\frac{19}{12}$", steps like "$$SI = \\\\frac{P \\\\times R \\\\times T}{100}$$".',
    "Never write bare ^, /, sqrt() or underscores for maths outside LaTeX. Escape backslashes correctly so the JSON stays valid.",
    "Do not claim any question is a previous-year question.",
    'Respond with JSON only, in this exact shape: {"questions":[{"question":"...","options":["a","b","c","d"],"correct_option":0,"explanation":"...","shortcut":"...","topic":"..."}]}',
  ].join("\n");

  const result = streamText({
    model: provider.responses(COACH_MODEL),
    prompt,
    providerOptions: COACH_PROVIDER_OPTIONS as never,
  });
  const text = await result.text;
  const parsed = GeneratedPayload.parse(extractJson(text));
  const questions = parsed.questions.slice(0, params.count);
  if (questions.length === 0) throw new Error("No questions could be generated. Please try again.");
  return questions;
}
