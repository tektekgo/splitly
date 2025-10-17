import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp } from 'firebase/app';

// Initialize Firebase app for Functions
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

export interface EmailInviteData {
  invitedEmail: string;
  inviterName: string;
  groupName: string;
  inviteUrl: string;
}

/**
 * Send a group invitation email using Firebase Functions
 */
export const sendGroupInviteEmail = async (data: EmailInviteData): Promise<{ success: boolean; messageId?: string; message: string }> => {
  try {
    // Call the Firebase Function
    const sendEmail = httpsCallable(functions, 'sendGroupInviteEmail');
    const result = await sendEmail(data);
    
    console.log('Email sent successfully via Firebase Functions:', result.data);
    
    return {
      success: true,
      messageId: result.data?.messageId,
      message: `Email sent successfully to ${data.invitedEmail}`
    };
  } catch (error: any) {
    console.error('Email sending error:', error);
    
    // Handle Firebase Functions errors
    if (error.code === 'functions/unauthenticated') {
      throw new Error('You must be logged in to send invitations');
    } else if (error.code === 'functions/invalid-argument') {
      throw new Error('Invalid email data provided');
    } else {
      throw new Error(error.message || 'Failed to send invitation email');
    }
  }
};

