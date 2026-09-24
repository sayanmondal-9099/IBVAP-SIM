import { createClient } from "@supabase/supabase-js";

/**
 * IBVAP-SIM / KAAL — Supabase Client Foundation (Phase V6D)
 *
 * SIMULATION ONLY — NO REAL DEFENCE NETWORK CONNECTION.
 * Uses ONLY the public anon/publishable key and client-side RLS policies.
 * NEVER imports, exposes, or accepts service_role keys.
 */

const FALLBACK_SUPABASE_URL = "https://gscwgfxgescmaoodxbht.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzY3dnZnhnZXNjbWFvb2R4Ymh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMjc1ODcsImV4cCI6MjEwNDgwMzU4N30.CBHwJN3nwk4ykuV3Zg8cd1qfg8bC0L_aIxj4HflAqF0";

const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_PROJECT_URL ||
  FALLBACK_SUPABASE_URL;

const rawKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  FALLBACK_SUPABASE_ANON_KEY;

export const SUPABASE_URL = String(rawUrl).trim().replace(/\/+$/, "");
export const SUPABASE_ANON_KEY = String(rawKey).trim();

// Safety validation: Ensure only public/anon credentials are used
try {
  const parts = SUPABASE_ANON_KEY.split(".");
  if (parts.length === 3 && typeof atob !== "undefined") {
    const payload = JSON.parse(atob(parts[1]));
    if (payload.role && payload.role !== "anon") {
      throw new Error("FATAL: Only public anon/publishable key allowed in browser.");
    }
  }
} catch (err: unknown) {
  if (err instanceof Error && err.message.startsWith("FATAL:")) {
    throw err;
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;
