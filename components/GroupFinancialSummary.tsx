import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { FinalExpense, Group } from '../types';
import { Category } from '../types';
import { formatCurrency } from '../utils/currencyFormatter';

interface GroupFinancialSummaryProps {
  expenses: FinalExpense[];
  group: Group;
  balances: Map<string, number>;
}

const GroupFinancialSummary: React.FC<GroupFinancialSummaryProps> = ({ expenses, group, balances }) => {
  const stats = useMemo(() => {
    // Filter expenses for this group and deduplicate by ID to ensure each expense is counted only once
    const groupExpenses = expenses.filter(e => e.groupId === group.id);
    const uniqueExpenses = new Map<string, FinalExpense>();
    groupExpenses.forEach(expense => {
      // Only keep the first occurrence of each expense ID (most recent will be first after sorting)
      if (!uniqueExpenses.has(expense.id)) {
        uniqueExpenses.set(expense.id, expense);
      }
    });
    const deduplicatedExpenses = Array.from(uniqueExpenses.values());
    
    // Total Group Expense (all unique expenses, including payments)
    const totalGroupExpense = deduplicatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Total Shared Expense (unique expenses with 2+ people in splits)
    const totalSharedExpense = deduplicatedExpenses
      .filter(exp => exp.splits && exp.splits.length >= 2)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Total Settled (unique payment expenses)
    const totalSettled = deduplicatedExpenses
      .filter(exp => exp.category === Category.Payment)
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    // Balance to be Settled (sum of all negative balances, which represents what people owe)
    const balanceToBeSettled = Array.from(balances.values())
      .filter(balance => balance < 0)
      .reduce((sum, balance) => sum + Math.abs(balance), 0);
    
    return {
      totalGroupExpense,
      totalSharedExpense,
      totalSettled,
      balanceToBeSettled,
    };
  }, [expenses, group.id, balances]);

  const statItems = [
    {
      label: 'Total Group Expense',
      value: stats.totalGroupExpense,
      description: 'All expenses entered',
      color: 'text-charcoal dark:text-gray-100',
      bgColor: 'bg-white dark:bg-gray-700',
    },
    {
      label: 'Total Shared Expense',
      value: stats.totalSharedExpense,
      description: 'Split between 2+ people',
      color: 'text-primary dark:text-primary-300',
      bgColor: 'bg-primary/5 dark:bg-primary/10',
    },
    {
      label: 'Total Settled',
      value: stats.totalSettled,
      description: 'Payments recorded',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Balance to Settle',
      value: stats.balanceToBeSettled,
      description: 'Outstanding debts',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="px-4 py-3 sm:px-6 sm:py-3 bg-white dark:bg-gray-700 border-t-2 border-stone-200 dark:border-gray-600"
    >
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-base sm:text-lg font-sans font-extrabold text-charcoal dark:text-gray-100 tracking-tight">
          Financial Summary
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.03 }}
            className={`${item.bgColor} rounded-lg p-2.5 border border-stone-200 dark:border-gray-600 hover:shadow-md transition-shadow`}
          >
            <p className="text-xs font-semibold text-sage dark:text-gray-400 mb-1 leading-tight">
              {item.label}
            </p>
            <p className={`text-base sm:text-lg font-extrabold ${item.color} leading-tight`}>
              {formatCurrency(item.value, group.currency)}
            </p>
            <p className="text-[10px] sm:text-xs text-sage dark:text-gray-500 mt-0.5 leading-tight">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default GroupFinancialSummary;

