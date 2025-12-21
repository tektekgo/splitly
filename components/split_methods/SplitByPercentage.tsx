import React, { useState, useEffect, useMemo } from 'react';
import type { User, ExpenseSplit } from '../../types';
import { formatCurrency } from '../../utils/currencyFormatter';

interface SplitByPercentageProps {
  totalAmount: number;
  members: User[];
  currency: string;
  onUpdateSplits: (splits: ExpenseSplit[], error?: string | null) => void;
  initialSplits?: ExpenseSplit[];
}

const SplitByPercentage: React.FC<SplitByPercentageProps> = ({ totalAmount, members, currency, onUpdateSplits, initialSplits }) => {
  const [percentages, setPercentages] = useState<Record<string, string>>(() => {
    if (initialSplits && totalAmount > 0) {
        return initialSplits.reduce((acc, split) => {
            const percentage = (split.amount / totalAmount) * 100;
            acc[split.userId] = percentage.toFixed(2);
            return acc;
        }, {} as Record<string, string>);
    }
    return {};
  });

  const handlePercentageChange = (memberId: string, value: string) => {
    setPercentages(prev => ({ ...prev, [memberId]: value }));
  };
  
  const totalPercentage = useMemo(() => {
    return Object.values(percentages).reduce((sum, current) => sum + (parseFloat(current) || 0), 0);
  }, [percentages]);

  useEffect(() => {
    const validSplits: ExpenseSplit[] = [];
    Object.entries(percentages).forEach(([userId, percentageStr]) => {
      const percentage = parseFloat(percentageStr);
      if (!isNaN(percentage) && percentage > 0) {
        validSplits.push({ userId, amount: totalAmount * (percentage / 100) });
      }
    });

    if (validSplits.length === 1) {
      onUpdateSplits(validSplits, 'An expense must be split between at least 2 people. There\'s nothing to split if only one person is involved.');
      return;
    }

    if (totalAmount > 0 && Math.abs(totalPercentage - 100) > 0.001) {
       onUpdateSplits(validSplits, `Percentages must add up to 100%. Current total: ${totalPercentage.toFixed(2)}%`);
    } else {
       onUpdateSplits(validSplits, null);
    }
  }, [percentages, totalAmount, totalPercentage, onUpdateSplits]);
  
  const getPercentageColor = () => {
    if (Math.abs(totalPercentage - 100) < 0.001) return 'text-success';
    return 'text-error';
  }

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
                {formatCurrency(totalAmount * (parseFloat(percentages[member.id]) || 0) / 100, currency)}
              </span>
              <div className="relative rounded-md shadow-sm w-24">
                <input
                  type="number"
                  value={percentages[member.id] || ''}
                  onChange={(e) => handlePercentageChange(member.id, e.target.value)}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  max="100"
                  className="block w-full pl-2 pr-6 py-1 bg-transparent border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                />
                 <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-sm font-medium text-right pt-2 border-t border-border-light dark:border-border-dark">
        <p className={getPercentageColor()}>Total: {totalPercentage.toFixed(2)}%</p>
      </div>
    </div>
  );
};

export default SplitByPercentage;