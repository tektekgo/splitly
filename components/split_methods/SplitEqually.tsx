import React, { useState, useEffect, useMemo } from 'react';
import type { User, ExpenseSplit } from '../../types';
import { formatCurrency } from '../../utils/currencyFormatter';

interface SplitEquallyProps {
  totalAmount: number;
  members: User[];
  payerId: string;
  currency: string;
  onUpdateSplits: (splits: ExpenseSplit[], error?: string | null) => void;
  initialSplits?: ExpenseSplit[];
}

const SplitEqually: React.FC<SplitEquallyProps> = ({ totalAmount, members, currency, onUpdateSplits, initialSplits }) => {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(() => {
    if (initialSplits && initialSplits.length > 0) {
        return new Set(initialSplits.map(s => s.userId));
    }
    // Start with no members selected - user must explicitly select at least 2 people
    return new Set();
  });

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const amountPerPerson = useMemo(() => {
    if (selectedMembers.size === 0 || totalAmount === 0) return 0;
    return totalAmount / selectedMembers.size;
  }, [totalAmount, selectedMembers.size]);

  useEffect(() => {
    if (selectedMembers.size === 0) {
      onUpdateSplits([], null); // No error - user can save without selecting splits
      return;
    }
    if (selectedMembers.size === 1) {
      onUpdateSplits([], 'To split an expense, select at least 2 people. (Or save without selecting anyone for a personal expense)');
      return;
    }
    const splits = Array.from(selectedMembers).map(userId => ({
      userId,
      amount: amountPerPerson,
    }));
    onUpdateSplits(splits, null);
  }, [selectedMembers, amountPerPerson, onUpdateSplits]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm font-medium text-gray-700 dark:text-gray-300">
        <span>Split between:</span>
        <span className="px-2 py-1 bg-primary text-white rounded-md">
          {selectedMembers.size > 0 ? `${formatCurrency(amountPerPerson, currency)} / person` : `${formatCurrency(0, currency)} / person`}
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
        {members.map(member => (
          <label key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
            <div className="flex items-center">
              <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full mr-3" />
              <span className="text-gray-800 dark:text-gray-200">{member.name}</span>
            </div>
            <input
              type="checkbox"
              checked={selectedMembers.has(member.id)}
              onChange={() => handleToggleMember(member.id)}
              className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-transparent dark:focus:ring-offset-gray-900 text-primary focus:ring-primary"
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default SplitEqually;