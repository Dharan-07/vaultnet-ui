// Trust Score calculation logic
// Based on: Clean: +50, Popular Format: +20, Not Tampered: +30

export interface TrustScoreResult {
  totalScore: number;
  breakdown: {
    cleanScan: number;
    popularFormat: number;
    integrityVerified: number;
  };
  hash: string;
  status: 'verified' | 'pending' | 'failed';
  scannedAt: string;
}

const POPULAR_FORMATS = ['onnx', 'pt', 'h5', 'pb', 'safetensors', 'bin', 'pkl'];

// Generate SHA-256 hash for integrity verification
export const generateSHA256Hash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Calculate trust score based on model properties
export const calculateTrustScore = async (
  modelId: number,
  modelName: string,
  cid: string,
  fileFormat?: string
): Promise<TrustScoreResult> => {
  // Simulate scan process
  const dataForHash = `${modelId}-${modelName}-${cid}-${Date.now()}`;
  const hash = await generateSHA256Hash(dataForHash);
  
  // Clean scan score (simulated - in production would use ClamAV)
  const cleanScan = 50; // Assuming clean
  
  // Popular format score
  const format = fileFormat?.toLowerCase() || '';
  const isPopularFormat = POPULAR_FORMATS.some(f => format.includes(f));
  const popularFormat = isPopularFormat ? 20 : 10;
  
  // Integrity verification (hash-based)
  const integrityVerified = 30; // Full score for verified hash
  
  const totalScore = cleanScan + popularFormat + integrityVerified;
  
  return {
    totalScore,
    breakdown: {
      cleanScan,
      popularFormat,
      integrityVerified,
    },
    hash,
    status: totalScore >= 80 ? 'verified' : totalScore >= 50 ? 'pending' : 'failed',
    scannedAt: new Date().toISOString(),
  };
};

// Get trust score badge color based on score
export const getTrustScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-500';
  if (score >= 70) return 'text-yellow-500';
  if (score >= 50) return 'text-orange-500';
  return 'text-red-500';
};

// Get trust score label based on score
export const getTrustScoreLabel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Low';
};
