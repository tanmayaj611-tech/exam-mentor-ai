import { ErrorBlock, LoadingBlock, PageTitle } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIFFICULTY_LABELS } from "@/lib/coach-prompt";
import { getProfile, updateProfile } from "@/lib/study.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Banking Exam Coach AI" },
      { name: "description", content: "Target exam, exam date, level and language." },
      { property: "og:title", content: "Settings — Banking Exam Coach AI" },
      { property: "og:description", content: "Personalise your study plan." },
    ],
  }),
  component: SettingsPage,
});

const EXAMS = ["IBPS PO", "IBPS Clerk", "IBPS RRB PO", "IBPS RRB Clerk", "SBI PO", "SBI Clerk"];

function SettingsPage() {
  const qc = useQueryClient();
  const get = useServerFn(getProfile);
  const save = useServerFn(updateProfile);
  const q = useQuery({ queryKey: ["profile"], queryFn: () => get() });
  const [form, setForm] = useState({ full_name: "", target_exam: "IBPS PO", exam_date: "", level: 1, language: "en" as "en" | "mr", daily_hours: 6 });

  useEffect(() => {
    if (q.data)
      setForm({
        full_name: q.data.full_name ?? "",
        target_exam: q.data.target_exam,
        exam_date: q.data.exam_date ?? "",
        level: q.data.level,
        language: (q.data.language as "en" | "mr") ?? "en",
        daily_hours: Number(q.data.daily_hours ?? 6),
      });
  }, [q.data]);

  const m = useMutation({
    mutationFn: () => save({ data: form }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries();
    },
    onError: () => toast.error("Couldn't save. Please check the values and try again."),
  });

  if (q.isPending) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock onRetry={() => q.refetch()} />;

  return (
    <div className="max-w-xl">
      <PageTitle title="Settings" subtitle="Your coach uses these to personalise lessons and practice." />
      <div className="panel space-y-4 rounded-xl p-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Target exam</Label>
          <Select value={form.target_exam} onValueChange={(v) => setForm({ ...form, target_exam: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{EXAMS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="date">Exam date</Label>
            <Input id="date" type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hours">Hours per day</Label>
            <Input id="hours" type="number" min={0.5} max={16} step={0.5} value={form.daily_hours} onChange={(e) => setForm({ ...form, daily_hours: Number(e.target.value) })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Current level</Label>
          <Select value={String(form.level)} onValueChange={(v) => setForm({ ...form, level: Number(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[1, 2, 3, 4, 5].map((l) => <SelectItem key={l} value={String(l)}>{DIFFICULTY_LABELS[l]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Explanation language</Label>
          <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v as "en" | "mr" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="mr">मराठी (Marathi)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full" disabled={m.isPending} onClick={() => m.mutate()}>{m.isPending ? "Saving…" : "Save"}</Button>
      </div>
    </div>
  );
}
