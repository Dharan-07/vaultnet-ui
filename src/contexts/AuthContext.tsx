import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Validation schemas
export const emailSchema = z.string().email('Invalid email address').max(255, 'Email too long');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

export const nameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long');

interface UserProfile {
  id: string;
  email: string;
  name: string;
  walletAddress?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; remainingAttempts?: number }>;
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string; requiresEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  connectWallet: (walletAddress: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  resendVerificationEmail: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from Firestore
  const fetchProfile = async (fbUser: FirebaseUser) => {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUser({
          id: fbUser.uid,
          email: fbUser.email || '',
          name: data.name || '',
          walletAddress: data.walletAddress || undefined,
          emailVerified: fbUser.emailVerified,
        });
        return;
      }

      // Self-heal: if the profile doc wasn't created during signup, create it on first login.
      const fallbackData = {
        name: fbUser.displayName || '',
        email: fbUser.email || '',
        emailVerified: fbUser.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.warn('No Firestore profile found; attempting to create one:', fbUser.uid, fallbackData);

      try {
        // Ensure the auth token is ready for Firestore rules (request.auth)
        await fbUser.getIdToken(true);
        await setDoc(userRef, fallbackData, { merge: true });
        console.log('Firestore profile created successfully');
      } catch (createError) {
        console.error('Failed to create Firestore profile:', createError);
      }

      setUser({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fallbackData.name || '',
        emailVerified: fbUser.emailVerified,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: '',
        emailVerified: fbUser.emailVerified,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        await fetchProfile(fbUser);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkRateLimit = async (email: string): Promise<{ allowed: boolean; remainingAttempts?: number; error?: string }> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, action: 'check-rate-limit' }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return { 
          allowed: false, 
          error: result.error || 'Rate limit check failed',
          remainingAttempts: result.remainingAttempts 
        };
      }

      return { allowed: true, remainingAttempts: result.remainingAttempts };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Allow login if rate limit check fails
      return { allowed: true };
    }
  };

  const recordLoginAttempt = async (email: string, successful: boolean) => {
    try {
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, action: 'record-attempt', successful }),
        }
      );
    } catch (error) {
      console.error('Failed to record login attempt:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string; remainingAttempts?: number }> => {
    try {
      // Validate input
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        return { error: emailResult.error.errors[0].message };
      }

      // Check rate limit
      const rateLimitCheck = await checkRateLimit(email);
      if (!rateLimitCheck.allowed) {
        return { 
          error: rateLimitCheck.error || 'Too many login attempts. Please try again later.',
          remainingAttempts: rateLimitCheck.remainingAttempts 
        };
      }

      // Sign in with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // Record successful attempt
      await recordLoginAttempt(email, true);

      return {};
    } catch (error: any) {
      // Record failed attempt
      await recordLoginAttempt(email, false);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled';
      }
      
      return { error: errorMessage };
    }
  };

  const signUp = async (name: string, email: string, password: string): Promise<{ error?: string; requiresEmailVerification?: boolean }> => {
    try {
      // Validate inputs
      const nameResult = nameSchema.safeParse(name);
      if (!nameResult.success) {
        return { error: nameResult.error.errors[0].message };
      }

      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        return { error: emailResult.error.errors[0].message };
      }

      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        return { error: passwordResult.error.errors[0].message };
      }

      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send email verification
      await sendEmailVerification(userCredential.user);

      // Create user profile in Firestore
      try {
        const userRef = doc(db, 'users', userCredential.user.uid);
        const userData = {
          name,
          email,
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        console.log('Saving user data to Firestore:', userCredential.user.uid, userData);
        await setDoc(userRef, userData);
        console.log('User data saved successfully to Firestore');
      } catch (firestoreError) {
        console.error('Failed to save user data to Firestore:', firestoreError);
        // Still return success since the user was created in Firebase Auth
      }

      return { requiresEmailVerification: true };
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        return { error: emailResult.error.errors[0].message };
      }

      await sendPasswordResetEmail(auth, email);
      return {};
    } catch (error: any) {
      let errorMessage = 'An unexpected error occurred';
      
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists
        return {};
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      return { error: errorMessage };
    }
  };

  const connectWallet = async (walletAddress: string) => {
    if (!user || !firebaseUser) throw new Error('Must be logged in to connect wallet');

    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      walletAddress,
      updatedAt: new Date().toISOString(),
    });

    setUser({ ...user, walletAddress });
  };

  const disconnectWallet = async () => {
    if (!user || !firebaseUser) throw new Error('Must be logged in to disconnect wallet');

    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      walletAddress: null,
      updatedAt: new Date().toISOString(),
    });

    setUser({ ...user, walletAddress: undefined });
  };

  const resendVerificationEmail = async (): Promise<{ error?: string }> => {
    try {
      if (!firebaseUser) {
        return { error: 'No user logged in' };
      }

      await sendEmailVerification(firebaseUser);
      return {};
    } catch (error: any) {
      console.error('Resend verification error:', error);
      return { error: 'Failed to send verification email. Please try again later.' };
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    connectWallet,
    disconnectWallet,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
