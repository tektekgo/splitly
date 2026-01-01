import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/currencyFormatter';

interface BalanceHeaderProps {
  balance: number;
  currency: string;
  balanceColor: string;
  balanceDescription: string;
  onAddMemberClick?: () => void;
  onSettleClick: () => void;
}

const BalanceHeader: React.FC<BalanceHeaderProps> = ({
  balance,
  currency,
  balanceColor,
  balanceDescription,
  onAddMemberClick,
  onSettleClick
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gradient-to-br from-primary/8 via-white to-primary/5 dark:from-primary/15 dark:via-gray-700 dark:to-primary/10 px-4 py-3 sm:px-6 sm:py-3 rounded-t-2xl border-b-2 border-primary/20 dark:border-primary/30"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left Half - Balance */}
        <div className="flex flex-col justify-center">
          <div className="text-center md:text-left">
            <div className="relative inline-block">
              <p className={`text-2xl sm:text-3xl font-sans font-extrabold mb-1 tracking-tight ${balanceColor}`}>
                {formatCurrency(Math.abs(balance), currency)}
              </p>
              {balance > 0.01 && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-charcoal/80 dark:text-gray-300 mt-1">{balanceDescription}</p>
          </div>
        </div>

        {/* Right Half - Quick Actions */}
        <div className="flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-2">
            {onAddMemberClick && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={onAddMemberClick}
                className="filter flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-purple-400/30"
                title="Invite Member"
              >
                <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="text-[10px] font-bold leading-tight text-center drop-shadow-sm">Invite Member</span>
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
              onClick={onSettleClick}
              className="filter flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all border border-amber-400/30"
              title="Settle Up"
            >
              <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-[10px] font-bold leading-tight text-center drop-shadow-sm">Settle Up</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BalanceHeader;

