// Server-side fallback for the public database settings.
//
// Server code reads process.env.SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY at
// request time. Hosts like Netlify only provide those at runtime when they are
// set with the "Functions/Runtime" scope; when they are missing or malformed
// (quotes, spaces, no https://), every server call fails. The URL and the
// publishable key are public values already baked into the browser bundle via
// VITE_*, so reusing them here exposes nothing new. Secret keys are never touched.

function clean(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().replace(/^['"]+|['"]+$/g, "").trim();
  return v.length ? v : undefined;
}

export function isValidHttpUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function resolvePublicSupabaseEnv(
  runtime: Record<string, string | undefined>,
  buildTime: { url?: string; key?: string },
): { url?: string; key?: string } {
  const runtimeUrl = clean(runtime["SUPABASE_URL"]);
  const buildUrl = clean(buildTime.url);
  const url = isValidHttpUrl(runtimeUrl) ? runtimeUrl : isValidHttpUrl(buildUrl) ? buildUrl : undefined;
  const key = clean(runtime["SUPABASE_PUBLISHABLE_KEY"]) ?? clean(buildTime.key);
  return { url, key };
}

export function applyPublicSupabaseEnvFallback() {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  if (!proc?.env) return;
  const { url, key } = resolvePublicSupabaseEnv(proc.env, {
    url: import.meta.env['VITE_SUPABASE_URL'] as string | undefined,
    key: import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined,
  });
  if (url) proc.env["SUPABASE_URL"] = url;
  if (key) proc.env["SUPABASE_PUBLISHABLE_KEY"] = key;
}

