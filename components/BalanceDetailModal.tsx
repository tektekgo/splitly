import React, { useMemo } from 'react';
import type { FinalExpense, User } from '../types';
import { Category } from '../types';
import { CategoryIcon } from './icons';
import { formatCurrency, formatExpenseAmount } from '../utils/currencyFormatter';

interface BalanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  targetUser: User;
  allExpenses: FinalExpense[];
}

const BalanceDetailModal: React.FC<BalanceDetailModalProps> = ({ 
    isOpen, 
    onClose, 
    currentUser, 
    targetUser, 
    allExpenses 
}) => {
  const { transactions, netBalance } = useMemo(() => {
    let balance = 0;
    
    const relevantExpenses = allExpenses
      .filter(expense => {
        const involvesCurrentUser = expense.paidBy === currentUser.id || expense.splits.some(s => s.userId === currentUser.id);
        const involvesTargetUser = expense.paidBy === targetUser.id || expense.splits.some(s => s.userId === targetUser.id);
        return involvesCurrentUser && involvesTargetUser;
      })
      .map(expense => {
        let effect = 0;
        const currentUserSplit = expense.splits.find(s => s.userId === currentUser.id)?.amount || 0;
        const targetUserSplit = expense.splits.find(s => s.userId === targetUser.id)?.amount || 0;
        
        if (expense.paidBy === currentUser.id) {
          effect = targetUserSplit; // Target user owes current user their share
        } else if (expense.paidBy === targetUser.id) {
          effect = -currentUserSplit; // Current user owes target user their share
        }
        balance += effect;
        return { ...expense, effect };
      })
      .filter(item => Math.abs(item.effect) > 0.001) // Only show transactions with a non-zero effect
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

    return { transactions: relevantExpenses, netBalance: balance };
  }, [allExpenses, currentUser.id, targetUser.id]);

  if (!isOpen) return null;

  // Get currency from first expense (all expenses in same group have same currency)
  const currency = allExpenses.length > 0 ? allExpenses[0].currency : 'USD';

  const renderSummary = () => {
    if (Math.abs(netBalance) < 0.01) {
      return <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark">You and {targetUser.name} are settled up.</p>;
    }
    if (netBalance > 0) {
      return <p className="text-lg text-success">{targetUser.name} owes you <span className="font-bold">{formatCurrency(netBalance, currency)}</span>.</p>;
    }
    return <p className="text-lg text-error">You owe {targetUser.name} <span className="font-bold">{formatCurrency(-netBalance, currency)}</span>.</p>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg border border-stone-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border-light dark:border-border-dark">
            <div className="flex items-center gap-4">
                <div className="flex -space-x-4">
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-12 h-12 rounded-full border-2 border-white dark:border-content-dark ring-2 ring-primary"/>
                    <img src={targetUser.avatarUrl} alt={targetUser.name} className="w-12 h-12 rounded-full border-2 border-white dark:border-content-dark"/>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Balance with {targetUser.name}</h2>
                    <div className="mt-1">{renderSummary()}</div>
                </div>
            </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
            {transactions.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">No transactions between you and {targetUser.name} yet.</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {transactions.map(expense => {
                        const isPayment = expense.category === Category.Payment;
                        let text;
                        if (isPayment) {
                            // Backward compatibility: Detect old payment structure (paidBy = recipient, payer in splits)
                            const expenseDate = new Date(expense.expenseDate);
                            const fixDate = new Date('2025-12-21T00:00:00Z');
                            const isOldStructure = expenseDate < fixDate;
                            
                            if (isOldStructure) {
                                // Old structure: paidBy = recipient, payer is in splits
                                const isRecipient = expense.paidBy === currentUser.id;
                                const isPayer = expense.splits.some(s => s.userId === currentUser.id);
                                if (isPayer) {
                                    text = 'You paid';
                                } else if (isRecipient) {
                                    text = `${targetUser.name} paid you`;
                                } else {
                                    text = `${targetUser.name} paid`;
                                }
                            } else {
                                // New structure: paidBy = payer, recipient is in splits
                                const isPayer = expense.paidBy === currentUser.id;
                                const isRecipient = expense.splits.some(s => s.userId === currentUser.id);
                                if (isPayer) {
                                    text = 'You paid';
                                } else if (isRecipient) {
                                    text = `${targetUser.name} paid you`;
                                } else {
                                    text = `${targetUser.name} paid`;
                                }
                            }
                        } else {
                            text = expense.paidBy === currentUser.id ? 'You paid for' : `${targetUser.name} paid for`;
                        }

                        return (
                            <li key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-stone-100 dark:border-gray-600">
                                <div className="flex items-center gap-3">
                                    <CategoryIcon category={expense.category} className="w-8 h-8 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">{expense.description}</p>
                                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                                            {text} <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{formatExpenseAmount(expense)}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {expense.effect > 0 ? (
                                        <p className="font-semibold text-success">You get back</p>
                                    ) : (
                                        <p className="font-semibold text-error">You owe</p>
                                    )}
                                    <p className="font-bold text-lg">{formatCurrency(Math.abs(expense.effect), expense.currency || 'USD')}</p>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
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

export default BalanceDetailModal;