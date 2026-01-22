import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc,
  increment,
  query,
  where,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

export interface ModelVote {
  modelId: number;
  upvotes: number;
  downvotes: number;
  score: number;
}

export interface UserVote {
  modelId: number;
  voteType: 'up' | 'down';
  votedAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Get votes for a model — reads from model_votes/{modelId} (top-level, shared)
// ─────────────────────────────────────────────────────────────────────────────
export const getModelVotes = async (modelId: number): Promise<ModelVote> => {
  try {
    const voteRef = doc(db, 'model_votes', modelId.toString());
    const voteDoc = await getDoc(voteRef);
    
    if (voteDoc.exists()) {
      const data = voteDoc.data();
      return {
        modelId,
        upvotes: data.upvotes || 0,
        downvotes: data.downvotes || 0,
        score: (data.upvotes || 0) - (data.downvotes || 0),
      };
    }
    
    return { modelId, upvotes: 0, downvotes: 0, score: 0 };
  } catch (error) {
    console.error('Error getting model votes:', error);
    return { modelId, upvotes: 0, downvotes: 0, score: 0 };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get user's vote for a model
// Reads from top-level user_votes collection: user_votes/{odId}
// ─────────────────────────────────────────────────────────────────────────────
export const getUserVote = async (userId: string, modelId: number): Promise<'up' | 'down' | null> => {
  try {
    const voteRef = doc(db, 'user_votes', `${userId}_${modelId}`);
    const voteDoc = await getDoc(voteRef);
    
    if (voteDoc.exists() && !voteDoc.data().deleted) {
      return voteDoc.data().voteType as 'up' | 'down';
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user vote:', error);
    return null;
  }
};

export const DOWNVOTE_REASONS = [
  { id: 'inaccurate', label: '🎯 Could be more accurate' },
  { id: 'poor_quality', label: '✨ Has room for improvement' },
  { id: 'outdated', label: '🔄 Needs an update' },
  { id: 'security_concern', label: '🛡️ Safety could be enhanced' },
  { id: 'documentation', label: '📚 Documentation could help' },
  { id: 'compatibility', label: '🔧 Compatibility suggestions' },
  { id: 'other', label: '💡 Other suggestions' },
] as const;

export type DownvoteReason = typeof DOWNVOTE_REASONS[number]['id'];

// ─────────────────────────────────────────────────────────────────────────────
// Vote on a model
// Writes to:
//   - model_votes/{modelId} (shared aggregate)
//   - user_votes/{userId}_{modelId} (top-level user-specific votes)
// ─────────────────────────────────────────────────────────────────────────────
export const voteOnModel = async (
  userId: string,
  userEmail: string,
  modelId: number,
  voteType: 'up' | 'down',
  downvoteReason?: DownvoteReason
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userVoteRef = doc(db, 'user_votes', `${userId}_${modelId}`);
    const modelVoteRef = doc(db, 'model_votes', modelId.toString());
    
    // Check existing vote
    let existingVote: string | null = null;
    const voteDoc = await getDoc(userVoteRef);
    if (voteDoc.exists() && !voteDoc.data().deleted) {
      existingVote = voteDoc.data().voteType;
    }
    
    // Get or create model vote document
    const modelVoteDoc = await getDoc(modelVoteRef);
    
    if (!modelVoteDoc.exists()) {
      await setDoc(modelVoteRef, {
        modelId,
        upvotes: 0,
        downvotes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    if (existingVote === voteType) {
      // Remove vote (toggle off)
      await updateDoc(modelVoteRef, {
        [voteType === 'up' ? 'upvotes' : 'downvotes']: increment(-1),
        updatedAt: serverTimestamp(),
      });
      
      await setDoc(userVoteRef, {
        deleted: true,
        deletedAt: serverTimestamp(),
      });
      
      return { success: true };
    }
    
    if (existingVote) {
      // Change vote
      await updateDoc(modelVoteRef, {
        [existingVote === 'up' ? 'upvotes' : 'downvotes']: increment(-1),
        [voteType === 'up' ? 'upvotes' : 'downvotes']: increment(1),
        updatedAt: serverTimestamp(),
      });
    } else {
      // New vote
      await updateDoc(modelVoteRef, {
        [voteType === 'up' ? 'upvotes' : 'downvotes']: increment(1),
        updatedAt: serverTimestamp(),
      });
    }
    
    // Save user vote to top-level user_votes collection
    await setDoc(userVoteRef, {
      userId,
      userEmail,
      modelId,
      voteType,
      ...(voteType === 'down' && downvoteReason ? { downvoteReason } : {}),
      votedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error voting on model:', error);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Store trust score in Firebase (model_votes/{modelId}/trust_scores singleton)
// ─────────────────────────────────────────────────────────────────────────────
export const storeTrustScore = async (
  modelId: number,
  trustScore: number,
  hash: string,
  breakdown: { cleanScan: number; popularFormat: number; integrityVerified: number }
): Promise<void> => {
  try {
    const trustScoreRef = doc(db, 'trust_scores', modelId.toString());
    await setDoc(trustScoreRef, {
      modelId,
      trustScore,
      hash,
      breakdown,
      scannedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error storing trust score:', error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get trust score from Firebase
// ─────────────────────────────────────────────────────────────────────────────
export const getTrustScore = async (modelId: number): Promise<{
  trustScore: number;
  hash: string;
  breakdown: { cleanScan: number; popularFormat: number; integrityVerified: number };
} | null> => {
  try {
    const trustScoreRef = doc(db, 'trust_scores', modelId.toString());
    const trustScoreDoc = await getDoc(trustScoreRef);
    
    if (trustScoreDoc.exists()) {
      const data = trustScoreDoc.data();
      return {
        trustScore: data.trustScore,
        hash: data.hash,
        breakdown: data.breakdown,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting trust score:', error);
    return null;
  }
};
