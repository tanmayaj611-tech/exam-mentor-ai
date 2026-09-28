import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { generateQuestions } from "./question-gen.server";

/* ------------------------------------------------------------------ profile */

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data;
    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert({ id: userId })
      .select("*")
      .single();
    if (insertError) throw new Error(insertError.message);
    return created;
  });

const ProfileUpdate = z.object({
  full_name: z.string().max(120).nullish(),
  target_exam: z.string().max(60).optional(),
  exam_date: z.string().nullish(),
  level: z.number().int().min(1).max(5).optional(),
  language: z.enum(["en", "mr"]).optional(),
  daily_hours: z.number().min(0.5).max(16).optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileUpdate.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch = Object.fromEntries(Object.entries({ ...data, exam_date: data.exam_date || null }).filter(([, v]) => v !== undefined));
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(patch as never)
      .eq("id", userId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

/* ------------------------------------------------------------------- topics */

export const listSubjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: subjects, error: se }, { data: topics, error: te }] = await Promise.all([
      context.supabase.from("subjects").select("*").order("sort_order"),
      context.supabase.from("topics").select("*").order("sort_order"),
    ]);
    if (se) throw new Error(se.message);
    if (te) throw new Error(te.message);
    return (subjects ?? []).map((s) => ({
      ...s,
      topics: (topics ?? []).filter((t) => t.subject_id === s.id),
    }));
  });

/* ------------------------------------------------------- chat conversations */

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("chat_threads")
      .select("id, title, updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ title: z.string().max(120).optional(), mode: z.enum(["coach", "speaking"]).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { data: thread, error } = await context.supabase
      .from("chat_threads")
      .insert({
        user_id: context.userId,
        title: data.title ?? (data.mode === "speaking" ? "Speaking practice" : "New conversation"),
      })
      .select("id, title, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return thread;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ threadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("chat_threads")
      .delete()
      .eq("id", data.threadId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ threadId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: thread, error: threadError } = await context.supabase
      .from("chat_threads")
      .select("id, title")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (threadError) throw new Error(threadError.message);
    if (!thread) throw new Error("Conversation not found");

    const { data: rows, error } = await context.supabase
      .from("chat_messages")
      .select("id, role, parts, created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    return {
      thread,
      messages: (rows ?? []).map((row) => ({
        id: row.id,
        role: row.role as "user" | "assistant",
        parts: (Array.isArray(row.parts) ? row.parts : []) as { type: string; text?: string }[],
      })),
    };
  });

/* ------------------------------------------------------------------- quizzes */

const GenerateQuiz = z.object({
  subjectId: z.string().min(1),
  topic: z.string().min(1).max(120),
  difficulty: z.number().int().min(1).max(5),
  count: z.number().int().min(3).max(10),
  mode: z.enum(["practice", "test"]).default("practice"),
});

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => GenerateQuiz.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("target_exam, language")
      .eq("id", userId)
      .maybeSingle();

    const questions = await generateQuestions({
      count: data.count,
      topic: data.topic,
      subjectId: data.subjectId,
      difficulty: data.difficulty,
      targetExam: profile?.target_exam ?? "IBPS PO",
      language: profile?.language ?? "en",
    });

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        user_id: userId,
        subject_id: data.subjectId,
        topic: data.topic,
        difficulty: data.difficulty,
        mode: data.mode,
        total_questions: questions.length,
      })
      .select("id")
      .single();
    if (quizError) throw new Error(quizError.message);

    const { error: insertError } = await supabase.from("quiz_questions").insert(
      questions.map((q, index) => ({
        quiz_id: quiz.id,
        user_id: userId,
        position: index + 1,
        question: q.question,
        options: q.options,
        correct_option: q.correct_option,
        explanation: q.explanation,
        shortcut: q.shortcut ?? null,
        topic: data.topic,
        difficulty: data.difficulty,
      })),
    );
    if (insertError) throw new Error(insertError.message);

    return { quizId: quiz.id as string };
  });

export const getQuiz = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ quizId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", data.quizId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!quiz) throw new Error("Practice set not found");

    const { data: rows, error: qError } = await supabase
      .from("quiz_questions")
      .select("id, position, question, options, difficulty, topic, student_answer, is_correct, correct_option, explanation, shortcut")
      .eq("quiz_id", data.quizId)
      .order("position");
    if (qError) throw new Error(qError.message);

    const submitted = quiz.status === "submitted";
    return {
      quiz,
      questions: (rows ?? []).map((row) => ({
        id: row.id,
        position: row.position,
        question: row.question,
        options: (Array.isArray(row.options) ? row.options : []) as string[],
        difficulty: row.difficulty,
        topic: row.topic,
        student_answer: row.student_answer,
        // Answers stay hidden until the set is submitted.
        is_correct: submitted ? row.is_correct : null,
        correct_option: submitted ? row.correct_option : null,
        explanation: submitted ? row.explanation : null,
        shortcut: submitted ? row.shortcut : null,
      })),
    };
  });

const SubmitQuiz = z.object({
  quizId: z.string().uuid(),
  timeTakenSeconds: z.number().int().min(0).max(60 * 60 * 6),
  answers: z.array(z.object({ questionId: z.string().uuid(), answer: z.number().int().min(0).max(4).nullable() })),
});

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitQuiz.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: quiz, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", data.quizId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!quiz) throw new Error("Practice set not found");
    // Prevent duplicate submissions.
    if (quiz.status === "submitted") return { alreadySubmitted: true, quizId: quiz.id as string };

    const { data: rows, error: qError } = await supabase
      .from("quiz_questions")
      .select("id, position, question, options, correct_option, explanation, topic")
      .eq("quiz_id", data.quizId)
      .order("position");
    if (qError) throw new Error(qError.message);

    const answerMap = new Map(data.answers.map((a) => [a.questionId, a.answer]));
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    const mistakeRows: Record<string, unknown>[] = [];

    for (const row of rows ?? []) {
      const given = answerMap.get(row.id) ?? null;
      const isCorrect = given != null && given === row.correct_option;
      if (given == null) unattempted += 1;
      else if (isCorrect) correct += 1;
      else incorrect += 1;

      const { error: updateError } = await supabase
        .from("quiz_questions")
        .update({ student_answer: given, is_correct: given == null ? null : isCorrect })
        .eq("id", row.id)
        .eq("user_id", userId);
      if (updateError) throw new Error(updateError.message);

      if (given != null && !isCorrect) {
        const options = (Array.isArray(row.options) ? row.options : []) as string[];
        mistakeRows.push({
          user_id: userId,
          subject_id: quiz.subject_id,
          topic: row.topic ?? quiz.topic,
          question: row.question,
          student_answer: options[given] ?? String(given),
          correct_answer: options[row.correct_option] ?? String(row.correct_option),
          error_type: "concept",
          explanation: row.explanation,
        });
      }
    }

    const attempted = correct + incorrect;
    const accuracy = attempted > 0 ? Math.round((correct / attempted) * 10000) / 100 : 0;

    if (mistakeRows.length > 0) {
      const { error: mistakeError } = await supabase.from("mistakes").insert(mistakeRows as never);
      if (mistakeError) throw new Error(mistakeError.message);
    }

    const { error: quizUpdateError } = await supabase
      .from("quizzes")
      .update({
        status: "submitted",
        correct_count: correct,
        incorrect_count: incorrect,
        unattempted_count: unattempted,
        accuracy,
        time_taken_seconds: data.timeTakenSeconds,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", quiz.id)
      .eq("user_id", userId);
    if (quizUpdateError) throw new Error(quizUpdateError.message);

    await supabase.from("study_sessions").insert({
      user_id: userId,
      subject_id: quiz.subject_id,
      topic: quiz.topic,
      minutes: Math.max(1, Math.round(data.timeTakenSeconds / 60)),
    });

    // Adaptive difficulty: based on real performance, never on completion.
    const { data: profile } = await supabase
      .from("profiles")
      .select("level, streak_days, last_active_date")
      .eq("id", userId)
      .maybeSingle();

    let newLevel = profile?.level ?? 1;
    if (attempted >= 3 && accuracy >= 80 && newLevel < 5) newLevel += 1;
    else if (attempted >= 3 && accuracy < 45 && newLevel > 1) newLevel -= 1;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let streak = profile?.streak_days ?? 0;
    if (profile?.last_active_date === today) {
      // same day, keep streak
    } else if (profile?.last_active_date === yesterday) streak += 1;
    else streak = 1;

    await supabase
      .from("profiles")
      .update({ level: newLevel, streak_days: streak, last_active_date: today })
      .eq("id", userId);

    return {
      alreadySubmitted: false,
      quizId: quiz.id as string,
      correct,
      incorrect,
      unattempted,
      accuracy,
      level: newLevel,
    };
  });

/* ------------------------------------------------------------- mistake book */

export const listMistakes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("mistakes")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const setMistakeState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        mistakeId: z.string().uuid(),
        revised: z.boolean().optional(),
        errorType: z
          .enum(["concept", "calculation", "reading", "formula", "guessing", "time-pressure", "silly"])
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {};
    if (data.revised != null) patch["revised"] = data.revised;
    if (data.errorType) patch["error_type"] = data.errorType;
    const { error } = await context.supabase
      .from("mistakes")
      .update(patch as never)
      .eq("id", data.mistakeId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ----------------------------------------------------------------- progress */

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const [profileRes, quizRes, mistakeRes, sessionRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("quizzes")
        .select("id, topic, subject_id, difficulty, accuracy, correct_count, incorrect_count, total_questions, status, submitted_at")
        .eq("user_id", userId)
        .eq("status", "submitted")
        .order("submitted_at", { ascending: false })
        .limit(50),
      supabase.from("mistakes").select("topic, subject_id, revised, revise_on").eq("user_id", userId).limit(500),
      supabase.from("study_sessions").select("minutes, session_date").eq("user_id", userId).limit(500),
    ]);

    const quizzes = quizRes.data ?? [];
    const mistakes = mistakeRes.data ?? [];
    const sessions = sessionRes.data ?? [];

    const attempted = quizzes.reduce((sum, q) => sum + (q.correct_count ?? 0) + (q.incorrect_count ?? 0), 0);
    const correct = quizzes.reduce((sum, q) => sum + (q.correct_count ?? 0), 0);
    const overallAccuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null;

    const topicStats = new Map<string, { topic: string; wrong: number }>();
    for (const mistake of mistakes) {
      const entry = topicStats.get(mistake.topic) ?? { topic: mistake.topic, wrong: 0 };
      entry.wrong += 1;
      topicStats.set(mistake.topic, entry);
    }
    const weakTopics = [...topicStats.values()].sort((a, b) => b.wrong - a.wrong).slice(0, 5);

    const minutesToday = sessions
      .filter((s) => s.session_date === today)
      .reduce((sum, s) => sum + (s.minutes ?? 0), 0);

    const subjectAccuracy = new Map<string, { subject: string; correct: number; attempted: number }>();
    for (const quiz of quizzes) {
      const key = quiz.subject_id ?? "other";
      const entry = subjectAccuracy.get(key) ?? { subject: key, correct: 0, attempted: 0 };
      entry.correct += quiz.correct_count ?? 0;
      entry.attempted += (quiz.correct_count ?? 0) + (quiz.incorrect_count ?? 0);
      subjectAccuracy.set(key, entry);
    }

    return {
      profile: profileRes.data,
      minutesToday,
      overallAccuracy,
      questionsAttempted: attempted,
      quizzesCompleted: quizzes.length,
      pendingRevision: mistakes.filter((m) => !m.revised).length,
      weakTopics,
      recentQuizzes: quizzes.slice(0, 6),
      subjectAccuracy: [...subjectAccuracy.values()].map((entry) => ({
        subject: entry.subject,
        accuracy: entry.attempted > 0 ? Math.round((entry.correct / entry.attempted) * 100) : 0,
        attempted: entry.attempted,
      })),
    };
  });
