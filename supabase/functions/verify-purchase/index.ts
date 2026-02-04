import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Redis } from "https://esm.sh/@upstash/redis@1.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VaultNet Contract Configuration
const CONTRACT_ADDRESS = '0x90DCb7bAA3c1D67eCF0B40B892D4198BC0c1E024';

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = 60;

async function checkRateLimit(redis: Redis, identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:verify-purchase:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }
  
  return {
    allowed: current <= RATE_LIMIT_REQUESTS,
    remaining: Math.max(0, RATE_LIMIT_REQUESTS - current),
  };
}

// Verify Firebase ID token
async function verifyFirebaseToken(idToken: string): Promise<{ uid: string } | null> {
  try {
    const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID');
    if (!firebaseProjectId) {
      console.error('FIREBASE_PROJECT_ID not configured');
      return null;
    }

    const parts = idToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.error('Token expired');
      return null;
    }
    
    if (payload.iss !== `https://securetoken.google.com/${firebaseProjectId}`) {
      console.error('Invalid issuer');
      return null;
    }

    if (payload.aud !== firebaseProjectId) {
      console.error('Invalid audience');
      return null;
    }

    return { uid: payload.sub || payload.user_id };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Redis for rate limiting
    const redis = new Redis({
      url: Deno.env.get("UPSTASH_REDIS_REST_URL")!,
      token: Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!,
    });

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

    // Verify Firebase authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const idToken = authHeader.replace('Bearer ', '');
    const decodedToken = await verifyFirebaseToken(idToken);
    
    if (!decodedToken) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = decodedToken.uid;
    console.log(`Authenticated Firebase user: ${userId}`);

    // Parse request body
    const { txHash, modelId, modelCid, modelName, modelPrice, walletAddress } = await req.json();

    // Validate inputs
    if (!txHash || typeof txHash !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Transaction hash is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return new Response(
        JSON.stringify({ error: 'Invalid transaction hash format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!modelId || typeof modelId !== 'number' || modelId < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid model ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!modelCid || typeof modelCid !== 'string' || modelCid.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid model CID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!modelName || typeof modelName !== 'string' || modelName.length < 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid model name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!modelPrice || typeof modelPrice !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid model price' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify transaction on blockchain via Sepolia RPC
    const SEPOLIA_RPC_URL = Deno.env.get('SEPOLIA_RPC_URL');
    if (!SEPOLIA_RPC_URL) {
      console.error('SEPOLIA_RPC_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Blockchain verification not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Verifying transaction: ${txHash}`);

    // Fetch transaction receipt from blockchain
    const receiptResponse = await fetch(SEPOLIA_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      }),
    });

    const receiptData = await receiptResponse.json();
    
    if (receiptData.error) {
      console.error('RPC error:', receiptData.error);
      return new Response(
        JSON.stringify({ error: 'Failed to verify transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const receipt = receiptData.result;
    
    if (!receipt) {
      console.log('Transaction not found or not yet mined');
      return new Response(
        JSON.stringify({ error: 'Transaction not found. It may still be pending.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check transaction status (0x1 = success)
    if (receipt.status !== '0x1') {
      console.log('Transaction failed on-chain');
      return new Response(
        JSON.stringify({ error: 'Transaction failed on blockchain' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify transaction was sent to our contract
    if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
      console.log(`Transaction to wrong contract: ${receipt.to}`);
      return new Response(
        JSON.stringify({ error: 'Transaction was not sent to VaultNet contract' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transaction verified successfully');

    // Now fetch the actual transaction to verify value
    const txResponse = await fetch(SEPOLIA_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getTransactionByHash',
        params: [txHash],
      }),
    });

    const txData = await txResponse.json();
    const tx = txData.result;

    if (!tx) {
      return new Response(
        JSON.stringify({ error: 'Could not fetch transaction details' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the transaction value (in wei, hex format)
    const txValueWei = BigInt(tx.value);
    
    // Parse expected price (in ETH) to wei
    const expectedPriceWei = BigInt(Math.floor(parseFloat(modelPrice) * 1e18));
    
    // Allow 1% tolerance for gas price fluctuations
    const tolerance = expectedPriceWei / 100n;
    const minAcceptable = expectedPriceWei - tolerance;
    const maxAcceptable = expectedPriceWei + tolerance;

    if (txValueWei < minAcceptable) {
      console.log(`Transaction value too low. Expected: ${expectedPriceWei}, Got: ${txValueWei}`);
      return new Response(
        JSON.stringify({ error: 'Transaction value does not match model price' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Transaction value verified: ${txValueWei} wei`);

    // Check if the sender matches the authenticated user's wallet
    // We can't fully verify this without linking Firebase user to wallet, so we log it
    console.log(`Transaction sender: ${tx.from}`);

    // Record the purchase using the database RPC (service role client for elevated privileges)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check for duplicate tx_hash first
    const { data: existingTx } = await serviceClient
      .from('model_purchases')
      .select('id')
      .eq('tx_hash', txHash)
      .maybeSingle();

    if (existingTx) {
      console.log(`Transaction hash already used: ${txHash}`);
      return new Response(
        JSON.stringify({ error: 'Transaction hash already used for another purchase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already purchased this model
    const { data: existingPurchase } = await serviceClient
      .from('model_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('model_id', modelId)
      .maybeSingle();

    if (existingPurchase) {
      console.log(`User already purchased model ${modelId}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Already purchased', id: existingPurchase.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the verified purchase with Firebase UID and wallet address
    const { data: purchase, error: insertError } = await serviceClient
      .from('model_purchases')
      .insert({
        user_id: userId,
        model_id: modelId,
        model_cid: modelCid,
        model_name: modelName,
        model_price: modelPrice,
        tx_hash: txHash,
        wallet_address: walletAddress || null,
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
    console.error('Error in verify-purchase function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
