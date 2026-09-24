import { ErrorBlock, LoadingBlock, PageTitle, SUBJECT_NAMES } from "@/components/page-states";
import { Progress } from "@/components/ui/progress";
import { DIFFICULTY_LABELS } from "@/lib/coach-prompt";
import { getDashboard } from "@/lib/study.functions";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Banking Exam Coach AI" },
      { name: "description", content: "Accuracy by subject, level and practice history." },
      { property: "og:title", content: "Progress — Banking Exam Coach AI" },
      { property: "og:description", content: "Track your banking exam progress." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const fn = useServerFn(getDashboard);
  const q = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });
  if (q.isPending) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock onRetry={() => q.refetch()} />;
  const d = q.data;
  return (
    <div className="space-y-4">
      <PageTitle
        title="Progress"
        subtitle={`${DIFFICULTY_LABELS[d.profile?.level ?? 1]} · ${d.quizzesCompleted} sets · ${d.questionsAttempted} questions · ${d.overallAccuracy ?? 0}% accuracy`}
      />
      <div className="panel rounded-xl p-5">
        <h2 className="font-display font-semibold">Accuracy by subject</h2>
        {d.subjectAccuracy.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Submit a practice set to see your progress.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {d.subjectAccuracy.map((s) => (
              <div key={s.subject}>
                <div className="flex justify-between text-sm">
                  <span>{SUBJECT_NAMES[s.subject] ?? s.subject}</span>
                  <span className="text-muted-foreground">{s.accuracy}% of {s.attempted}</span>
                </div>
                <Progress value={s.accuracy} className="mt-1.5" />
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Your level rises after a set with 80%+ accuracy and drops below 45% — based on real results, not completion.
      </p>
    </div>
  );
}
