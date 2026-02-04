import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log(`Fetching purchases for Firebase user: ${userId}`);

    // Parse request body for optional filters
    let modelId: number | undefined;
    let walletAddress: string | undefined;
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        modelId = body.modelId;
        walletAddress = body.walletAddress;
      } catch {
        // No body or invalid JSON is fine for listing all purchases
      }
    }

    // Use service role client to bypass RLS
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Build query - fetch purchases for this Firebase user OR their connected wallet
    let query = serviceClient
      .from('model_purchases')
      .select('id, model_id, model_cid, model_name, model_price, purchased_at, wallet_address, tx_hash');
    
    // Filter by user_id (Firebase UID) OR wallet_address if provided
    if (walletAddress) {
      query = query.or(`user_id.eq.${userId},wallet_address.ilike.${walletAddress}`);
    } else {
      query = query.eq('user_id', userId);
    }
    
    // Optionally filter by specific model
    if (modelId !== undefined) {
      query = query.eq('model_id', modelId);
    }
    
    query = query.order('purchased_at', { ascending: false });

    const { data: purchases, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch purchases' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${purchases?.length || 0} purchases for user ${userId}`);

    return new Response(
      JSON.stringify({ purchases: purchases || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-purchases function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
