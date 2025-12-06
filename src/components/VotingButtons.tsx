import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getModelVotes, getUserVote, voteOnModel, DOWNVOTE_REASONS, DownvoteReason } from '@/lib/modelVoting';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface VotingButtonsProps {
  modelId: number;
  compact?: boolean;
}

export const VotingButtons = ({ modelId, compact = false }: VotingButtonsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState<DownvoteReason | ''>('');

  useEffect(() => {
    const loadVotes = async () => {
      setIsLoading(true);
      try {
        const votes = await getModelVotes(modelId);
        setUpvotes(votes.upvotes);
        setDownvotes(votes.downvotes);

        if (user) {
          const existingVote = await getUserVote(user.id, modelId);
          setUserVote(existingVote);
        }
      } catch (error) {
        console.error('Error loading votes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVotes();
  }, [modelId, user]);

  const handleDownvoteClick = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to vote on models',
        variant: 'destructive',
      });
      return;
    }

    // If already downvoted, toggle off without dialog
    if (userVote === 'down') {
      handleVote('down');
      return;
    }

    // Show reason dialog for new downvote
    setSelectedReason('');
    setShowReasonDialog(true);
  };

  const handleConfirmDownvote = async () => {
    if (!selectedReason) {
      toast({
        title: 'Please select a reason',
        description: 'Help us understand why you are downvoting this model',
        variant: 'destructive',
      });
      return;
    }

    setShowReasonDialog(false);
    await handleVote('down', selectedReason as DownvoteReason);
  };

  const handleVote = async (voteType: 'up' | 'down', reason?: DownvoteReason) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to vote on models',
        variant: 'destructive',
      });
      return;
    }

    setIsVoting(true);
    try {
      const result = await voteOnModel(user.id, user.email || '', modelId, voteType, reason);

      if (result.success) {
        // Optimistic update
        if (userVote === voteType) {
          // Toggle off
          if (voteType === 'up') {
            setUpvotes(prev => Math.max(0, prev - 1));
          } else {
            setDownvotes(prev => Math.max(0, prev - 1));
          }
          setUserVote(null);
        } else if (userVote) {
          // Switch vote
          if (voteType === 'up') {
            setUpvotes(prev => prev + 1);
            setDownvotes(prev => Math.max(0, prev - 1));
          } else {
            setDownvotes(prev => prev + 1);
            setUpvotes(prev => Math.max(0, prev - 1));
          }
          setUserVote(voteType);
        } else {
          // New vote
          if (voteType === 'up') {
            setUpvotes(prev => prev + 1);
          } else {
            setDownvotes(prev => prev + 1);
          }
          setUserVote(voteType);
        }

        toast({
          title: userVote === voteType ? 'Vote removed' : 'Vote recorded',
          description: userVote === voteType 
            ? 'Your vote has been removed' 
            : `You ${voteType === 'up' ? 'upvoted' : 'downvoted'} this model`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to record vote',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record vote',
        variant: 'destructive',
      });
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  const score = upvotes - downvotes;

  return (
    <>
      {compact ? (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant={userVote === 'up' ? 'default' : 'ghost'}
            className="h-7 w-7"
            onClick={() => handleVote('up')}
            disabled={isVoting}
          >
            <ThumbsUp className="w-3 h-3" />
          </Button>
          <span className={`text-sm font-medium min-w-[2rem] text-center ${
            score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-muted-foreground'
          }`}>
            {score > 0 ? `+${score}` : score}
          </span>
          <Button
            size="icon"
            variant={userVote === 'down' ? 'destructive' : 'ghost'}
            className="h-7 w-7"
            onClick={handleDownvoteClick}
            disabled={isVoting}
          >
            <ThumbsDown className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant={userVote === 'up' ? 'default' : 'outline'}
            onClick={() => handleVote('up')}
            disabled={isVoting}
            className="gap-1"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{upvotes}</span>
          </Button>
          <Button
            size="sm"
            variant={userVote === 'down' ? 'destructive' : 'outline'}
            onClick={handleDownvoteClick}
            disabled={isVoting}
            className="gap-1"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>{downvotes}</span>
          </Button>
        </div>
      )}

      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Why are you downvoting?</DialogTitle>
            <DialogDescription>
              Your feedback helps improve model quality
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={selectedReason}
            onValueChange={(value) => setSelectedReason(value as DownvoteReason)}
            className="gap-3 py-4"
          >
            {DOWNVOTE_REASONS.map((reason) => (
              <div key={reason.id} className="flex items-center space-x-3">
                <RadioGroupItem value={reason.id} id={reason.id} />
                <Label htmlFor={reason.id} className="cursor-pointer">
                  {reason.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowReasonDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDownvote} disabled={!selectedReason}>
              Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
