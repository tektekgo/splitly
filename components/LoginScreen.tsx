import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import VersionFooter from './VersionFooter';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../firebase';

const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetCode, setResetCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Check for password reset code or invite link from URL or sessionStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const actionCode = urlParams.get('oobCode');
    const inviteId = urlParams.get('invite');
    
    if (mode === 'resetPassword' && actionCode) {
      // Verify the code is valid
      verifyPasswordResetCode(auth, actionCode)
        .then((email) => {
          setResetCode(actionCode);
          setEmail(email);
          setShowPasswordReset(true);
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((err: any) => {
          setError('Invalid or expired reset link. Please request a new one.');
          console.error('Password reset code verification failed:', err);
        });
    } else if (inviteId) {
      // Store invite ID for processing after signup/login
      sessionStorage.setItem('pendingInviteId', inviteId);
      setSuccess('You have a group invite! Sign up or log in to accept it.');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Check sessionStorage (set by App.tsx)
      const storedCode = sessionStorage.getItem('passwordResetCode');
      if (storedCode) {
        verifyPasswordResetCode(auth, storedCode)
          .then((email) => {
            setResetCode(storedCode);
            setEmail(email);
            setShowPasswordReset(true);
            sessionStorage.removeItem('passwordResetCode');
          })
          .catch((err: any) => {
            setError('Invalid or expired reset link. Please request a new one.');
            sessionStorage.removeItem('passwordResetCode');
            console.error('Password reset code verification failed:', err);
          });
      }
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your name');
          return;
        }
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      // Check if user doesn't exist - suggest signing up instead
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('No account found with this email. Please sign up instead, or check if you received an invite link.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await resetPassword(email);
      setResetEmailSent(true);
      setSuccess('Password reset email sent! Check your inbox for instructions.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-primary/5 to-cream dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-stone-100 dark:border-stone-700 w-full max-w-sm overflow-hidden"
      >
        {/* Hero Section - Mobile-First */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative bg-gradient-to-br from-primary via-[#1E3450] to-[#1E3450] dark:from-primary-800 dark:via-[#1E3450] dark:to-[#1E3450] p-6 pb-6"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-300/20 rounded-full -ml-12 -mb-12 blur-xl"></div>
          
          <div className="relative z-10">
            {/* Logo and Title */}
            <div className="flex flex-col items-center mb-4">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-3 mb-3 shadow-lg ring-2 ring-white/30"
              >
                <img 
                  src="/splitBi-logo-notext-svg.svg" 
                  alt="SplitBi Logo" 
                  className="h-16 w-16"
                />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-extrabold text-white tracking-tight mb-1"
              >
                Split<span className="text-primary-200">Bi</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-white/90 font-medium mb-3"
              >
                Splitting expenses, made easy
              </motion.p>
              
              {/* Payment Integration Feature */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/15 dark:bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
              >
                <span className="text-[10px] text-white/80 font-medium">Pay directly via</span>
                <div className="flex items-center gap-1.5">
                  {/* Venmo Logo - Blue background with white V */}
                  <div className="flex items-center justify-center w-6 h-6 bg-[#3D95CE] rounded" title="Venmo">
                    <span className="text-[10px] font-bold text-white" style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '-0.5px' }}>V</span>
                  </div>
                  {/* Zelle Logo - Purple background with white Z */}
                  <div className="flex items-center justify-center w-6 h-6 bg-[#6D1ED4] rounded" title="Zelle">
                    <span className="text-[10px] font-bold text-white" style={{ fontFamily: 'Arial, sans-serif', letterSpacing: '-0.5px' }}>Z</span>
                  </div>
                  {/* Cash App Logo - Green background with white $ */}
                  <div className="flex items-center justify-center w-6 h-6 bg-[#00D632] rounded" title="Cash App">
                    <span className="text-[10px] font-bold text-white" style={{ fontFamily: 'Arial, sans-serif' }}>$</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bi-Suite Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="px-4 py-2 bg-[#1E3450]/40 dark:bg-[#1E3450]/50 backdrop-blur-sm rounded-full border border-white/30 shadow-lg">
                <p className="text-xs font-semibold text-white text-center">
                  Part of <span className="font-bold">Bi-Suite Applications</span>
                </p>
              </div>
              
              {/* Creator Credit and Link - Same Line */}
              <div className="flex items-center gap-2 text-[10px] text-white/70 mt-2">
                <span>Created by <span className="font-medium text-white/90">Sujit</span></span>
                <span className="text-white/50">•</span>
                <a 
                  href="https://www.ai-focus.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/70 hover:text-white/90 transition-colors underline underline-offset-2"
                >
                  ai-focus.org
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Login Form Section - Elegant Card Style */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-white via-stone-50/50 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-800">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-2xl text-sm shadow-sm flex items-start gap-3"
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 rounded-2xl text-sm shadow-sm flex items-start gap-3"
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </motion.div>
          )}

          {showPasswordReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              {resetCode ? (
                <>
                  {/* Show password reset form when code is present */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label htmlFor="reset-email-display" className="block text-sm font-semibold text-charcoal dark:text-gray-200">
                      Email Address
                    </label>
                    <input
                      id="reset-email-display"
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-6 py-3.5 bg-gray-100 dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-2xl text-charcoal dark:text-gray-100 opacity-75 cursor-not-allowed"
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label htmlFor="new-password" className="block text-sm font-semibold text-charcoal dark:text-gray-200">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-sage dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password (min 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        required
                      />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label htmlFor="confirm-password" className="block text-sm font-semibold text-charcoal dark:text-gray-200">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-sage dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        required
                      />
                    </div>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Show email input when requesting reset */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label htmlFor="reset-email" className="block text-sm font-semibold text-charcoal dark:text-gray-200">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-sage dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                        required
                      />
                    </div>
                    <p className="text-xs text-sage dark:text-gray-500 mt-1">
                      We'll send you a link to reset your password
                    </p>
                  </motion.div>
                </>
              )}

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                type="submit"
                disabled={loading || (resetEmailSent && !resetCode)}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{resetCode ? 'Resetting...' : 'Sending...'}</span>
                  </>
                ) : resetEmailSent && !resetCode ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Email Sent!</span>
                  </>
                ) : resetCode ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Reset Password</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Send Reset Link</span>
                  </>
                )}
              </motion.button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setResetEmailSent(false);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm font-medium text-primary hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleEmailAuth} className="space-y-5">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
              >
                <label htmlFor="name" className="block text-sm font-semibold text-charcoal dark:text-gray-200">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-sage dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    required
                  />
                </div>
              </motion.div>
            )}
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isSignUp ? 0.3 : 0.2 }}
              className="space-y-2"
            >
              <label htmlFor="email" className="block text-sm font-semibold text-charcoal dark:text-gray-200">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-sage dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isSignUp ? 0.4 : 0.3 }}
              className="space-y-2"
            >
              <label htmlFor="password" className="block text-sm font-semibold text-charcoal dark:text-gray-200">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-sage dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-charcoal dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-sage dark:text-gray-500">Must be at least 6 characters long</p>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordReset(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-xs font-medium text-primary hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isSignUp ? 0.5 : 0.4 }}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {isSignUp ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>Create Account</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign In</span>
                    </>
                  )}
                </>
              )}
            </motion.button>
          </form>
          )}

          {!showPasswordReset && (
          <div className="mt-6 text-center">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-medium text-primary hover:text-primary-700 dark:hover:text-primary-300 transition-colors inline-flex items-center gap-1"
            >
              {isSignUp ? (
                <>
                  <span>Already have an account?</span>
                  <span className="font-semibold underline">Sign in</span>
                </>
              ) : (
                <>
                  <span>Don't have an account?</span>
                  <span className="font-semibold underline">Sign up</span>
                </>
              )}
            </motion.button>
          </div>
          )}

          {!showPasswordReset && (
            <>
              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-stone-200 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gradient-to-b from-white via-stone-50/50 to-white dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 text-sage dark:text-gray-400 font-medium">Or continue with</span>
                </div>
              </div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.02 }}
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-6 w-full py-3.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 text-charcoal dark:text-gray-200 font-semibold rounded-2xl hover:bg-stone-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-gray-500 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Sign in with Google</span>
              </motion.button>
            </>
          )}

          {/* Version Footer */}
          <VersionFooter className="mt-8 pt-4 border-t border-stone-100 dark:border-gray-700" />
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;