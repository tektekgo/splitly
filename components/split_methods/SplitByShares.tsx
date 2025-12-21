import React, { useState, useEffect, useMemo } from 'react';
import type { User, ExpenseSplit } from '../../types';
import { formatCurrency } from '../../utils/currencyFormatter';

interface SplitBySharesProps {
  totalAmount: number;
  members: User[];
  currency: string;
  onUpdateSplits: (splits: ExpenseSplit[], error?: string | null) => void;
  initialSplits?: ExpenseSplit[];
}

const SplitByShares: React.FC<SplitBySharesProps> = ({ totalAmount, members, currency, onUpdateSplits, initialSplits }) => {
  const [shares, setShares] = useState<Record<string, string>>(() => {
    if (initialSplits && totalAmount > 0) {
        // To reverse-engineer shares, we need to find a common divisor.
        // A simple way is to find the smallest split amount and treat it as 1 share.
        // This is an approximation and might not work for all cases, but it's a good start.
        const smallestAmount = Math.min(...initialSplits.map(s => s.amount).filter(a => a > 0));
        if (smallestAmount > 0) {
            return initialSplits.reduce((acc, split) => {
                const shareCount = Math.round(split.amount / smallestAmount);
                acc[split.userId] = String(shareCount);
                return acc;
            }, {} as Record<string, string>);
        }
    }
    return {};
  });

  const handleShareChange = (memberId: string, value: string) => {
    setShares(prev => ({ ...prev, [memberId]: value }));
  };

  const totalShares = useMemo(() => {
    return Object.values(shares).reduce((sum, current) => sum + (parseInt(current, 10) || 0), 0);
  }, [shares]);

  const amountPerShare = useMemo(() => {
    if (totalShares === 0 || totalAmount === 0) return 0;
    return totalAmount / totalShares;
  }, [totalAmount, totalShares]);

  useEffect(() => {
    const validSplits: ExpenseSplit[] = [];
    Object.entries(shares).forEach(([userId, shareStr]) => {
      const shareCount = parseInt(shareStr, 10);
      if (!isNaN(shareCount) && shareCount > 0) {
        validSplits.push({ userId, amount: amountPerShare * shareCount });
      }
    });
    
    if (validSplits.length === 1) {
      onUpdateSplits(validSplits, 'An expense must be split between at least 2 people. There\'s nothing to split if only one person is involved.');
      return;
    }
    
    if (totalShares <= 0 && validSplits.length > 0) {
      onUpdateSplits([], 'Total shares must be greater than zero.');
    } else {
      onUpdateSplits(validSplits, null);
    }

  }, [shares, amountPerShare, totalShares, onUpdateSplits]);

  return (
    <div className="space-y-3">
      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
        {members.map(member => (
          <div key={member.id} className="flex items-center justify-between p-2">
            <div className="flex items-center">
              <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full mr-3" />
              <span className="text-gray-800 dark:text-gray-200">{member.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400 w-24 text-right">
                {formatCurrency(amountPerShare * (parseInt(shares[member.id], 10) || 0), currency)}
              </span>
              <div className="relative rounded-md shadow-sm w-24">
                <input
                  type="number"
                  value={shares[member.id] || ''}
                  onChange={(e) => handleShareChange(member.id, e.target.value)}
                  placeholder="0"
                  step="1"
                  min="0"
                  className="block w-full text-center py-1 bg-transparent border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
       <div className="text-sm font-medium text-right pt-2 border-t border-border-light dark:border-border-dark">
        <p className="dark:text-gray-300">Total Shares: {totalShares}</p>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">Value per share: {formatCurrency(amountPerShare, currency)}</p>
      </div>
    </div>
  );
};

export default SplitByShares;