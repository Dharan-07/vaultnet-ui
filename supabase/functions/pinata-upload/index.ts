import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    // Verify Firebase authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const firebaseUser = await verifyFirebaseToken(token);
    if (!firebaseUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated Firebase user: ${firebaseUser.uid}`);

    const PINATA_API_KEY = Deno.env.get("PINATA_API_KEY");
    const PINATA_SECRET_KEY = Deno.env.get("PINATA_SECRET_KEY");

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      console.error("Pinata API keys not configured");
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

    if (typeof fileData !== 'string' || fileData.length > 50 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or too large file data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${firebaseUser.uid} uploading file: ${fileName}, type: ${fileType}`);

    // Decode base64 to binary
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: fileType || "application/octet-stream" });

    const pinataFormData = new FormData();
    pinataFormData.append("file", blob, fileName);
    pinataFormData.append("pinataMetadata", JSON.stringify({
      name: fileName,
      keyvalues: {
        uploadedBy: firebaseUser.uid,
        uploadedAt: new Date().toISOString()
      }
    }));

    console.log("Sending to Pinata...");

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
    console.log(`Pinata upload successful for user ${firebaseUser.uid}:`, result.IpfsHash);

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
