import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) return null;
    if (payload.iss !== `https://securetoken.google.com/${firebaseProjectId}`) return null;
    if (payload.aud !== firebaseProjectId) return null;

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
    // Verify authentication (Firebase token)
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

    const kaggleUsername = Deno.env.get('KAGGLE_USERNAME');
    const kaggleApiKey = Deno.env.get('KAGGLE_API_KEY');

    if (!kaggleUsername || !kaggleApiKey) {
      return new Response(
        JSON.stringify({ error: 'Kaggle credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const page = url.searchParams.get('page') || '1';
    const sortBy = url.searchParams.get('sortBy') || 'hottest';

    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid page parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validSortOptions = ['hottest', 'votes', 'updated', 'active'];
    if (!validSortOptions.includes(sortBy)) {
      return new Response(
        JSON.stringify({ error: 'Invalid sortBy parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedSearch = search.slice(0, 100);

    let kaggleUrl = `https://www.kaggle.com/api/v1/datasets/list?page=${pageNum}&sortBy=${sortBy}`;
    if (sanitizedSearch) {
      kaggleUrl += `&search=${encodeURIComponent(sanitizedSearch)}`;
    }

    console.log(`Fetching from Kaggle: ${kaggleUrl}`);

    const credentials = btoa(`${kaggleUsername}:${kaggleApiKey}`);

    const response = await fetch(kaggleUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Kaggle API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from Kaggle', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Fetched ${data.length || 0} datasets from Kaggle`);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in kaggle-datasets function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
