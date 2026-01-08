import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Redis } from "https://esm.sh/@upstash/redis@1.28.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 10; // requests per window
const RATE_LIMIT_WINDOW = 60; // seconds

async function checkRateLimit(redis: Redis, identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:pinata-upload:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }
  
  return {
    allowed: current <= RATE_LIMIT_REQUESTS,
    remaining: Math.max(0, RATE_LIMIT_REQUESTS - current),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Redis for rate limiting
    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
    });

    // Get client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const { allowed, remaining } = await checkRateLimit(redis, clientIP);
    
    if (!allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": remaining.toString(),
          } 
        }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
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
      console.error("Pinata API keys not configured");
      throw new Error("Pinata API keys not configured");
    }

    const body = await req.json();
    const { fileData, fileName, fileType } = body;

    if (!fileData || !fileName) {
      throw new Error("Missing fileData or fileName");
    }

    // Input validation
    if (typeof fileData !== 'string' || fileData.length > 50 * 1024 * 1024) { // 50MB max base64
      throw new Error("Invalid or too large file data");
    }

    if (typeof fileName !== 'string' || fileName.length > 255) {
      throw new Error("Invalid file name");
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
      throw new Error(`Pinata upload failed: ${errorText}`);
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
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error uploading to Pinata:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
