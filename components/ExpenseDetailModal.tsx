import React from 'react';
import type { FinalExpense, User } from '../types';
import { CategoryIcon } from './icons';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: FinalExpense;
  members: User[];
}

const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({ isOpen, onClose, expense, members }) => {
  if (!isOpen) return null;

  const payer = members.find(m => m.id === expense.paidBy);
  const expenseDate = new Date(expense.expenseDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-stone-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center gap-4">
                 <div className="flex-shrink-0 p-3 bg-primary/10 rounded-full">
                     <CategoryIcon category={expense.category} className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{expense.description}</h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{expense.category}</p>
                </div>
            </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-baseline">
                <span className="text-lg text-text-secondary-light dark:text-text-secondary-dark">Amount:</span>
                <span className="text-3xl font-extrabold text-primary">${expense.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-md text-text-secondary-light dark:text-text-secondary-dark">Paid by:</span>
                <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{payer?.name.replace(' (You)', '')}</span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-md text-text-secondary-light dark:text-text-secondary-dark">Date:</span>
                <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">{expenseDate}</span>
            </div>
          
            <div className="pt-4">
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2 border-b pb-2 border-border-light dark:border-border-dark">Split Breakdown</h3>
                <ul className="divide-y divide-border-light dark:divide-border-dark">
                    {expense.splits.map(split => {
                        const member = members.find(m => m.id === split.userId);
                        if (!member) return null;
                        return (
                            <li key={split.userId} className="py-3 flex items-center justify-between">
                                <div className="flex items-center">
                                    <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full mr-3"/>
                                    <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{member.name.replace(' (You)', '')}</span>
                                </div>
                                <span className="font-semibold text-error">${split.amount.toFixed(2)}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-stone-200 dark:border-gray-600 text-right rounded-b-2xl">
            <button
                onClick={onClose}
                className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetailModal;