import { ErrorBlock, LoadingBlock, PageTitle } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIFFICULTY_LABELS } from "@/lib/coach-prompt";
import { generateQuiz, getProfile, listSubjects } from "@/lib/study.functions";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/practice/")({
  head: () => ({
    meta: [
      { title: "Practice — Banking Exam Coach AI" },
      { name: "description", content: "Generate exam-style practice sets for any topic." },
      { property: "og:title", content: "Practice — Banking Exam Coach AI" },
      { property: "og:description", content: "Practice questions at your level." },
    ],
  }),
  component: PracticeSetup,
});

function PracticeSetup() {
  const navigate = useNavigate();
  const subjectsFn = useServerFn(listSubjects);
  const profileFn = useServerFn(getProfile);
  const generate = useServerFn(generateQuiz);
  const subjects = useQuery({ queryKey: ["subjects"], queryFn: () => subjectsFn() });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const [subjectId, setSubjectId] = useState("quant");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [count, setCount] = useState(5);
  const [mode, setMode] = useState<"practice" | "test">("practice");

  useEffect(() => {
    if (difficulty == null && profile.data) setDifficulty(profile.data.level);
  }, [profile.data, difficulty]);

  const subject = subjects.data?.find((s) => s.id === subjectId);
  useEffect(() => {
    if (subject && !subject.topics.some((t) => t.name === topic)) setTopic(subject.topics[0]?.name ?? "");
  }, [subject, topic]);

  const m = useMutation({
    mutationFn: () => generate({ data: { subjectId, topic, difficulty: difficulty ?? 1, count, mode } }),
    onSuccess: (r) => navigate({ to: "/practice/$quizId", params: { quizId: r.quizId } }),
    onError: () => toast.error("The coach couldn't create questions right now. Please try again."),
  });

  if (subjects.isPending) return <LoadingBlock />;
  if (subjects.isError) return <ErrorBlock onRetry={() => subjects.refetch()} />;

  return (
    <div className="max-w-xl">
      <PageTitle title="Practice" subtitle="Pick a topic — your coach writes a fresh set at your level." />
      <div className="panel space-y-4 rounded-xl p-5">
        <Field label="Subject">
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {subjects.data.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Topic">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger><SelectValue placeholder="Choose topic" /></SelectTrigger>
            <SelectContent>
              {subject?.topics.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Difficulty">
          <Select value={String(difficulty ?? 1)} onValueChange={(v) => setDifficulty(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((l) => <SelectItem key={l} value={String(l)}>{DIFFICULTY_LABELS[l]}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Questions">
            <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[3, 5, 10].map((c) => <SelectItem key={c} value={String(c)}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Mode">
            <Select value={mode} onValueChange={(v) => setMode(v as "practice" | "test")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="test">Timed test</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Button className="w-full" disabled={!topic || m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? "Creating questions… (this can take a minute)" : "Start practice set"}
        </Button>
        <p className="text-xs text-muted-foreground">Generated questions are practice questions, not official previous-year questions.</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
