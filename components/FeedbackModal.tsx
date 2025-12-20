import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { sendFeedbackEmail, type FeedbackData } from '../utils/emailService';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState(currentUser?.email || '');
  const [userName, setUserName] = useState(currentUser?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFeedbackType('general');
      setSubject('');
      setMessage('');
      setUserEmail(currentUser?.email || '');
      setUserName(currentUser?.name || '');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, currentUser]);

  // Cleanup timeout on unmount or when modal closes
  useEffect(() => {
    // Clear timeout when modal closes
    if (!isOpen && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!subject.trim()) {
      setError('Please enter a subject');
      setLoading(false);
      return;
    }

    if (!message.trim()) {
      setError('Please enter your feedback message');
      setLoading(false);
      return;
    }

    try {
      const feedbackData: FeedbackData = {
        type: feedbackType,
        subject: subject.trim(),
        message: message.trim(),
        userEmail: userEmail.trim() || undefined,
        userName: userName.trim() || undefined,
      };

      await sendFeedbackEmail(feedbackData);
      setSuccess(true);
      
      // Close modal after 2 seconds
      // Clear any existing timeout first
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onClose();
        timeoutRef.current = null;
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                💬 Send Feedback
              </h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Help us make Split<span className="text-primary">Bi</span> better!
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                Thank You!
              </h4>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Your feedback has been sent successfully. We appreciate your input!
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm"
                >
                  {error}
                </motion.div>
              )}

              {/* Feedback Type Selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Feedback Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('bug')}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                      feedbackType === 'bug'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-text-primary-light dark:text-text-primary-dark hover:border-red-200 dark:hover:border-red-800'
                    }`}
                  >
                    🐛 Bug
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feature')}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                      feedbackType === 'feature'
                        ? 'bg-primary/10 dark:bg-primary/20 border-primary dark:border-primary-400 text-primary dark:text-primary-300'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-text-primary-light dark:text-text-primary-dark hover:border-primary/50 dark:hover:border-primary/50'
                    }`}
                  >
                    💡 Feature
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('general')}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                      feedbackType === 'general'
                        ? 'bg-primary/10 dark:bg-primary/20 border-primary dark:border-primary-400 text-primary dark:text-primary-300'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-text-primary-light dark:text-text-primary-dark hover:border-primary/50 dark:hover:border-primary/50'
                    }`}
                  >
                    😊 General
                  </button>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="feedback-subject" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  id="feedback-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your feedback"
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-charcoal dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="feedback-message" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide details about your feedback..."
                  rows={5}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-charcoal dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                  required
                />
              </div>

              {/* Optional: User Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="feedback-name" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Your Name (optional)
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-charcoal dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div>
                  <label htmlFor="feedback-email" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                    Your Email (optional)
                  </label>
                  <input
                    id="feedback-email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-charcoal dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !subject.trim() || !message.trim()}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Feedback</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FeedbackModal;
