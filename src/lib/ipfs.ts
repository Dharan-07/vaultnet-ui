/**
 * IPFS integration using Pinata
 */

import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

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
  fileCid?: string; // CID of the actual model file
}

// Maximum file size for uploads (30MB raw = ~40MB base64)
const MAX_FILE_SIZE = 30 * 1024 * 1024;

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  try {
    // Client-side file size validation
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Authentication required to upload files");
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    const { data, error } = await supabase.functions.invoke("pinata-upload", {
      body: {
        fileData: base64,
        fileName: file.name,
        fileType: file.type,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      logger.error("Supabase function error:", error);
      if (error.message?.includes('non-2xx')) {
        throw new Error("Pinata API error - check if API keys are valid");
      }
      throw new Error(error.message || "Edge function call failed");
    }

    if (!data) {
      throw new Error("No response from upload service");
    }

    if (!data.success) {
      const errMsg = data.error || "Unknown upload error";
      if (errMsg.includes('not configured')) {
        throw new Error("Pinata API keys not configured - please add PINATA_API_KEY and PINATA_SECRET_KEY");
      }
      throw new Error(errMsg);
    }

    logger.log("File uploaded to IPFS:", data.cid);
    return data.cid;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file to IPFS";
    logger.error("Error uploading to IPFS:", error);
    throw new Error(errorMessage);
  }
}

/**
 * Upload metadata JSON to IPFS
 */
export async function uploadMetadataToIPFS(metadata: ModelMetadata): Promise<string> {
  try {
    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Authentication required to upload metadata");
    }

    const metadataJson = JSON.stringify(metadata, null, 2);
    const base64 = btoa(unescape(encodeURIComponent(metadataJson)));

    const { data, error } = await supabase.functions.invoke("pinata-upload", {
      body: {
        fileData: base64,
        fileName: "metadata.json",
        fileType: "application/json",
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      logger.error("Supabase function error:", error);
      if (error.message?.includes('non-2xx')) {
        throw new Error("Pinata API error - check if API keys are valid");
      }
      throw new Error(error.message || "Edge function call failed");
    }

    if (!data) {
      throw new Error("No response from upload service");
    }

    if (!data.success) {
      const errMsg = data.error || "Unknown upload error";
      if (errMsg.includes('not configured')) {
        throw new Error("Pinata API keys not configured");
      }
      throw new Error(errMsg);
    }

    logger.log("Metadata uploaded to IPFS:", data.cid);
    return data.cid;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to upload metadata to IPFS";
    logger.error("Error uploading metadata to IPFS:", error);
    throw new Error(errorMessage);
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
    // Try Pinata gateway first
    let response = await fetch(getIPFSUrl(cid));
    
    // Fallback to public gateway
    if (!response.ok) {
      response = await fetch(getPublicIPFSUrl(cid));
    }
    
    if (!response.ok) {
      throw new Error("Failed to fetch from IPFS");
    }
    
    const metadata = await response.json();
    return metadata as ModelMetadata;
  } catch (error) {
    logger.error("Error fetching from IPFS:", error);
    return null;
  }
}

/**
 * Download a file from IPFS
 */
export async function downloadFromIPFS(cid: string, filename: string): Promise<void> {
  try {
    const url = getIPFSUrl(cid);
    
    // Fetch the file
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch file from IPFS");
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    window.URL.revokeObjectURL(downloadUrl);
    
    logger.log("Downloaded from IPFS:", cid);
  } catch (error) {
    logger.error("Error downloading from IPFS:", error);
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
    logger.error("IPFS not available:", error);
    return false;
  }
}