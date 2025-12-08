import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PINATA_API_KEY = Deno.env.get("PINATA_API_KEY");
    const PINATA_SECRET_KEY = Deno.env.get("PINATA_SECRET_KEY");

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      throw new Error("Pinata API keys not configured");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      throw new Error("No file provided");
    }

    // Create form data for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append("file", file);

    // Optional: Add metadata
    const metadata = formData.get("metadata");
    if (metadata) {
      pinataFormData.append("pinataMetadata", metadata);
    }

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
      throw new Error(`Pinata upload failed: ${errorText}`);
    }

    const result = await response.json();

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
