import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ErrorBlock, LoadingBlock } from "@/components/page-states";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getThreadMessages } from "@/lib/study.functions";
import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/coach/$threadId")({
  validateSearch: z.object({ mode: z.enum(["coach", "speaking"]).optional() }),
  head: () => ({
    meta: [
      { title: "Lesson — Banking Exam Coach AI" },
      { name: "description", content: "Learn with your AI banking exam coach." },
      { property: "og:title", content: "Lesson — Banking Exam Coach AI" },
      { property: "og:description", content: "Step-by-step coaching conversation." },
    ],
  }),
  component: ThreadPage,
});

const STARTERS = [
  "Teach me Percentage from basics",
  "Explain Syllogism with examples",
  "Quiz me on Repo rate, CRR and SLR",
  "Show my mistakes and revise my weak topics",
];

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { mode = "coach" } = Route.useSearch();
  const fetchMessages = useServerFn(getThreadMessages);
  const q = useQuery({ queryKey: ["thread", threadId], queryFn: () => fetchMessages({ data: { threadId } }) });
  if (q.isPending) return <LoadingBlock />;
  if (q.isError) return <ErrorBlock message="Conversation not found." onRetry={() => q.refetch()} />;
  return <ChatWindow key={threadId} threadId={threadId} mode={mode} title={q.data.thread.title} initial={q.data.messages as UIMessage[]} />;
}

function ChatWindow({ threadId, mode, title, initial }: { threadId: string; mode: string; title: string; initial: UIMessage[] }) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
        body: { threadId, mode },
      }),
    [threadId, mode],
  );
  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (e) => toast.error(e.message || "The coach could not answer. Please try again."),
  });
  const busy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col md:h-[calc(100dvh-7rem)]">
      <div className="mb-2 flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Back">
          <Link to="/coach">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="font-display truncate font-semibold">{mode === "speaking" ? "English speaking practice" : title}</h1>
      </div>
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="py-6">
              <p className="text-sm text-muted-foreground">
                {mode === "speaking" ? "Say hello in English — I'll correct and guide you." : "What shall we learn today?"}
              </p>
              {mode !== "speaking" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <Button key={s} variant="outline" size="sm" onClick={() => sendMessage({ text: s })}>
                      {s}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                {m.parts.map((part, i) =>
                  part.type === "text" ? (
                    m.role === "assistant" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                    )
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && <Shimmer>Thinking…</Shimmer>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <PromptInput
        className="mt-2"
        onSubmit={({ text }) => {
          if (!text.trim() || busy) return;
          sendMessage({ text: text.trim() });
        }}
      >
        <PromptInputTextarea placeholder="Type your answer or question…" />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} onStop={stop} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
