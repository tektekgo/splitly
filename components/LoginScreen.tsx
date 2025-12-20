import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      setError(err.message || 'Authentication failed');
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

        {/* Login Form Section */}
        <div className="p-6">

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-2xl text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <motion.input
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-3 bg-surface dark:bg-gray-700 border border-stone-200 dark:border-stone-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-primary text-charcoal dark:text-gray-100"
              required
            />
          )}
          
          <motion.input
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isSignUp ? 0.3 : 0.2 }}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-6 py-3 bg-surface dark:bg-gray-700 border border-stone-200 dark:border-stone-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-primary text-charcoal dark:text-gray-100"
            required
          />
          
          <motion.input
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isSignUp ? 0.4 : 0.3 }}
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-6 py-3 bg-surface dark:bg-gray-700 border border-stone-200 dark:border-stone-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-primary text-charcoal dark:text-gray-100"
            required
          />

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isSignUp ? 0.5 : 0.4 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white font-medium rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-400 transition-colors min-h-12"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </motion.button>
          </form>

          <div className="mt-4 text-center">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </motion.button>
          </div>

          <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200 dark:border-stone-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-sage">Or continue with</span>
          </div>
          </div>

          <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-6 w-full py-3 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-stone-600 text-charcoal dark:text-gray-200 font-medium rounded-full hover:bg-surface dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
            Sign in with Google
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;