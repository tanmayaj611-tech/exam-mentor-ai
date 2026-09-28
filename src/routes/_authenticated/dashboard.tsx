import { ErrorBlock, LoadingBlock, PageTitle, SUBJECT_NAMES } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getDashboard } from "@/lib/study.functions";
import { DIFFICULTY_LABELS } from "@/lib/coach-prompt";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Flame, ListChecks, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Banking Exam Coach AI" },
      { name: "description", content: "Today's target, streak, accuracy and weak topics." },
      { property: "og:title", content: "Dashboard — Banking Exam Coach AI" },
      { property: "og:description", content: "Your daily banking exam study overview." },
    ],
  }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="panel rounded-xl p-4">
      <Icon className="size-4 text-primary" />
      <div className="font-display mt-2 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Dashboard() {
  const fetchDashboard = useServerFn(getDashboard);
  const q = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });
  if (q.isPending) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock onRetry={() => q.refetch()} />;
  const d = q.data;
  const targetMin = Math.round((d.profile?.daily_hours ?? 6) * 60);
  const pct = Math.min(100, Math.round((d.minutesToday / targetMin) * 100));
  const daysLeft = d.profile?.exam_date
    ? Math.ceil((new Date(d.profile.exam_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="space-y-5">
      <PageTitle
        title={`Hello${d.profile?.full_name ? `, ${d.profile.full_name}` : ""}`}
        subtitle={`${d.profile?.target_exam ?? "IBPS PO"} · ${DIFFICULTY_LABELS[d.profile?.level ?? 1]}${
          daysLeft != null && daysLeft >= 0 ? ` · ${daysLeft} days to exam` : ""
        }`}
      />
      <div className="panel rounded-xl p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Today's target</span>
          <span className="text-muted-foreground">
            {d.minutesToday} / {targetMin} min
          </span>
        </div>
        <Progress value={pct} className="mt-3" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/coach">Study now</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/practice">Practice set</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/revision">Revision</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/study-plan">Today's plan</Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Flame} label="Day streak" value={String(d.profile?.streak_days ?? 0)} />
        <Stat icon={Target} label="Accuracy" value={d.overallAccuracy != null ? `${d.overallAccuracy}%` : "—"} />
        <Stat icon={Clock} label="Questions attempted" value={String(d.questionsAttempted)} />
        <Stat icon={ListChecks} label="Pending revision" value={String(d.pendingRevision)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel rounded-xl p-5">
          <h2 className="font-display font-semibold">Weak topics</h2>
          {d.weakTopics.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No weak topics yet — take a practice set to find them.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {d.weakTopics.map((t) => (
                <li key={t.topic} className="flex justify-between text-sm">
                  <span>{t.topic}</span>
                  <span className="text-muted-foreground">{t.wrong} wrong</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel rounded-xl p-5">
          <h2 className="font-display font-semibold">Recent practice</h2>
          {d.recentQuizzes.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No practice sets submitted yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {d.recentQuizzes.map((r) => (
                <li key={r.id} className="flex justify-between text-sm">
                  <Link to="/practice/$quizId" params={{ quizId: r.id }} className="hover:underline">
                    {r.topic} <span className="text-muted-foreground">· {SUBJECT_NAMES[r.subject_id ?? "other"]}</span>
                  </Link>
                  <span className="font-medium">{Math.round(Number(r.accuracy ?? 0))}%</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Weekly mock: use a 10-question practice set in timed test mode every Sunday until full sectional mocks are added.
      </p>
    </div>
  );
}
