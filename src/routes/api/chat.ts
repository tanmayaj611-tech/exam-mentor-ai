import {
  COACH_MODEL,
  COACH_PROVIDER_OPTIONS,
  createLovableAiGatewayRunIdFetch,
  createLovableResponsesProvider,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { buildCoachSystemPrompt, buildSpeakingSystemPrompt } from "@/lib/coach-prompt";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = {
  messages?: unknown;
  threadId?: unknown;
  mode?: unknown;
};

function firstText(message: UIMessage): string {
  for (const part of message.parts ?? []) {
    if (part.type === "text" && typeof part.text === "string" && part.text.trim()) return part.text.trim();
  }
  return "";
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: ChatRequestBody;
        try {
          body = (await request.json()) as ChatRequestBody;
        } catch {
          return new Response("Invalid request", { status: 400 });
        }

        const messages = body.messages;
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        const mode = body.mode === "speaking" ? "speaking" : "coach";

        if (!Array.isArray(messages) || messages.length === 0) {
          return new Response("Messages are required", { status: 400 });
        }
        if (!threadId) return new Response("Conversation id is required", { status: 400 });

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("The AI coach is not configured yet.", { status: 500 });

        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Please sign in again.", { status: 401 });

        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          {
            auth: { persistSession: false, autoRefreshToken: false },
            global: { headers: { Authorization: `Bearer ${token}` } },
          },
        );

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) return new Response("Please sign in again.", { status: 401 });
        const userId = userData.user.id;

        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id, title")
          .eq("id", threadId)
          .eq("user_id", userId)
          .maybeSingle();
        if (!thread) return new Response("Conversation not found", { status: 404 });

        const [{ data: profile }, { data: recentMistakes }] = await Promise.all([
          supabase.from("profiles").select("full_name, target_exam, level, language").eq("id", userId).maybeSingle(),
          supabase
            .from("mistakes")
            .select("topic, error_type")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

        const ctx = {
          fullName: profile?.full_name ?? null,
          targetExam: profile?.target_exam ?? "IBPS PO",
          level: profile?.level ?? 1,
          language: profile?.language ?? "en",
          weakTopics: [...new Set((recentMistakes ?? []).map((m) => m.topic))].slice(0, 5),
          recentMistakes: (recentMistakes ?? []).map((m) => ({ topic: m.topic, errorType: m.error_type })),
        };

        const uiMessages = messages as UIMessage[];
        const lastMessage = uiMessages[uiMessages.length - 1];

        if (lastMessage?.role === "user") {
          const text = firstText(lastMessage);
          const { error: insertError } = await supabase.from("chat_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastMessage.parts ?? [],
            sdk_message_id: lastMessage.id ?? null,
          });
          if (insertError) console.error("Failed to save user message", insertError);

          const isFirst = uiMessages.filter((m) => m.role === "user").length === 1;
          const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (isFirst && text) patch["title"] = text.slice(0, 60);
          await supabase.from("chat_threads").update(patch).eq("id", threadId).eq("user_id", userId);
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);

        try {
          const provider = await createLovableResponsesProvider(runIdFetch);
          const result = streamText({
            model: provider.responses(COACH_MODEL),
            system: mode === "speaking" ? buildSpeakingSystemPrompt(ctx) : buildCoachSystemPrompt(ctx),
            messages: await convertToModelMessages(uiMessages),
            providerOptions: COACH_PROVIDER_OPTIONS as never,
            abortSignal: request.signal,
          });

          return withLovableAiGatewayRunIdHeader(
            result.toUIMessageStreamResponse({
              originalMessages: uiMessages,
              sendReasoning: true,
              headers: getLovableAiGatewayResponseHeaders(undefined, {
                ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
              }),
              onFinish: async ({ responseMessage }) => {
                if (!responseMessage) return;
                const parts = (responseMessage.parts ?? []).filter((part) => part.type === "text");
                const { error } = await supabase.from("chat_messages").insert({
                  thread_id: threadId,
                  user_id: userId,
                  role: "assistant",
                  parts,
                  sdk_message_id: responseMessage.id ?? null,
                });
                if (error) console.error("Failed to save coach reply", error);
                await supabase
                  .from("chat_threads")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", threadId)
                  .eq("user_id", userId);
              },
            }),
            runIdFetch,
          );
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return new Response("Cancelled", { status: 499 });
          }
          console.error("Coach chat failed", error);
          return new Response("The coach could not answer right now. Please try again.", { status: 502 });
        }
      },
    },
  },
});
