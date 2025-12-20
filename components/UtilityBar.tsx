import React from 'react';
import { motion } from 'framer-motion';

interface UtilityBarProps {
  onFeedbackClick?: () => void;
  onCurrencyConverterClick?: () => void;
  onHelpClick?: () => void;
}

const UtilityBar: React.FC<UtilityBarProps> = ({ onFeedbackClick, onCurrencyConverterClick, onHelpClick }) => {
  return (
    <div className="border-b border-stone-200 dark:border-gray-700 px-4 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs flex-wrap">
        <a 
          href="/install.html" 
          target="_blank"
          className="text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          📱 Install App
        </a>
        <span className="text-stone-300 dark:text-gray-600 hidden sm:inline">•</span>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onFeedbackClick}
          className="text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          💬 Feedback
        </motion.button>
        <span className="text-stone-300 dark:text-gray-600 hidden sm:inline">•</span>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onCurrencyConverterClick}
          className="text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          💱 Currency
        </motion.button>
        <span className="text-stone-300 dark:text-gray-600 hidden sm:inline">•</span>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onHelpClick}
          className="text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
        >
          ❓ Help
        </motion.button>
      </div>
    </div>
  );
};

export default UtilityBar;

