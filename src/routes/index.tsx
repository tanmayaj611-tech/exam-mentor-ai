import { Button } from "@/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, GraduationCap, ListChecks, MessageCircle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Banking Exam Coach AI — IBPS PO & Clerk preparation" },
      { name: "description", content: "Personal AI tutor for IBPS PO, Clerk and RRB exams: lessons, practice sets, mistake book and progress." },
      { property: "og:title", content: "Banking Exam Coach AI" },
      { property: "og:description", content: "Study, practise and track mistakes for Indian banking exams with an AI coach." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: MessageCircle, title: "Personal coach", text: "Concept → example → practice, one step at a time, in English or Marathi." },
  { icon: BookOpenCheck, title: "Practice sets", text: "Exam-style questions at your level with step-by-step explanations." },
  { icon: ListChecks, title: "Mistake book", text: "Every wrong answer is saved so you can revise it later." },
  { icon: TrendingUp, title: "Adaptive level", text: "Difficulty moves up or down based on your real accuracy." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <section className="brand-surface">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
            <GraduationCap className="size-5" /> Banking Exam Coach AI
          </div>
          <h1 className="font-display mt-6 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Crack IBPS PO, Clerk & RRB with a coach that remembers your mistakes.
          </h1>
          <p className="mt-4 max-w-xl text-base opacity-85">
            Quant, Reasoning, English and Banking Awareness — taught step by step, practised at your level, revised until it sticks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">Start studying free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <Link to="/dashboard">Open my dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-5 py-12 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="panel rounded-xl p-5">
            <f.icon className="size-5 text-primary" />
            <h2 className="font-display mt-3 font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground sm:col-span-2">
          All generated questions are practice questions, not official previous-year papers.
        </p>
      </section>
    </div>
  );
}
