import { MathBlock, MathText } from "@/components/math-text";
import { ErrorBlock, LoadingBlock, SUBJECT_NAMES } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getQuiz, submitQuiz } from "@/lib/study.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/practice/$quizId")({
  head: () => ({
    meta: [
      { title: "Practice set — Banking Exam Coach AI" },
      { name: "description", content: "Answer questions and see step-by-step explanations." },
      { property: "og:title", content: "Practice set — Banking Exam Coach AI" },
      { property: "og:description", content: "Exam-style practice with answer checking." },
    ],
  }),
  component: QuizPage,
});

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function QuizPage() {
  const { quizId } = Route.useParams();
  const qc = useQueryClient();
  const fetchQuiz = useServerFn(getQuiz);
  const submit = useServerFn(submitQuiz);
  const q = useQuery({ queryKey: ["quiz", quizId], queryFn: () => fetchQuiz({ data: { quizId } }) });
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef(Date.now());
  const submitted = q.data?.quiz.status === "submitted";
  const isMock = q.data?.quiz.kind === "mock";
  const limit = q.data?.quiz.time_limit_seconds ?? null;
  const autoSubmitted = useRef(false);
  const [section, setSection] = useState<string | null>(null);

  useEffect(() => {
    // Mock timers run from creation time so reloading the page doesn't reset the clock.
    if (isMock && q.data) startRef.current = Date.parse(q.data.quiz.created_at);
  }, [isMock, q.data]);

  useEffect(() => {
    if (submitted || !q.data) return;
    const id = setInterval(() => setSeconds(Math.round((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [submitted, q.data]);

  const m = useMutation({
    mutationFn: () =>
      submit({
        data: {
          quizId,
          timeTakenSeconds: limit ? Math.min(seconds, limit) : seconds,
          answers: (q.data?.questions ?? []).map((x) => ({ questionId: x.id, answer: answers[x.id] ?? null })),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quiz", quizId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["mistakes"] });
      qc.invalidateQueries({ queryKey: ["mocks"] });
    },
    onError: () => toast.error("Submission failed. Your answers are still here — please try again."),
  });

  const remaining = limit ? limit - seconds : null;
  useEffect(() => {
    if (remaining != null && remaining <= 0 && !submitted && !autoSubmitted.current && !m.isPending) {
      autoSubmitted.current = true;
      toast.info("Time is up — submitting your mock.");
      m.mutate();
    }
  }, [remaining, submitted, m]);

  if (q.isPending) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock onRetry={() => q.refetch()} />;
  const { quiz, questions } = q.data;

  if (submitted) {
    const total = quiz.total_questions ?? questions.length;
    return (
      <div className="space-y-4">
        <div className="panel rounded-xl p-5">
          <h1 className="font-display text-xl font-bold">{quiz.topic} — result</h1>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
            <Metric label="Questions" value={total} />
            <Metric label="Correct" value={quiz.correct_count ?? 0} />
            <Metric label="Incorrect" value={quiz.incorrect_count ?? 0} />
            <Metric label="Unattempted" value={quiz.unattempted_count ?? 0} />
            <Metric label="Accuracy" value={`${Math.round(Number(quiz.accuracy ?? 0))}%`} />
          </div>
          {isMock && <MockAnalysis questions={questions} negative={Number(quiz.negative_marking ?? 0)} />}
          <p className="mt-3 text-xs text-muted-foreground">
            Score: {quiz.correct_count ?? 0}/{total} · Time {fmt(quiz.time_taken_seconds ?? 0)}. Wrong answers were added to your Mistake Book.
          </p>
          <div className="mt-4 flex gap-2">
            <Button asChild>{isMock ? <Link to="/mock-tests">New mock</Link> : <Link to="/practice">New set</Link>}</Button>
            <Button asChild variant="outline"><Link to="/mistakes">Mistake Book</Link></Button>
          </div>
        </div>
        {questions.map((x) => (
          <div key={x.id} className="panel rounded-xl p-5">
            <div className="flex items-start gap-2">
              {x.is_correct ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
              ) : (
                <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
              )}
              <p className="font-medium">Q{x.position}. <MathText>{x.question}</MathText></p>
            </div>
            <p className="mt-2 text-sm">
              Your answer: <b>{x.student_answer != null ? <MathText>{x.options[x.student_answer]}</MathText> : "Not attempted"}</b> · Correct:{" "}
              <b>{x.correct_option != null ? <MathText>{x.options[x.correct_option]}</MathText> : "—"}</b>
            </p>
            <MathBlock className="mt-2 text-sm text-muted-foreground">{x.explanation}</MathBlock>
            {x.shortcut && <p className="mt-2 text-sm"><b>Shortcut:</b> <MathText>{x.shortcut}</MathText></p>}
          </div>
        ))}
      </div>
    );
  }

  const x = questions[current];
  if (!x) return <ErrorBlock message="This set has no questions." />;
  const sections = [...new Set(questions.map((qq) => qq.section).filter(Boolean))] as string[];
  const activeSection = section ?? x.section ?? null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold">{quiz.topic}</h1>
        <span className={cn("rounded-md bg-muted px-2 py-1 font-mono text-sm", remaining != null && remaining < 120 && "bg-destructive text-destructive-foreground")}>
          {remaining != null ? `${fmt(Math.max(0, remaining))} left` : fmt(seconds)}
        </span>
      </div>
      {sections.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {sections.map((sec) => (
            <Button
              key={sec}
              size="sm"
              variant={activeSection === sec ? "default" : "outline"}
              onClick={() => {
                setSection(sec);
                setCurrent(questions.findIndex((qq) => qq.section === sec));
              }}
            >
              {SUBJECT_NAMES[sec] ?? sec}
            </Button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {questions.map((qq, i) => (activeSection && sections.length > 1 && qq.section !== activeSection) ? null : (
          <button
            key={qq.id}
            onClick={() => { setCurrent(i); setSection(qq.section ?? null); }}
            className={cn(
              "size-8 rounded-md border text-xs font-medium",
              i === current && "ring-2 ring-primary",
              answers[qq.id] != null && "bg-primary text-primary-foreground",
              marked.has(qq.id) && "border-warning border-2",
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="panel rounded-xl p-5">
        <p className="font-medium">Q{x.position}. <MathText>{x.question}</MathText></p>
        <div className="mt-4 space-y-2">
          {x.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => setAnswers({ ...answers, [x.id]: answers[x.id] === i ? null : i })}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors hover:bg-muted",
                answers[x.id] === i && "border-primary bg-primary/10",
              )}
            >
              <span className="mr-2 font-semibold">{String.fromCharCode(65 + i)}.</span>
              <MathText>{opt}</MathText>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={current === 0} onClick={() => { setCurrent(current - 1); setSection(questions[current - 1]?.section ?? null); }}>Previous</Button>
        <Button
          variant="outline"
          onClick={() => {
            const next = new Set(marked);
            if (next.has(x.id)) next.delete(x.id);
            else next.add(x.id);
            setMarked(next);
          }}
        >
          <Bookmark /> {marked.has(x.id) ? "Unmark" : "Mark for review"}
        </Button>
        {current < questions.length - 1 && <Button onClick={() => { setCurrent(current + 1); setSection(questions[current + 1]?.section ?? null); }}>Next</Button>}
        {(current === questions.length - 1 || isMock) && (
          <Button
            variant={current === questions.length - 1 ? "default" : "secondary"}
            disabled={m.isPending}
            onClick={() => {
              if (isMock && !window.confirm("Submit the whole mock now?")) return;
              m.mutate();
            }}
          >
            {m.isPending ? "Checking…" : "Submit"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="font-display text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

type ResultQ = { section?: string | null; topic?: string | null; is_correct: boolean | null; student_answer: number | null };

function MockAnalysis({ questions, negative }: { questions: ResultQ[]; negative: number }) {
  const bySection = new Map<string, { c: number; w: number; u: number }>();
  const weak = new Map<string, number>();
  for (const q of questions) {
    const key = q.section ?? "other";
    const s = bySection.get(key) ?? { c: 0, w: 0, u: 0 };
    if (q.student_answer == null) s.u += 1;
    else if (q.is_correct) s.c += 1;
    else {
      s.w += 1;
      if (q.topic) weak.set(q.topic, (weak.get(q.topic) ?? 0) + 1);
    }
    bySection.set(key, s);
  }
  let total = 0;
  const rows = [...bySection.entries()].map(([k, s]) => {
    const score = s.c - s.w * negative;
    total += score;
    const att = s.c + s.w;
    return { k, ...s, score, acc: att ? Math.round((s.c / att) * 100) : 0 };
  });
  const weakTopics = [...weak.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <div className="mt-4 space-y-3">
      <p className="font-display text-lg font-bold">
        Net score: {total.toFixed(2)} / {questions.length}{" "}
        <span className="text-xs font-normal text-muted-foreground">(−{negative} per wrong answer)</span>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="py-1">Section</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Accuracy</th><th>Score</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.k} className="border-t border-border">
                <td className="py-1.5">{SUBJECT_NAMES[r.k] ?? r.k}</td>
                <td>{r.c}</td><td>{r.w}</td><td>{r.u}</td><td>{r.acc}%</td><td>{r.score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {weakTopics.length > 0 && (
        <p className="text-sm">
          <b>Weak topics to revise:</b> {weakTopics.map(([t, n]) => `${t} (${n})`).join(", ")}
        </p>
      )}
    </div>
  );
}
