import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch or create user document
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setCurrentUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
        } else {
          // Create new user document
          const newUser: Omit<User, 'id'> = {
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || undefined,
            avatarUrl: firebaseUser.photoURL || `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
            authType: firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newUser);
          setCurrentUser({ id: firebaseUser.uid, ...newUser });
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /*const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };*/
  const signInWithGoogle = async () => {
    if (typeof (window as any).Capacitor !== 'undefined') {
      // Use native Google Auth plugin
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      
      // Initialize GoogleAuth (ADD THIS)
      await GoogleAuth.initialize({
        clientId: '116751855385-jui3nnb6f763ur1gkank103h783427t1.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      await signInWithCredential(auth, credential);
    } else {
      // Use web popup (PWA/browser)
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document
    const newUser: Omit<User, 'id'> = {
      name,
      email: email,
      avatarUrl: `https://i.pravatar.cc/150?u=${user.uid}`,
      authType: 'email',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', user.uid), newUser);
  };

  const resetPassword = async (email: string) => {
    // Configure actionCodeSettings to handle password reset on localhost
    // For localhost, we need to set handleCodeInApp to true and handle it ourselves
    const actionCodeSettings = {
      // URL you want to redirect back to after password reset
      // For localhost development, use the current origin
      url: window.location.origin,
      // Set to true to handle the code in the app (required for localhost)
      handleCodeInApp: true,
    };
    
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    firebaseUser,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};