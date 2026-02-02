import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Redis } from "https://esm.sh/@upstash/redis@1.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const RATE_LIMIT_REQUESTS = 30; // requests per window
const RATE_LIMIT_WINDOW = 60; // seconds

async function checkRateLimit(redis: Redis, identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:kaggle-datasets:${identifier}`;
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

    // Decode the token to get the payload (we'll verify structure)
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    // Decode payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Basic validation
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

    // Verify authentication (Firebase token)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const idToken = authHeader.replace('Bearer ', '');
    const decodedToken = await verifyFirebaseToken(idToken);
    
    if (!decodedToken) {
      console.error('Invalid Firebase token');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Authenticated user: ${decodedToken.uid}`);

    const kaggleUsername = Deno.env.get('KAGGLE_USERNAME');
    const kaggleApiKey = Deno.env.get('KAGGLE_API_KEY');

    if (!kaggleUsername || !kaggleApiKey) {
      console.error('Missing Kaggle credentials');
      return new Response(
        JSON.stringify({ error: 'Kaggle credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const page = url.searchParams.get('page') || '1';
    const sortBy = url.searchParams.get('sortBy') || 'hottest';

    // Input validation
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

    // Sanitize search query (limit length)
    const sanitizedSearch = search.slice(0, 100);

    // Build Kaggle API URL
    let kaggleUrl = `https://www.kaggle.com/api/v1/datasets/list?page=${pageNum}&sortBy=${sortBy}`;
    if (sanitizedSearch) {
      kaggleUrl += `&search=${encodeURIComponent(sanitizedSearch)}`;
    }

    console.log(`Fetching from Kaggle: ${kaggleUrl}`);

    // Create Basic Auth credentials
    const credentials = btoa(`${kaggleUsername}:${kaggleApiKey}`);

    const response = await fetch(kaggleUrl, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Kaggle API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
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