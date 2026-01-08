import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Redis } from "https://esm.sh/@upstash/redis@1.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 20; // requests per window
const RATE_LIMIT_WINDOW = 60; // seconds

async function checkRateLimit(redis: Redis, identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:record-purchase:${identifier}`;
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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
        JSON.stringify({ error: "Too many requests. Please try again later." }),
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
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Invalid authentication:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // Parse request body
    const { modelId, modelCid, modelName, modelPrice, txHash } = await req.json();

    // Validate required fields
    if (!modelId || !modelCid || !modelName || !modelPrice) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: modelId, modelCid, modelName, modelPrice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate field types and lengths
    if (typeof modelId !== 'number' || modelId < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid modelId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof modelCid !== 'string' || modelCid.length < 10 || modelCid.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid modelCid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof modelName !== 'string' || modelName.length < 1 || modelName.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Invalid modelName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof modelPrice !== 'string' || !/^\d+(\.\d+)?$/.test(modelPrice)) {
      return new Response(
        JSON.stringify({ error: 'Invalid modelPrice format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate txHash format if provided (Ethereum transaction hash)
    let validatedTxHash: string | null = null;
    if (txHash) {
      if (typeof txHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        validatedTxHash = txHash;
      } else {
        console.warn('Invalid txHash format provided, ignoring:', txHash);
      }
    }

    // Check if purchase already exists (prevent duplicates)
    const { data: existingPurchase } = await supabaseClient
      .from('model_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('model_id', modelId)
      .maybeSingle();

    if (existingPurchase) {
      console.log(`Purchase already exists for user ${user.id} and model ${modelId}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Purchase already recorded', id: existingPurchase.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if txHash is already used (prevent reuse)
    if (validatedTxHash) {
      const { data: existingTx } = await supabaseClient
        .from('model_purchases')
        .select('id')
        .eq('tx_hash', validatedTxHash)
        .maybeSingle();

      if (existingTx) {
        console.error(`Transaction hash already used: ${validatedTxHash}`);
        return new Response(
          JSON.stringify({ error: 'Transaction hash already used' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert the purchase record
    const { data: purchase, error: insertError } = await supabaseClient
      .from('model_purchases')
      .insert({
        user_id: user.id,
        model_id: modelId,
        model_cid: modelCid,
        model_name: modelName,
        model_price: modelPrice,
        tx_hash: validatedTxHash,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert purchase:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to record purchase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Purchase recorded successfully: ${purchase.id}`);

    return new Response(
      JSON.stringify({ success: true, purchase }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in record-purchase function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});