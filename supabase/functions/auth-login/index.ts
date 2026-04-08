import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting (no external dependencies)
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_PER_EMAIL = 5;
const MAX_FAILED_PER_IP = 10;

interface RateLimitEntry {
  failedCount: number;
  resetAt: number;
}

const emailLimits = new Map<string, RateLimitEntry>();
const ipLimits = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of emailLimits) if (now >= v.resetAt) emailLimits.delete(k);
  for (const [k, v] of ipLimits) if (now >= v.resetAt) ipLimits.delete(k);
}, 5 * 60 * 1000);

function getOrCreate(map: Map<string, RateLimitEntry>, key: string): RateLimitEntry {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || now >= entry.resetAt) {
    const fresh = { failedCount: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    map.set(key, fresh);
    return fresh;
  }
  return entry;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action, successful } = await req.json();
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("cf-connecting-ip") ||
                     "unknown";

    if (action === "check-rate-limit") {
      const emailEntry = getOrCreate(emailLimits, email.toLowerCase());
      const ipEntry = getOrCreate(ipLimits, clientIP);

      if (emailEntry.failedCount >= MAX_FAILED_PER_EMAIL) {
        return new Response(
          JSON.stringify({ error: "Too many failed attempts. Please try again in 15 minutes.", remainingAttempts: 0 }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (ipEntry.failedCount >= MAX_FAILED_PER_IP) {
        return new Response(
          JSON.stringify({ error: "Too many failed attempts from this location. Please try again later.", remainingAttempts: 0 }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ allowed: true, remainingAttempts: MAX_FAILED_PER_EMAIL - emailEntry.failedCount }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "record-attempt") {
      if (!successful) {
        const emailEntry = getOrCreate(emailLimits, email.toLowerCase());
        emailEntry.failedCount++;

        const ipEntry = getOrCreate(ipLimits, clientIP);
        ipEntry.failedCount++;
      } else {
        // Reset on successful login
        emailLimits.delete(email.toLowerCase());
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Auth login error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
