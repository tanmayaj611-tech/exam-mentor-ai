import { MathText } from "@/components/math-text";
import { ErrorBlock, LoadingBlock, PageTitle, SUBJECT_NAMES } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { generateQuiz, getProfile, listMistakes } from "@/lib/study.functions";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/revision")({
  head: () => ({
    meta: [
      { title: "Revision — Banking Exam Coach AI" },
      { name: "description", content: "Spaced revision on day 1, 2, 4, 7 and 14 for every topic you got wrong." },
      { property: "og:title", content: "Revision — Banking Exam Coach AI" },
      { property: "og:description", content: "Revise weak topics on a spaced schedule." },
    ],
  }),
  component: RevisionPage,
});

const STEPS = [
  { day: 1, label: "Learn again" },
  { day: 2, label: "Quick revision" },
  { day: 4, label: "Practice" },
  { day: 7, label: "Test" },
  { day: 14, label: "Final revision" },
] as const;

function daysSince(iso: string) {
  const start = new Date(iso);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
}

type Row = {
  key: string;
  subjectId: string;
  topic: string;
  wrong: number;
  oldest: string;
  stepLabel: string;
  dueToday: boolean;
  nextInDays: number | null;
  sample: string;
};

function RevisionPage() {
  const navigate = useNavigate();
  const mistakesFn = useServerFn(listMistakes);
  const profileFn = useServerFn(getProfile);
  const generate = useServerFn(generateQuiz);
  const mistakes = useQuery({ queryKey: ["mistakes"], queryFn: () => mistakesFn() });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const start = useMutation({
    mutationFn: (v: { subjectId: string; topic: string }) =>
      generate({ data: { subjectId: v.subjectId, topic: v.topic, difficulty: profile.data?.level ?? 1, count: 5, mode: "test" } }),
    onSuccess: (r) => navigate({ to: "/practice/$quizId", params: { quizId: r.quizId } }),
    onError: () => toast.error("Couldn't build the revision test right now. Please try again."),
  });

  if (mistakes.isPending) return <LoadingBlock />;
  if (mistakes.isError) return <ErrorBlock onRetry={() => mistakes.refetch()} />;

  const pending = mistakes.data.filter((m) => !m.revised);
  const grouped = new Map<string, Row>();
  for (const m of pending) {
    const subjectId = m.subject_id ?? "other";
    const key = `${subjectId}::${m.topic}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.wrong += 1;
      if (m.created_at < existing.oldest) existing.oldest = m.created_at;
      continue;
    }
    grouped.set(key, {
      key,
      subjectId,
      topic: m.topic,
      wrong: 1,
      oldest: m.created_at,
      stepLabel: "",
      dueToday: false,
      nextInDays: null,
      sample: m.question,
    });
  }

  const rows = [...grouped.values()]
    .map((row) => {
      const age = daysSince(row.oldest);
      const due = STEPS.find((s) => s.day === age) ?? null;
      const next = STEPS.find((s) => s.day > age) ?? null;
      return {
        ...row,
        stepLabel: due?.label ?? next?.label ?? "Keep practising",
        dueToday: due != null || age > 14,
        nextInDays: due ? 0 : next ? next.day - age : null,
      };
    })
    .sort((a, b) => Number(b.dueToday) - Number(a.dueToday) || b.wrong - a.wrong);

  const dueCount = rows.filter((r) => r.dueToday).length;

  return (
    <div className="space-y-4">
      <PageTitle
        title="Revision"
        subtitle={`Spaced plan: day 1 learn, day 2 quick revision, day 4 practice, day 7 test, day 14 final revision. ${dueCount} topic${dueCount === 1 ? "" : "s"} due today.`}
      />

      {rows.length === 0 ? (
        <div className="panel rounded-xl p-5">
          <p className="text-sm text-muted-foreground">
            Nothing to revise yet. Finish a practice set — anything you get wrong lands here on a revision schedule.
          </p>
          <Button className="mt-3" onClick={() => navigate({ to: "/practice" })}>Start a practice set</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.key} className="panel rounded-xl p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{SUBJECT_NAMES[row.subjectId] ?? row.subjectId}</span>
                <span>·</span>
                <span>{row.wrong} mistake{row.wrong === 1 ? "" : "s"}</span>
                <span>·</span>
                <span>first wrong {daysSince(row.oldest)} day(s) ago</span>
              </div>
              <h3 className="mt-1 font-display font-semibold">{row.topic}</h3>
              <p className="mt-1 text-sm">
                {row.dueToday ? (
                  <span className="font-medium text-primary">Due today — {row.stepLabel}</span>
                ) : (
                  <span className="text-muted-foreground">
                    Next step: {row.stepLabel}
                    {row.nextInDays != null ? ` in ${row.nextInDays} day(s)` : ""}
                  </span>
                )}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                <MathText>{row.sample}</MathText>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={start.isPending}
                  onClick={() => start.mutate({ subjectId: row.subjectId, topic: row.topic })}
                >
                  {start.isPending ? "Building test…" : "Test me on this topic"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate({ to: "/coach", search: { mode: "coach" } })}
                >
                  Learn it with the coach
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
