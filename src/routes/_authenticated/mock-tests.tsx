import { ErrorBlock, LoadingBlock, PageTitle } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { createMock, listMocks } from "@/lib/mock.functions";
import { MOCK_PATTERNS, MOCK_SIZES } from "@/lib/mock-patterns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Timer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mock-tests")({
  head: () => ({
    meta: [
      { title: "Mock Tests — Banking Exam Coach AI" },
      { name: "description", content: "Timed IBPS PO, Clerk and RRB practice mocks with sectional analysis." },
      { property: "og:title", content: "Mock Tests — Banking Exam Coach AI" },
      { property: "og:description", content: "Timed, section-wise practice mocks on IBPS patterns." },
    ],
  }),
  component: MockTestsPage,
});

function MockTestsPage() {
  const navigate = useNavigate();
  const create = useServerFn(createMock);
  const list = useServerFn(listMocks);
  const history = useQuery({ queryKey: ["mocks"], queryFn: () => list() });
  const [size, setSize] = useState<"mini" | "half">("mini");
  const m = useMutation({
    mutationFn: (patternId: string) => create({ data: { patternId, size } }),
    onSuccess: (r) => navigate({ to: "/practice/$quizId", params: { quizId: r.quizId } }),
    onError: () => toast.error("Couldn't build the mock right now. Please try again in a moment."),
  });

  return (
    <div className="space-y-5">
      <PageTitle title="Mock Tests" subtitle="Timed, section-wise practice mocks built on the official IBPS patterns." />
      <p className="text-xs text-muted-foreground">
        These are AI-generated practice mocks, scaled down from the official pattern (same time per question and
        ¼ negative marking). They are not previous-year papers. Always check the latest notification on ibps.in.
      </p>
      <div className="flex gap-2">
        {(["mini", "half"] as const).map((s) => (
          <Button key={s} variant={size === s ? "default" : "outline"} size="sm" onClick={() => setSize(s)}>
            {MOCK_SIZES[s]} questions per section
          </Button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {MOCK_PATTERNS.map((p) => (
          <div key={p.id} className="panel rounded-xl p-5">
            <h2 className="font-display font-semibold">{p.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{p.officialNote}</p>
            <p className="mt-2 text-sm">{p.sections.map((s) => s.name).join(" · ")}</p>
            <Button className="mt-3" disabled={m.isPending} onClick={() => m.mutate(p.id)}>
              <Timer /> {m.isPending && m.variables === p.id ? "Building mock… (up to a minute)" : "Start mock"}
            </Button>
          </div>
        ))}
      </div>
      <div>
        <h2 className="mb-2 font-display font-semibold">Your mocks</h2>
        {history.isPending ? (
          <LoadingBlock />
        ) : history.isError ? (
          <ErrorBlock onRetry={() => history.refetch()} />
        ) : history.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No mocks yet. Start one above.</p>
        ) : (
          <div className="space-y-2">
            {history.data.map((x) => {
              const score = x.correct_count - x.incorrect_count * Number(x.negative_marking ?? 0);
              return (
                <Link
                  key={x.id}
                  to="/practice/$quizId"
                  params={{ quizId: x.id }}
                  className="panel flex items-center justify-between rounded-lg p-3 text-sm hover:bg-muted"
                >
                  <span>{x.topic}</span>
                  <span className="text-muted-foreground">
                    {x.status === "submitted" ? `Score ${score.toFixed(2)}/${x.total_questions}` : "Continue"}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
