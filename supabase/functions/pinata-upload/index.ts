import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    const PINATA_API_KEY = Deno.env.get("PINATA_API_KEY");
    const PINATA_SECRET_KEY = Deno.env.get("PINATA_SECRET_KEY");

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      console.error("Pinata API keys not configured", {
        hasApiKey: !!PINATA_API_KEY,
        hasSecretKey: !!PINATA_SECRET_KEY,
      });
      return new Response(
        JSON.stringify({ success: false, error: "Pinata API keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { fileData, fileName, fileType } = body;

    if (!fileData || !fileName) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing fileData or fileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation
    if (typeof fileData !== 'string' || fileData.length > 50 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or too large file data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id} uploading file: ${fileName}, type: ${fileType}`);

    // Decode base64 to binary
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create a Blob from the binary data
    const blob = new Blob([bytes], { type: fileType || "application/octet-stream" });

    // Create form data for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append("file", blob, fileName);
    
    // Add metadata with user info for tracking
    pinataFormData.append("pinataMetadata", JSON.stringify({
      name: fileName,
      keyvalues: {
        uploadedBy: user.id,
        uploadedAt: new Date().toISOString()
      }
    }));

    console.log("Sending to Pinata...");

    // Upload to Pinata
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: pinataFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pinata error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Pinata upload failed: ${errorText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log(`Pinata upload successful for user ${user.id}:`, result.IpfsHash);

    return new Response(
      JSON.stringify({
        success: true,
        cid: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error uploading to Pinata:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
