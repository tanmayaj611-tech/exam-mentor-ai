import { ErrorBlock, LoadingBlock, PageTitle, SUBJECT_NAMES } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { DIFFICULTY_LABELS } from "@/lib/coach-prompt";
import { getDashboard } from "@/lib/study.functions";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/study-plan")({
  head: () => ({
    meta: [
      { title: "Study Plan — Banking Exam Coach AI" },
      { name: "description", content: "A daily and weekly banking exam study plan built from your exam date and hours." },
      { property: "og:title", content: "Study Plan — Banking Exam Coach AI" },
      { property: "og:description", content: "Your daily study targets, revision and mock test schedule." },
    ],
  }),
  component: StudyPlanPage,
});

const SUBJECT_WEIGHTS: { id: string; share: number }[] = [
  { id: "quant", share: 0.3 },
  { id: "reasoning", share: 0.28 },
  { id: "english", share: 0.2 },
  { id: "banking", share: 0.12 },
  { id: "ga", share: 0.1 },
];

const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function fmtHours(hours: number) {
  const total = Math.round(hours * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

function StudyPlanPage() {
  const navigate = useNavigate();
  const fn = useServerFn(getDashboard);
  const q = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  if (q.isPending) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock onRetry={() => q.refetch()} />;

  const d = q.data;
  const dailyHours = d.profile?.daily_hours ?? 6;
  const examDate = d.profile?.exam_date ?? null;
  const daysLeft = examDate
    ? Math.max(0, Math.round((new Date(examDate).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000))
    : null;

  const weakSubjects = new Set(
    d.subjectAccuracy.filter((s) => s.attempted >= 3 && s.accuracy < 60).map((s) => s.subject),
  );

  // Weak subjects get a 1.4x slice, then everything is normalised back to the daily hours.
  const weighted = SUBJECT_WEIGHTS.map((s) => ({ ...s, weight: s.share * (weakSubjects.has(s.id) ? 1.4 : 1) }));
  const totalWeight = weighted.reduce((sum, s) => sum + s.weight, 0);
  const studyHours = dailyHours * 0.8; // 20% of the day goes to revision + a daily mini test
  const blocks = weighted.map((s) => ({
    id: s.id,
    hours: (s.weight / totalWeight) * studyHours,
    weak: weakSubjects.has(s.id),
  }));

  const weekly = WEEK.map((day, i) => {
    if (i === 6) return { day, focus: "Full mock test + full review of every mistake" };
    if (i === 5) return { day, focus: "Sectional tests: Quant + Reasoning, then revise the mistake book" };
    const order = ["quant", "reasoning", "english", "banking", "ga"];
    const lead = order[i % order.length] ?? "quant";
    const second = order[(i + 2) % order.length] ?? "reasoning";
    return {
      day,
      focus: `${SUBJECT_NAMES[lead] ?? lead} concepts + practice, ${SUBJECT_NAMES[second] ?? second} practice, current affairs 20m`,
    };
  });

  return (
    <div className="space-y-4">
      <PageTitle
        title="Study Plan"
        subtitle={`${d.profile?.target_exam ?? "IBPS PO"} · ${DIFFICULTY_LABELS[d.profile?.level ?? 1]} · ${fmtHours(dailyHours)} a day${
          daysLeft != null ? ` · ${daysLeft} day(s) to exam` : ""
        }`}
      />

      {examDate == null && (
        <div className="panel rounded-xl p-5">
          <p className="text-sm text-muted-foreground">
            Add your exam date and daily study hours in Settings and this plan will count down to exam day.
          </p>
          <Button className="mt-3" size="sm" onClick={() => navigate({ to: "/settings" })}>Open settings</Button>
        </div>
      )}

      <div className="panel rounded-xl p-5">
        <h2 className="font-display font-semibold">Today's targets</h2>
        <div className="mt-3 space-y-2">
          {blocks.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm">
              <span>
                {SUBJECT_NAMES[b.id] ?? b.id}
                {b.weak && <span className="ml-2 text-xs font-medium text-warning">weak — extra time</span>}
              </span>
              <span className="font-medium">{fmtHours(b.hours)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm">
            <span>Revision of pending mistakes ({d.pendingRevision})</span>
            <span className="font-medium">{fmtHours(dailyHours * 0.12)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm">
            <span>Daily mini test (10 questions)</span>
            <span className="font-medium">{fmtHours(dailyHours * 0.08)}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => navigate({ to: "/practice" })}>Start today's practice</Button>
          <Button size="sm" variant="outline" onClick={() => navigate({ to: "/revision" })}>Go to revision</Button>
        </div>
      </div>

      <div className="panel rounded-xl p-5">
        <h2 className="font-display font-semibold">Weekly rhythm</h2>
        <div className="mt-3 space-y-2 text-sm">
          {weekly.map((w) => (
            <div key={w.day} className="rounded-lg border px-4 py-2.5">
              <div className="font-medium">{w.day}</div>
              <div className="text-muted-foreground">{w.focus}</div>
            </div>
          ))}
        </div>
      </div>

      {d.weakTopics.length > 0 && (
        <div className="panel rounded-xl p-5">
          <h2 className="font-display font-semibold">Priority topics this week</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {d.weakTopics.map((t) => (
              <li key={t.topic}>
                {t.topic} — {t.wrong} mistake{t.wrong === 1 ? "" : "s"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        The plan adapts as your accuracy changes. Always confirm the exam date and pattern on the official IBPS website.
      </p>
    </div>
  );
}
