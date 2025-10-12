import React, { useMemo } from 'react';
import type { FinalExpense, User, SimplifiedDebt } from '../types';
import { simplifyDebts } from '../utils/debtSimplification';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: FinalExpense[];
  members: User[];
  onRecordPayment: (payment: SimplifiedDebt) => void;
}

const SettleUpModal: React.FC<SettleUpModalProps> = ({ isOpen, onClose, expenses, members, onRecordPayment }) => {
  const simplifiedDebts = useMemo(() => {
    const balances = new Map<string, number>();
    members.forEach(member => balances.set(member.id, 0));

    expenses.forEach(expense => {
      const payerInGroup = balances.has(expense.paidBy);
      if (payerInGroup) {
          const payerBalance = balances.get(expense.paidBy) || 0;
          balances.set(expense.paidBy, payerBalance + expense.amount);
          expense.splits.forEach(split => {
            if (balances.has(split.userId)) {
              const splitteeBalance = balances.get(split.userId) || 0;
              balances.set(split.userId, splitteeBalance - split.amount);
            }
          });
      }
    });
    
    return simplifyDebts(balances);
  }, [expenses, members]);

  if (!isOpen) return null;

  const getUserById = (id: string) => members.find(m => m.id === id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-content-light dark:bg-content-dark rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Settle Up Debts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {simplifiedDebts.length === 0 ? (
            <div className="text-center py-8">
                <svg className="mx-auto h-16 w-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="mt-4 text-xl font-medium text-text-primary-light dark:text-text-primary-dark">All Debts Are Settled!</h3>
                <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">There are no outstanding balances in the group.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-center text-text-secondary-light dark:text-text-secondary-dark bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                Here is the simplest way to settle all debts. Record payments as they happen.
              </p>
              <ul className="divide-y divide-border-light dark:divide-border-dark">
                {simplifiedDebts.map((debt, index) => {
                  const fromUser = getUserById(debt.from);
                  const toUser = getUserById(debt.to);
                  if (!fromUser || !toUser) return null;
                  return (
                    <li key={index} className="py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="flex -space-x-2">
                           <img src={fromUser.avatarUrl} alt={fromUser.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800"/>
                           <img src={toUser.avatarUrl} alt={toUser.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800"/>
                        </div>
                        <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                          {fromUser.name.replace(' (You)', '')} <span className="font-normal text-text-secondary-light dark:text-text-secondary-dark">pays</span> {toUser.name.replace(' (You)', '')}
                          <span className="block text-lg font-bold text-primary">${debt.amount.toFixed(2)}</span>
                        </p>
                      </div>
                      <button 
                        onClick={() => onRecordPayment(debt)}
                        className="ml-4 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors"
                      >
                        Paid
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-border-light dark:border-border-dark text-right rounded-b-2xl">
            <button
                onClick={onClose}
                className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettleUpModal;