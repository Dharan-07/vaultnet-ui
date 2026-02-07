import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyFirebaseToken(token: string): Promise<{ uid: string; email: string } | null> {
  try {
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
    if (!projectId) {
      console.error("FIREBASE_PROJECT_ID not configured");
      return null;
    }

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));
    
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (payload.aud !== projectId) return null;
    if (payload.exp * 1000 < Date.now()) return null;

    return { uid: payload.user_id || payload.sub, email: payload.email };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const user = await verifyFirebaseToken(token);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete all profile photos for this user
    const { data: files } = await supabase.storage
      .from("profile-photos")
      .list(user.uid);

    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${user.uid}/${f.name}`);
      const { error } = await supabase.storage
        .from("profile-photos")
        .remove(filesToDelete);

      if (error) {
        console.error("Delete error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to delete files" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
