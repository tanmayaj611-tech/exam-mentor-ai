import { ErrorBlock, LoadingBlock, PageTitle, SUBJECT_NAMES } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listMistakes, setMistakeState } from "@/lib/study.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/mistakes")({
  head: () => ({
    meta: [
      { title: "Mistake Book — Banking Exam Coach AI" },
      { name: "description", content: "Every wrong answer, saved for revision." },
      { property: "og:title", content: "Mistake Book — Banking Exam Coach AI" },
      { property: "og:description", content: "Review and revise your mistakes." },
    ],
  }),
  component: Mistakes,
});

const TYPES = ["concept", "calculation", "reading", "formula", "guessing", "time-pressure", "silly"] as const;

function Mistakes() {
  const qc = useQueryClient();
  const list = useServerFn(listMistakes);
  const update = useServerFn(setMistakeState);
  const q = useQuery({ queryKey: ["mistakes"], queryFn: () => list() });
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const m = useMutation({
    mutationFn: (v: { mistakeId: string; revised?: boolean; errorType?: (typeof TYPES)[number] }) => update({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mistakes"] }),
  });

  if (q.isPending) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock onRetry={() => q.refetch()} />;
  const rows = q.data.filter((r) => filter === "all" || !r.revised);

  return (
    <div>
      <PageTitle title="Mistake Book" subtitle="Tag why you got it wrong, then mark it revised once you've mastered it." />
      <div className="mb-4 flex gap-2">
        <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>To revise</Button>
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet. Mistakes from practice sets appear automatically.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="panel rounded-xl p-5">
              <div className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()} · {SUBJECT_NAMES[r.subject_id ?? "other"] ?? r.subject_id} · {r.topic}
              </div>
              <p className="mt-2 font-medium">{r.question}</p>
              <p className="mt-2 text-sm">
                You: <span className="text-destructive">{r.student_answer}</span> · Correct: <b>{r.correct_answer}</b>
              </p>
              {r.explanation && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.explanation}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Select value={r.error_type} onValueChange={(v) => m.mutate({ mistakeId: r.id, errorType: v as (typeof TYPES)[number] })}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{t} mistake</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant={r.revised ? "outline" : "default"} onClick={() => m.mutate({ mistakeId: r.id, revised: !r.revised })}>
                  {r.revised ? "Mark to revise" : "Mark revised"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
