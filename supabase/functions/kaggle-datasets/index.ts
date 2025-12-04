import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Build Kaggle API URL
    let kaggleUrl = `https://www.kaggle.com/api/v1/datasets/list?page=${page}&sortBy=${sortBy}`;
    if (search) {
      kaggleUrl += `&search=${encodeURIComponent(search)}`;
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
