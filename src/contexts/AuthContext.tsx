import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db, storage } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  profilePhotoUrl?: string;
  bio?: string;
  website?: string;
  location?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
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
  updateProfile: (data: { 
    name?: string; 
    bio?: string; 
    website?: string;
    location?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  }) => Promise<{ error?: string }>;
  uploadProfilePhoto: (file: File | Blob) => Promise<{ error?: string; url?: string }>;
  deleteProfilePhoto: () => Promise<{ error?: string }>;
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

  // Fetch user profile from Firestore (new structure: users/{uid})
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
          profilePhotoUrl: data.profilePhotoUrl || undefined,
          bio: data.bio || undefined,
          website: data.website || undefined,
          location: data.location || undefined,
          twitter: data.twitter || undefined,
          github: data.github || undefined,
          linkedin: data.linkedin || undefined,
        });
        return;
      }

      // Self-heal: if the profile doc wasn't created during signup, create it on first login.
      const fallbackData = {
        name: fbUser.displayName || '',
        email: fbUser.email || '',
        emailVerified: fbUser.emailVerified,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.warn('No Firestore profile found; attempting to create one:', fbUser.uid, fallbackData);

      try {
        await fbUser.getIdToken(true);
        await setDoc(userRef, fallbackData, { merge: true });
        console.log('Firestore profile created successfully');
      } catch (createError) {
        console.error('Failed to create Firestore profile:', createError);
      }

      setUser({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: (fallbackData.name as string) || '',
        emailVerified: fbUser.emailVerified,
        profilePhotoUrl: undefined,
        bio: undefined,
        website: undefined,
        location: undefined,
        twitter: undefined,
        github: undefined,
        linkedin: undefined,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser({
        id: fbUser.uid,
        email: fbUser.email || '',
        name: '',
        emailVerified: fbUser.emailVerified,
        profilePhotoUrl: undefined,
        bio: undefined,
      });
    }
  };

  // Record login to top-level login collection
  const recordLogin = async (uid: string, email: string) => {
    try {
      const loginsRef = collection(db, 'login');
      await addDoc(loginsRef, {
        userId: uid,
        email,
        loginAt: serverTimestamp(),
      });
      console.log('Login recorded to login collection');
    } catch (error) {
      console.error('Failed to record login:', error);
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
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        return { error: emailResult.error.errors[0].message };
      }

      const rateLimitCheck = await checkRateLimit(email);
      if (!rateLimitCheck.allowed) {
        return { 
          error: rateLimitCheck.error || 'Too many login attempts. Please try again later.',
          remainingAttempts: rateLimitCheck.remainingAttempts 
        };
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Record successful attempt (edge function)
      await recordLoginAttempt(email, true);

      // Record login to Firestore subcollection
      await recordLogin(userCredential.user.uid, email);

      // Update lastLogin on user doc
      try {
        const userRef = doc(db, 'users', userCredential.user.uid);
        await updateDoc(userRef, { lastLogin: serverTimestamp(), updatedAt: serverTimestamp() });
      } catch (err) {
        console.error('Failed to update lastLogin:', err);
      }

      return {};
    } catch (error: any) {
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

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await sendEmailVerification(userCredential.user);

      // Create user profile in Firestore (users/{uid})
      try {
        const userRef = doc(db, 'users', userCredential.user.uid);
        const userData = {
          name,
          email,
          emailVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        console.log('Saving user data to Firestore (users/{uid}):', userCredential.user.uid, userData);
        await setDoc(userRef, userData);
        console.log('User data saved successfully to Firestore');
      } catch (firestoreError) {
        console.error('Failed to save user data to Firestore:', firestoreError);
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
        return {};
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      return { error: errorMessage };
    }
  };

  // Connect wallet — saves to users/{uid} and adds entry to top-level wallets collection
  const connectWallet = async (walletAddress: string) => {
    if (!user || !firebaseUser) throw new Error('Must be logged in to connect wallet');

    const userRef = doc(db, 'users', firebaseUser.uid);
    await updateDoc(userRef, {
      walletAddress,
      updatedAt: serverTimestamp(),
    });

    // Also record in top-level wallets collection for audit trail
    try {
      const walletsRef = collection(db, 'wallets');
      await addDoc(walletsRef, {
        userId: firebaseUser.uid,
        walletAddress,
        connectedAt: serverTimestamp(),
      });
      console.log('Wallet recorded to wallets collection');
    } catch (err) {
      console.error('Failed to record wallet to collection:', err);
    }

    setUser({ ...user, walletAddress });
  };

  const disconnectWallet = async () => {
    if (!user || !firebaseUser) throw new Error('Must be logged in to disconnect wallet');

    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      walletAddress: null,
      updatedAt: serverTimestamp(),
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

  const updateProfile = async (data: { 
    name?: string; 
    bio?: string;
    website?: string;
    location?: string;
    twitter?: string;
    github?: string;
    linkedin?: string;
  }): Promise<{ error?: string }> => {
    try {
      if (!user || !firebaseUser) {
        return { error: 'Must be logged in to update profile' };
      }

      if (data.name) {
        const nameResult = nameSchema.safeParse(data.name);
        if (!nameResult.success) {
          return { error: nameResult.error.errors[0].message };
        }
      }

      const userRef = doc(db, 'users', firebaseUser.uid);
      const updateData: Record<string, any> = {
        updatedAt: serverTimestamp(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.website !== undefined) updateData.website = data.website;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.twitter !== undefined) updateData.twitter = data.twitter;
      if (data.github !== undefined) updateData.github = data.github;
      if (data.linkedin !== undefined) updateData.linkedin = data.linkedin;

      await updateDoc(userRef, updateData);

      setUser({
        ...user,
        name: data.name ?? user.name,
        bio: data.bio ?? user.bio,
        website: data.website ?? user.website,
        location: data.location ?? user.location,
        twitter: data.twitter ?? user.twitter,
        github: data.github ?? user.github,
        linkedin: data.linkedin ?? user.linkedin,
      });

      return {};
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { error: 'Failed to update profile. Please try again.' };
    }
  };

  const uploadProfilePhoto = async (file: File | Blob): Promise<{ error?: string; url?: string }> => {
    try {
      if (!user || !firebaseUser) {
        return { error: 'Must be logged in to upload photo' };
      }

      // Check file type for File objects
      if (file instanceof File && !file.type.startsWith('image/')) {
        return { error: 'Please upload an image file' };
      }

      if (file.size > 5 * 1024 * 1024) {
        return { error: 'Image must be less than 5MB' };
      }

      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `profile_${firebaseUser.uid}_${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `profile_photos/${fileName}`);

      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        profilePhotoUrl: downloadUrl,
        updatedAt: serverTimestamp(),
      });

      setUser({
        ...user,
        profilePhotoUrl: downloadUrl,
      });

      return { url: downloadUrl };
    } catch (error: any) {
      console.error('Upload profile photo error:', error);
      return { error: 'Failed to upload photo. Please try again.' };
    }
  };

  const deleteProfilePhoto = async (): Promise<{ error?: string }> => {
    try {
      if (!user || !firebaseUser) {
        return { error: 'Must be logged in to delete photo' };
      }

      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        profilePhotoUrl: null,
        updatedAt: serverTimestamp(),
      });

      setUser({
        ...user,
        profilePhotoUrl: undefined,
      });

      return {};
    } catch (error: any) {
      console.error('Delete profile photo error:', error);
      return { error: 'Failed to delete photo. Please try again.' };
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
    updateProfile,
    uploadProfilePhoto,
    deleteProfilePhoto,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
