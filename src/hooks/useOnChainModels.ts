import { useState, useEffect, useCallback } from "react";
import { getAllModels, ModelData } from "@/lib/web3";
import { fetchMetadataFromIPFS } from "@/lib/ipfs";
import { Model } from "@/components/ModelCard";

export interface OnChainModel extends Model {
  onChain: boolean;
}

export function useOnChainModels() {
  const [models, setModels] = useState<OnChainModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const onChainModels = await getAllModels();
      
      // Transform on-chain models to UI format
      const transformedModels: OnChainModel[] = await Promise.all(
        onChainModels.map(async (model: ModelData) => {
          // Try to fetch metadata from IPFS
          const metadata = await fetchMetadataFromIPFS(model.cid).catch(() => null);
          
          return {
            id: model.id,
            name: metadata?.name || `Model #${model.id}`,
            description: metadata?.description || "On-chain AI model",
            uploader: model.uploader,
            price: model.price,
            cid: model.cid,
            versionCount: model.version,
            downloads: 0, // Not tracked on-chain
            category: metadata?.category || "AI/ML",
            uploadDate: metadata?.uploadDate || new Date().toISOString(),
            tags: metadata?.tags || ["on-chain", "verified"],
            onChain: true,
          };
        })
      );
      
      setModels(transformedModels);
    } catch (err: any) {
      console.error("Error fetching on-chain models:", err);
      setError(err.message || "Failed to fetch models");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, loading, error, refetch: fetchModels };
}
