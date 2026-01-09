import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

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
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from profiles table
  const fetchProfile = async (userId: string, userEmail: string, emailConfirmed: boolean) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      setUser({
        id: userId,
        email: userEmail,
        name: profile.name || '',
        walletAddress: profile.wallet_address || undefined,
        emailVerified: emailConfirmed,
      });
    } else {
      setUser({
        id: userId,
        email: userEmail,
        name: '',
        emailVerified: emailConfirmed,
      });
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(
              currentSession.user.id,
              currentSession.user.email || '',
              !!currentSession.user.email_confirmed_at
            );
          }, 0);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      
      if (existingSession?.user) {
        fetchProfile(
          existingSession.user.id,
          existingSession.user.email || '',
          !!existingSession.user.email_confirmed_at
        );
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string; remainingAttempts?: number }> => {
    try {
      // Validate input
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        return { error: emailResult.error.errors[0].message };
      }

      // Call rate-limited auth edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, action: 'signin' }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return { 
          error: result.error || 'Sign in failed', 
          remainingAttempts: result.remainingAttempts 
        };
      }

      // Set the session from the response
      if (result.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
      }

      return {};
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'An unexpected error occurred' };
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

      // Call rate-limited auth edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, action: 'signup' }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Sign up failed' };
      }

      // Update profile with name
      if (result.user?.id) {
        await supabase
          .from('profiles')
          .update({ name })
          .eq('id', result.user.id);
      }

      if (result.requiresEmailVerification) {
        return { requiresEmailVerification: true };
      }

      // Set the session if available (auto-confirm enabled)
      if (result.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
      }

      return {};
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        return { error: emailResult.error.errors[0].message };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/signin`,
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const connectWallet = async (walletAddress: string) => {
    if (!user) throw new Error('Must be logged in to connect wallet');

    const { error } = await supabase
      .from('profiles')
      .update({ wallet_address: walletAddress })
      .eq('id', user.id);

    if (error) throw error;

    setUser({ ...user, walletAddress });
  };

  const disconnectWallet = async () => {
    if (!user) throw new Error('Must be logged in to disconnect wallet');

    const { error } = await supabase
      .from('profiles')
      .update({ wallet_address: null })
      .eq('id', user.id);

    if (error) throw error;

    setUser({ ...user, walletAddress: undefined });
  };

  const resendVerificationEmail = async (): Promise<{ error?: string }> => {
    try {
      if (!session?.user?.email) {
        return { error: 'No email address found' };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: session.user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Resend verification error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user && !!session,
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
