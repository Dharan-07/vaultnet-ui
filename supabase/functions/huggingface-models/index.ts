import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'featured'; // 'featured' or 'trending'
    const limit = url.searchParams.get('limit') || '6';

    // Hugging Face API - fetch models sorted by downloads (featured) or likes (trending)
    const sortBy = type === 'featured' ? 'downloads' : 'likes';
    const hfUrl = `https://huggingface.co/api/models?sort=${sortBy}&direction=-1&limit=${limit}&full=true`;

    const response = await fetch(hfUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const models = await response.json();

    // Transform to our model format
    const transformedModels = models.map((model: any, index: number) => ({
      id: index + 1,
      name: model.modelId || model.id,
      description: model.description || model.cardData?.description || `A ${model.pipeline_tag || 'machine learning'} model`,
      uploader: model.author || 'Unknown',
      price: '0', // Free from Hugging Face (string format)
      cid: model.sha || model.id,
      versionCount: model.siblings?.length || 1,
      downloads: model.downloads || 0,
      likes: model.likes || 0,
      category: model.pipeline_tag || 'Other',
      uploadDate: model.lastModified || model.createdAt || new Date().toISOString(),
      tags: model.tags?.slice(0, 5) || [],
      url: `https://huggingface.co/${model.modelId || model.id}`,
    }));

    return new Response(JSON.stringify(transformedModels), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error fetching Hugging Face models:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
