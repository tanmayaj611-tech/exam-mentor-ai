import { describe, expect, it } from "vitest";
import { resolvePublicSupabaseEnv } from "./server-env";

const BUILD = { url: "https://abc.supabase.co", key: "sb_publishable_x" };

describe("resolvePublicSupabaseEnv", () => {
  it("uses the build-time URL when the runtime URL is missing", () => {
    expect(resolvePublicSupabaseEnv({}, BUILD).url).toBe("https://abc.supabase.co");
  });
  it("replaces a malformed runtime URL with the build-time URL", () => {
    expect(resolvePublicSupabaseEnv({ SUPABASE_URL: "abc.supabase.co" }, BUILD).url).toBe("https://abc.supabase.co");
  });
  it("strips quotes and spaces pasted around the runtime URL", () => {
    expect(resolvePublicSupabaseEnv({ SUPABASE_URL: ' "https://real.supabase.co" ' }, BUILD).url).toBe("https://real.supabase.co");
  });
  it("falls back to the build-time publishable key", () => {
    expect(resolvePublicSupabaseEnv({ SUPABASE_PUBLISHABLE_KEY: "" }, BUILD).key).toBe("sb_publishable_x");
  });
});
