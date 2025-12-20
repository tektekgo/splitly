import React, { useState } from 'react';
import FeedbackModal from './FeedbackModal';

const FeedbackButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Feedback Button - Positioned relative to content container */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 md:bottom-28 z-50 bg-primary text-white p-3 md:p-2.5 rounded-full shadow-xl hover:bg-primary-600 transition-all hover:scale-110"
        style={{ 
          right: 'clamp(0.75rem, calc((100vw - 28rem) / 2 + 1rem), calc(100vw - 25.5rem))'
        }}
        aria-label="Send Feedback"
      >     
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default FeedbackButton;