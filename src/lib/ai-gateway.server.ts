/**
 * Lovable AI Gateway helpers (server-only).
 * Propagates the gateway-minted X-Lovable-AIG-Run-ID header; never mints one.
 */

export const LOVABLE_AI_GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function getLovableAiGatewayRunId(request: Request): string | undefined {
  return request.headers.get(RUN_ID_HEADER) ?? undefined;
}

export type LovableRunIdFetch = {
  fetch: typeof fetch;
  readonly runId: string | undefined;
};

export function createLovableAiGatewayRunIdFetch(initialRunId?: string): LovableRunIdFetch {
  let runId = initialRunId;

  const wrapped: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set(RUN_ID_HEADER, runId);
    const response = await fetch(input as RequestInfo, { ...init, headers });
    const returned = response.headers.get(RUN_ID_HEADER);
    if (returned) runId = returned;
    return response;
  };

  return {
    fetch: wrapped,
    get runId() {
      return runId;
    },
  };
}

export function getLovableAiGatewayResponseHeaders(
  base?: HeadersInit,
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers = new Headers(base);
  for (const [key, value] of Object.entries(extra)) headers.set(key, value);
  return Object.fromEntries(headers.entries());
}

export function withLovableAiGatewayRunIdHeader(
  response: Response,
  runIdFetch: Pick<LovableRunIdFetch, "runId">,
): Response {
  if (!runIdFetch.runId) return response;
  const headers = new Headers(response.headers);
  headers.set(RUN_ID_HEADER, runIdFetch.runId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Builds the Responses-API provider for gateway chat models. */
export async function createLovableResponsesProvider(runIdFetch: LovableRunIdFetch) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const { createOpenAI } = await import("@ai-sdk/openai");
  return createOpenAI({
    baseURL: LOVABLE_AI_GATEWAY_BASE_URL,
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
}

export const COACH_MODEL = "openai/gpt-6-astra";

export const COACH_PROVIDER_OPTIONS = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;
