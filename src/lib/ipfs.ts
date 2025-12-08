/**
 * IPFS integration using Pinata
 */

import { supabase } from "@/integrations/supabase/client";

export interface ModelMetadata {
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  author: string;
  license: string;
  fileSize: string;
  uploadDate: string;
}

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("pinataMetadata", JSON.stringify({
      name: file.name,
    }));

    const { data, error } = await supabase.functions.invoke("pinata-upload", {
      body: formData,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to upload to IPFS");
    }

    console.log("File uploaded to IPFS:", data.cid);
    return data.cid;
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    throw new Error("Failed to upload file to IPFS");
  }
}

/**
 * Upload metadata JSON to IPFS
 */
export async function uploadMetadataToIPFS(metadata: ModelMetadata): Promise<string> {
  try {
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
    const metadataFile = new File([metadataBlob], "metadata.json");
    
    return await uploadFileToIPFS(metadataFile);
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error);
    throw new Error("Failed to upload metadata to IPFS");
  }
}

/**
 * Get IPFS gateway URL for a CID
 */
export function getIPFSUrl(cid: string): string {
  // Using Pinata gateway for faster access
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

/**
 * Alternative public gateways
 */
export function getPublicIPFSUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`;
}

/**
 * Fetch metadata from IPFS using CID
 */
export async function fetchMetadataFromIPFS(cid: string): Promise<ModelMetadata | null> {
  try {
    const response = await fetch(getIPFSUrl(cid));
    if (!response.ok) {
      throw new Error("Failed to fetch from IPFS");
    }
    const metadata = await response.json();
    return metadata as ModelMetadata;
  } catch (error) {
    console.error("Error fetching from IPFS:", error);
    return null;
  }
}

/**
 * Download a file from IPFS
 */
export async function downloadFromIPFS(cid: string, filename: string): Promise<void> {
  try {
    const url = getIPFSUrl(cid);
    
    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("Downloading from IPFS:", cid);
  } catch (error) {
    console.error("Error downloading from IPFS:", error);
    throw new Error("Failed to download file from IPFS");
  }
}

/**
 * Check if IPFS is available by testing Pinata gateway
 */
export async function checkIPFSAvailability(): Promise<boolean> {
  try {
    const response = await fetch("https://gateway.pinata.cloud/ipfs/QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX", {
      method: "HEAD",
    });
    return response.ok;
  } catch (error) {
    console.error("IPFS not available:", error);
    return false;
  }
}
