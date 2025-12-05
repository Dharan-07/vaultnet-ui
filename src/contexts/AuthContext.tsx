import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface User {
  id: string;
  email: string;
  name: string;
  walletAddress?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  connectWallet: (walletAddress: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const googleProvider = new GoogleAuthProvider();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result on mount
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const firebaseUser = result.user;
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (!userDoc.exists()) {
          // Create new user document for first-time Google sign-in
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            name: firebaseUser.displayName || '',
            email: firebaseUser.email,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            authProvider: 'google',
          });
        }
        
        // Store login event
        await setDoc(doc(db, 'login', `${firebaseUser.uid}_${Date.now()}`), {
          userId: firebaseUser.uid,
          email: firebaseUser.email,
          loginAt: serverTimestamp(),
          authProvider: 'google',
        });

        // Update last login
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLogin: serverTimestamp(),
        }).catch(() => {});
      }
    }).catch((error) => {
      console.error('Redirect result error:', error);
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: userData.name || firebaseUser.displayName || '',
            walletAddress: userData.walletAddress || undefined,
          });
        } else {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Store login event in login collection
    await setDoc(doc(db, 'login', `${userCredential.user.uid}_${Date.now()}`), {
      userId: userCredential.user.uid,
      email: userCredential.user.email,
      loginAt: serverTimestamp(),
    });

    // Update last login timestamp in users collection
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      lastLogin: serverTimestamp(),
    }).catch(() => {
      // Document might not exist yet, ignore error
    });
  };

  const signUp = async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Store user data in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    setUser({
      id: userCredential.user.uid,
      email,
      name,
    });
  };

  const signInWithGoogle = async () => {
    try {
      // Try popup first
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        // Create new user document for first-time Google sign-in
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          name: firebaseUser.displayName || '',
          email: firebaseUser.email,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          authProvider: 'google',
        });
      }
      
      // Store login event
      await setDoc(doc(db, 'login', `${firebaseUser.uid}_${Date.now()}`), {
        userId: firebaseUser.uid,
        email: firebaseUser.email,
        loginAt: serverTimestamp(),
        authProvider: 'google',
      });

      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: serverTimestamp(),
      }).catch(() => {});
    } catch (error: any) {
      // If popup is blocked or fails, fall back to redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw error;
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const connectWallet = async (walletAddress: string) => {
    if (!user) throw new Error('Must be logged in to connect wallet');
    
    // Store wallet connection event in wallets collection
    await setDoc(doc(db, 'wallets', `${user.id}_${Date.now()}`), {
      userId: user.id,
      email: user.email,
      walletAddress,
      connectedAt: serverTimestamp(),
    });

    // Update wallet address in users collection
    await updateDoc(doc(db, 'users', user.id), {
      walletAddress,
      walletConnectedAt: serverTimestamp(),
    });

    setUser({ ...user, walletAddress });
  };

  const disconnectWallet = async () => {
    if (!user) throw new Error('Must be logged in to disconnect wallet');
    
    // Remove wallet address from Firestore
    await updateDoc(doc(db, 'users', user.id), {
      walletAddress: null,
      walletConnectedAt: null,
    });

    setUser({ ...user, walletAddress: undefined });
  };

  const value = {
    user,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    connectWallet,
    disconnectWallet,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
