import { ErrorBlock, LoadingBlock, PageTitle } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { createThread, deleteThread, listThreads } from "@/lib/study.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coach/")({
  head: () => ({
    meta: [
      { title: "Study Now — Banking Exam Coach AI" },
      { name: "description", content: "Your saved coaching conversations." },
      { property: "og:title", content: "Study Now — Banking Exam Coach AI" },
      { property: "og:description", content: "Learn any banking exam topic step by step." },
    ],
  }),
  component: CoachList,
});

function CoachList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listThreads);
  const create = useServerFn(createThread);
  const remove = useServerFn(deleteThread);
  const q = useQuery({ queryKey: ["threads"], queryFn: () => list() });

  const start = useMutation({
    mutationFn: (mode: "coach" | "speaking") => create({ data: { mode } }),
    onSuccess: (t, mode) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/coach/$threadId", params: { threadId: t.id }, search: { mode } });
    },
    onError: () => toast.error("Couldn't start a conversation. Please try again."),
  });
  const del = useMutation({
    mutationFn: (threadId: string) => remove({ data: { threadId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["threads"] }),
  });

  return (
    <div>
      <PageTitle title="Study Now" subtitle="Ask your coach to teach any topic — Quant, Reasoning, English or Banking." />
      <div className="mb-5 flex flex-wrap gap-2">
        <Button onClick={() => start.mutate("coach")} disabled={start.isPending}>
          <Plus /> New lesson
        </Button>
        <Button variant="outline" onClick={() => start.mutate("speaking")} disabled={start.isPending}>
          <Mic /> English speaking practice
        </Button>
      </div>
      {q.isPending ? (
        <LoadingBlock />
      ) : q.isError ? (
        <ErrorBlock onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No conversations yet. Start a new lesson above.</p>
      ) : (
        <ul className="space-y-2">
          {q.data.map((t) => (
            <li key={t.id} className="panel flex items-center rounded-xl px-4 py-3">
              <Link
                to="/coach/$threadId"
                params={{ threadId: t.id }}
                search={{ mode: t.title === "Speaking practice" ? "speaking" : "coach" }}
                className="flex-1 truncate font-medium hover:underline"
              >
                {t.title}
              </Link>
              <span className="mx-3 hidden text-xs text-muted-foreground sm:block">
                {new Date(t.updated_at).toLocaleDateString()}
              </span>
              <Button variant="ghost" size="icon" aria-label="Delete conversation" onClick={() => del.mutate(t.id)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
