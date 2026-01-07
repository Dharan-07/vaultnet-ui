import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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