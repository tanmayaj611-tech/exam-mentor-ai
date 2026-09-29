import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { MOCK_PATTERNS, MOCK_SIZES } from "./mock-patterns";
import { generateQuestions } from "./question-gen.server";

export const createMock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ patternId: z.string(), size: z.enum(["mini", "half"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const pattern = MOCK_PATTERNS.find((p) => p.id === data.patternId);
    if (!pattern) throw new Error("Unknown mock pattern");
    const perSection = MOCK_SIZES[data.size];

    const { data: profile } = await supabase
      .from("profiles")
      .select("level, language")
      .eq("id", userId)
      .maybeSingle();
    const difficulty = Math.max(3, profile?.level ?? 3);

    const sections = await Promise.all(
      pattern.sections.map(async (s) => ({
        section: s,
        questions: await generateQuestions({
          count: perSection,
          topic: s.name,
          subjectId: s.subjectId,
          difficulty,
          targetExam: pattern.exam,
          language: profile?.language ?? "en",
          mixTopics: true,
        }),
      })),
    );

    // Time scaled from the official minutes-per-question for each section.
    const timeLimit = Math.round(
      pattern.sections.reduce((sum, s) => sum + (s.officialMinutes * 60 * perSection) / s.officialQuestions, 0),
    );
    const total = sections.reduce((n, s) => n + s.questions.length, 0);

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .insert({
        user_id: userId,
        subject_id: null,
        topic: `${pattern.name} — practice mock`,
        difficulty,
        mode: "test",
        kind: "mock",
        pattern: pattern.id,
        time_limit_seconds: timeLimit,
        negative_marking: pattern.negativeMarking,
        total_questions: total,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    let position = 0;
    const rows = sections.flatMap(({ section, questions }) =>
      questions.map((q) => ({
        quiz_id: quiz.id,
        user_id: userId,
        position: ++position,
        question: q.question,
        options: q.options,
        correct_option: q.correct_option,
        explanation: q.explanation,
        shortcut: q.shortcut ?? null,
        topic: q.topic ?? section.name,
        difficulty,
        section: section.subjectId,
      })),
    );
    const { error: qError } = await supabase.from("quiz_questions").insert(rows);
    if (qError) throw new Error(qError.message);
    return { quizId: quiz.id as string };
  });

export const listMocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quizzes")
      .select("id, topic, pattern, status, correct_count, incorrect_count, total_questions, accuracy, negative_marking, created_at")
      .eq("user_id", context.userId)
      .eq("kind", "mock")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
