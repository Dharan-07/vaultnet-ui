import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getTrustScore, storeTrustScore } from '@/lib/modelVoting';
import { calculateTrustScore, getTrustScoreLabel } from '@/lib/trustScore';

interface TrustScoreBadgeProps {
  modelId: number;
  modelName: string;
  cid: string;
  showDetails?: boolean;
}

export const TrustScoreBadge = ({ modelId, modelName, cid, showDetails = false }: TrustScoreBadgeProps) => {
  const [score, setScore] = useState<number | null>(null);
  const [hash, setHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<{
    cleanScan: number;
    popularFormat: number;
    integrityVerified: number;
  } | null>(null);

  useEffect(() => {
    const loadTrustScore = async () => {
      setIsLoading(true);
      try {
        // Try to get existing score from Firebase
        const existingScore = await getTrustScore(modelId);
        
        if (existingScore) {
          setScore(existingScore.trustScore);
          setHash(existingScore.hash);
          setBreakdown(existingScore.breakdown);
        } else {
          // Calculate and store new score
          const result = await calculateTrustScore(modelId, modelName, cid);
          setScore(result.totalScore);
          setHash(result.hash);
          setBreakdown(result.breakdown);
          
          // Store in Firebase
          await storeTrustScore(modelId, result.totalScore, result.hash, result.breakdown);
        }
      } catch (error) {
        console.error('Error loading trust score:', error);
        setScore(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadTrustScore();
  }, [modelId, modelName, cid]);

  const getScoreIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (score === null) return <Shield className="w-4 h-4" />;
    if (score >= 90) return <ShieldCheck className="w-4 h-4 text-green-500" />;
    if (score >= 70) return <ShieldCheck className="w-4 h-4 text-yellow-500" />;
    if (score >= 50) return <ShieldAlert className="w-4 h-4 text-orange-500" />;
    return <ShieldX className="w-4 h-4 text-red-500" />;
  };

  const getScoreVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score === null) return 'outline';
    if (score >= 70) return 'default';
    if (score >= 50) return 'secondary';
    return 'destructive';
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getScoreVariant()} className="gap-1 cursor-help">
              {getScoreIcon()}
              {isLoading ? '...' : score !== null ? `${score}/100` : 'N/A'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">Trust Score: {score !== null ? getTrustScoreLabel(score) : 'N/A'}</p>
              {breakdown && (
                <div className="text-xs space-y-1">
                  <p>• Clean Scan: +{breakdown.cleanScan}</p>
                  <p>• Popular Format: +{breakdown.popularFormat}</p>
                  <p>• Integrity Verified: +{breakdown.integrityVerified}</p>
                </div>
              )}
              {hash && (
                <p className="text-xs font-mono truncate">
                  SHA-256: {hash.slice(0, 16)}...
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-2">
        {getScoreIcon()}
        <span className="font-semibold">
          Trust Score: {isLoading ? 'Calculating...' : score !== null ? `${score}/100` : 'N/A'}
        </span>
        {score !== null && (
          <Badge variant={getScoreVariant()}>
            {getTrustScoreLabel(score)}
          </Badge>
        )}
      </div>
      
      {breakdown && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Clean Scan</span>
            <span className="font-medium text-green-500">+{breakdown.cleanScan}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Popular Format</span>
            <span className="font-medium text-blue-500">+{breakdown.popularFormat}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Integrity Verified</span>
            <span className="font-medium text-purple-500">+{breakdown.integrityVerified}</span>
          </div>
        </div>
      )}
      
      {hash && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">SHA-256 Hash</p>
          <code className="text-xs font-mono break-all">{hash}</code>
        </div>
      )}
    </div>
  );
};
