import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS_PER_EMAIL = 5;
const MAX_FAILED_ATTEMPTS_PER_IP = 10;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, action, successful } = await req.json();
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";

    // Check rate limit action
    if (action === "check-rate-limit") {
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();

      // Check failed attempts by email
      const { count: emailFailedCount } = await supabase
        .from("login_attempts")
        .select("*", { count: "exact", head: true })
        .eq("email", email.toLowerCase())
        .eq("successful", false)
        .gte("attempted_at", windowStart);

      // Check failed attempts by IP
      const { count: ipFailedCount } = await supabase
        .from("login_attempts")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", clientIP)
        .eq("successful", false)
        .gte("attempted_at", windowStart);

      const emailAttempts = emailFailedCount || 0;
      const ipAttempts = ipFailedCount || 0;

      if (emailAttempts >= MAX_FAILED_ATTEMPTS_PER_EMAIL) {
        return new Response(
          JSON.stringify({
            error: `Too many failed attempts. Please try again in ${RATE_LIMIT_WINDOW_MINUTES} minutes.`,
            remainingAttempts: 0,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (ipAttempts >= MAX_FAILED_ATTEMPTS_PER_IP) {
        return new Response(
          JSON.stringify({
            error: `Too many failed attempts from this location. Please try again later.`,
            remainingAttempts: 0,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          allowed: true,
          remainingAttempts: MAX_FAILED_ATTEMPTS_PER_EMAIL - emailAttempts,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record login attempt action
    if (action === "record-attempt") {
      await supabase.from("login_attempts").insert({
        email: email.toLowerCase(),
        ip_address: clientIP,
        successful: successful ?? false,
        attempted_at: new Date().toISOString(),
      });

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
