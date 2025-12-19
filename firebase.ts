// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// IMPORTANT: Replace this with the configuration object from your Firebase project console.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase config
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
  console.warn('⚠️ Firebase API key is missing. Please check your .env.local file.');
  console.warn('The app will still load, but authentication features will not work.');
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Create a mock app object to prevent crashes
  throw new Error('Firebase configuration is invalid. Please check your .env.local file.');
}
// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const auth = getAuth(app);
// Initialize Google Auth for Capacitor
if (typeof (window as any).Capacitor !== 'undefined') {
  GoogleAuth.initialize({
    clientId: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}