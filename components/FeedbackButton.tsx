import React, { useState } from 'react';

const FeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 md:bottom-24 right-4 z-50 bg-primary text-white p-4 md:p-3 rounded-full shadow-xl hover:bg-primary-600 transition-all hover:scale-110"
        aria-label="Send Feedback"
        >     
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  💬 Send Feedback
                </h3>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                  Help me make Splitbi better!
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Quick Feedback Options */}
              <div>
                <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-3">
                  Choose a feedback type:
                </p>
                <div className="space-y-2">
                  
                    <a href="mailto:gsujit@gmail.com?subject=Splitbi Bug Report&body=Please describe the bug you encountered:%0D%0A%0D%0A"
                    className="block w-full text-left px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <span className="text-lg mr-2">🐛</span>
                    <span className="font-medium text-text-primary-light dark:text-text-primary-dark">Report a Bug</span>
                  </a>
                  
                  
                    <a href="mailto:gsujit@gmail.com?subject=Splitbi Feature Request&body=I would love to see this feature:%0D%0A%0D%0A"
                    className="block w-full text-left px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <span className="text-lg mr-2">💡</span>
                    <span className="font-medium text-text-primary-light dark:text-text-primary-dark">Request a Feature</span>
                  </a>
                  
                  
                    <a href="mailto:gsujit@gmail.com?subject=Splitbi General Feedback&body=Here's my feedback about Splitbi:%0D%0A%0D%0A"
                    className="block w-full text-left px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                  >
                    <span className="text-lg mr-2">😊</span>
                    <span className="font-medium text-text-primary-light dark:text-text-primary-dark">General Feedback</span>
                  </a>
                </div>
              </div>

              {/* Google Form Alternative */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
                  Prefer a form?{' '}
                  <a 
                    href="https://forms.gle/1w3Vk6FhrQDppagw5" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Fill out our feedback survey →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;