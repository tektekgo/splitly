import React, { useState, useEffect, useMemo } from 'react';
import type { User, ExpenseSplit } from '../../types';
import { formatCurrency, getCurrencySymbol } from '../../utils/currencyFormatter';

interface SplitUnequallyProps {
  totalAmount: number;
  members: User[];
  currency: string;
  onUpdateSplits: (splits: ExpenseSplit[], error?: string | null) => void;
  initialSplits?: ExpenseSplit[];
}

const SplitUnequally: React.FC<SplitUnequallyProps> = ({ totalAmount, members, currency, onUpdateSplits, initialSplits }) => {
  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
      if (initialSplits) {
          return initialSplits.reduce((acc, split) => {
              acc[split.userId] = String(split.amount);
              return acc;
          }, {} as Record<string, string>);
      }
      return {};
  });

  const handleAmountChange = (memberId: string, value: string) => {
    setAmounts(prev => ({ ...prev, [memberId]: value }));
  };

  const totalSplit = useMemo(() => {
    return Object.values(amounts).reduce((sum, current) => sum + (parseFloat(current) || 0), 0);
  }, [amounts]);

  const remaining = totalAmount - totalSplit;

  useEffect(() => {
    const validSplits: ExpenseSplit[] = [];
    Object.entries(amounts).forEach(([userId, amountStr]) => {
      const amount = parseFloat(amountStr);
      if (!isNaN(amount) && amount > 0) {
        validSplits.push({ userId, amount });
      }
    });

    if (totalAmount > 0 && Math.abs(remaining) > 0.001) {
      onUpdateSplits(validSplits, `The total split (${formatCurrency(totalSplit, currency)}) does not match the expense amount (${formatCurrency(totalAmount, currency)}).`);
    } else {
      onUpdateSplits(validSplits, null);
    }
  }, [amounts, totalAmount, totalSplit, remaining, currency, onUpdateSplits]);

  const getRemainingColor = () => {
    if (Math.abs(remaining) < 0.001) return 'text-success';
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
            <div className="relative rounded-md shadow-sm w-28">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{getCurrencySymbol(currency)}</span>
                </div>
                <input
                    type="number"
                    value={amounts[member.id] || ''}
                    onChange={(e) => handleAmountChange(member.id, e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="block w-full pl-7 pr-2 py-1 bg-transparent border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                />
            </div>
          </div>
        ))}
      </div>
      <div className="text-sm font-medium text-right pt-2 border-t border-border-light dark:border-border-dark">
        <p className="dark:text-gray-300">Total Split: {formatCurrency(totalSplit, currency)}</p>
        <p className={getRemainingColor()}>Remaining: {formatCurrency(remaining, currency)}</p>
      </div>
    </div>
  );
};

export default SplitUnequally;