import { ErrorBlock, LoadingBlock } from "@/components/page-states";
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

  useEffect(() => {
    if (submitted) return;
    const id = setInterval(() => setSeconds(Math.round((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [submitted]);

  const m = useMutation({
    mutationFn: () =>
      submit({
        data: {
          quizId,
          timeTakenSeconds: seconds,
          answers: (q.data?.questions ?? []).map((x) => ({ questionId: x.id, answer: answers[x.id] ?? null })),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quiz", quizId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["mistakes"] });
    },
    onError: () => toast.error("Submission failed. Your answers are still here — please try again."),
  });

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
          <p className="mt-3 text-xs text-muted-foreground">
            Score: {quiz.correct_count ?? 0}/{total} · Time {fmt(quiz.time_taken_seconds ?? 0)}. Wrong answers were added to your Mistake Book.
          </p>
          <div className="mt-4 flex gap-2">
            <Button asChild><Link to="/practice">New set</Link></Button>
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
              <p className="font-medium">Q{x.position}. {x.question}</p>
            </div>
            <p className="mt-2 text-sm">
              Your answer: <b>{x.student_answer != null ? x.options[x.student_answer] : "Not attempted"}</b> · Correct:{" "}
              <b>{x.correct_option != null ? x.options[x.correct_option] : "—"}</b>
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{x.explanation}</p>
            {x.shortcut && <p className="mt-2 text-sm"><b>Shortcut:</b> {x.shortcut}</p>}
          </div>
        ))}
      </div>
    );
  }

  const x = questions[current];
  if (!x) return <ErrorBlock message="This set has no questions." />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-semibold">{quiz.topic}</h1>
        <span className="rounded-md bg-muted px-2 py-1 font-mono text-sm">{fmt(seconds)}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((qq, i) => (
          <button
            key={qq.id}
            onClick={() => setCurrent(i)}
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
        <p className="font-medium">Q{x.position}. {x.question}</p>
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
              {opt}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Previous</Button>
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
        {current < questions.length - 1 ? (
          <Button onClick={() => setCurrent(current + 1)}>Next</Button>
        ) : (
          <Button disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? "Checking…" : "Submit"}</Button>
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
