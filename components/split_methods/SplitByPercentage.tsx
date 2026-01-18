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
      onUpdateSplits([], 'To split an expense, select at least 2 people. (Or save without selecting anyone for a personal expense)');
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

  const isSingleMemberGroup = members.length === 1;

  return (
    <div className="space-y-3">
      {isSingleMemberGroup && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Add more members to this group to split expenses.
          </p>
        </div>
      )}
      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
        {members.map(member => (
          <div key={member.id} className={`flex items-center justify-between p-2 ${isSingleMemberGroup ? 'opacity-50' : ''}`}>
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
                  disabled={isSingleMemberGroup}
                  className="block w-full pl-2 pr-6 py-1 bg-transparent border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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