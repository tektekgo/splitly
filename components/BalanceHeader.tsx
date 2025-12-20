import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/currencyFormatter';

interface BalanceHeaderProps {
  balance: number;
  currency: string;
  balanceColor: string;
  balanceDescription: string;
  onAddClick: () => void;
  onSettleClick: () => void;
  onUsersClick: () => void;
}

const BalanceHeader: React.FC<BalanceHeaderProps> = ({ 
  balance, 
  currency, 
  balanceColor, 
  balanceDescription,
  onAddClick,
  onSettleClick,
  onUsersClick
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-primary/8 via-white to-primary/5 dark:from-primary/15 dark:via-gray-700 dark:to-primary/10 px-4 py-4 sm:px-6 sm:py-4 rounded-t-2xl border-b-2 border-primary/20 dark:border-primary/30"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left Half - Balance */}
        <div className="flex flex-col justify-center">
          <div className="text-center md:text-left">
            <div className="relative inline-block">
              <p className={`text-4xl sm:text-5xl font-sans font-extrabold mb-1.5 tracking-tight ${balanceColor}`}>
                {formatCurrency(Math.abs(balance), currency)}
              </p>
              {balance > 0.01 && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
              )}
            </div>
            <p className="text-sm font-medium text-charcoal/80 dark:text-gray-300 mt-1.5">{balanceDescription}</p>
          </div>
        </div>

        {/* Right Half - Quick Actions */}
        <div className="flex flex-col justify-center">
          <div className="grid grid-cols-3 gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={onAddClick}
              className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-gradient-to-br from-primary to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
              title="Add Expense"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs font-bold">Add</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={onSettleClick}
              className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-white dark:bg-gray-700 border-2 border-stone-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 hover:bg-primary/10 dark:hover:bg-primary/20 text-charcoal dark:text-gray-200 rounded-xl transition-all shadow-md hover:shadow-lg"
              title="Settle Up"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold">Settle</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={onUsersClick}
              className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-white dark:bg-gray-700 border-2 border-stone-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 hover:bg-primary/10 dark:hover:bg-primary/20 text-charcoal dark:text-gray-200 rounded-xl transition-all shadow-md hover:shadow-lg"
              title="Manage Users"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-xs font-bold">Users</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BalanceHeader;

