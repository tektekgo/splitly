import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { FinalExpense, User, SimplifiedDebt } from '../types';
import { simplifyDebts } from '../utils/debtSimplification';
import PaymentModal from './PaymentModal';
import { formatCurrency } from '../utils/currencyFormatter';

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: FinalExpense[];
  members: User[];
  currency: string;
  currentUserId: string;
  onRecordPayment: (payment: SimplifiedDebt) => void;
}

const SettleUpModal: React.FC<SettleUpModalProps> = ({ isOpen, onClose, expenses, members, currency, currentUserId, onRecordPayment }) => {
  const [selectedPayment, setSelectedPayment] = useState<SimplifiedDebt | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const simplifiedDebts = useMemo(() => {
    const balances = new Map<string, number>();
    members.forEach(member => balances.set(member.id, 0));

    expenses.forEach(expense => {
      const payerInGroup = balances.has(expense.paidBy);
      // Only process expenses that have splits with 2+ people - expenses without proper splits shouldn't affect balances
      // Exception: Payment expenses (category === 'Payment') represent money transfers and should always be processed
      const isPayment = expense.category === 'Payment';
      if (payerInGroup && expense.splits && (isPayment ? expense.splits.length >= 1 : expense.splits.length >= 2)) {
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
    
    const allDebts = simplifyDebts(balances);
    
    // Filter to show only debts where current user is involved (either owes or is owed)
    return allDebts.filter(debt => debt.from === currentUserId || debt.to === currentUserId);
  }, [expenses, members, currentUserId]);

  if (!isOpen) return null;

  const getUserById = (id: string) => members.find(m => m.id === id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-stone-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
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
                Your debts in this group. Record payments as they happen.
              </p>
              
              {/* Separate "You Owe" and "You Are Owed" sections */}
              {(() => {
                const debtsYouOwe = simplifiedDebts.filter(debt => debt.from === currentUserId);
                const debtsOwedToYou = simplifiedDebts.filter(debt => debt.to === currentUserId);
                
                return (
                  <>
                    {/* You Owe Section */}
                    {debtsYouOwe.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                          You Owe
                        </h3>
                        <ul className="divide-y divide-border-light dark:divide-border-dark">
                          {debtsYouOwe.map((debt, index) => {
                            const fromUser = getUserById(debt.from);
                            const toUser = getUserById(debt.to);
                            if (!fromUser || !toUser) return null;
                            
                            // Check if recipient has payment info set up
                            const recipientPaymentInfo = toUser.paymentInfo || {};
                            const hasPaymentMethods = !!(recipientPaymentInfo.venmo || recipientPaymentInfo.zelle || recipientPaymentInfo.cashApp);
                            
                            return (
                              <li key={`owe-${index}`} className="py-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3 text-sm">
                                  <div className="flex -space-x-2">
                                     <img src={fromUser.avatarUrl} alt={fromUser.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800"/>
                                     <img src={toUser.avatarUrl} alt={toUser.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800"/>
                                  </div>
                                  <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                                    You <span className="font-normal text-text-secondary-light dark:text-text-secondary-dark">pay</span> {toUser.name.replace(' (You)', '')}
                                    <span className="block text-lg font-bold text-orange-600 dark:text-orange-400">{formatCurrency(debt.amount, currency)}</span>
                                    {!hasPaymentMethods && (
                                      <span className="block text-xs text-sage dark:text-gray-400 mt-0.5">
                                        No payment info set up
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setSelectedPayment(debt);
                                      setIsPaymentModalOpen(true);
                                    }}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors ${
                                      hasPaymentMethods 
                                        ? 'text-white bg-primary hover:bg-primary-700' 
                                        : 'text-sage dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                    title={hasPaymentMethods ? 'Pay via Venmo, Zelle, or Cash App' : 'Recipient needs to add payment info in Profile'}
                                  >
                                    Pay
                                  </motion.button>
                                  <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onRecordPayment(debt)}
                                    className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors"
                                  >
                                    Mark As Paid
                                  </motion.button>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {/* You Are Owed Section */}
                    {debtsOwedToYou.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-primary dark:text-primary-400 uppercase tracking-wide">
                          You Are Owed
                        </h3>
                        <ul className="divide-y divide-border-light dark:divide-border-dark">
                          {debtsOwedToYou.map((debt, index) => {
                            const fromUser = getUserById(debt.from);
                            const toUser = getUserById(debt.to);
                            if (!fromUser || !toUser) return null;
                            
                            return (
                              <li key={`owed-${index}`} className="py-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3 text-sm">
                                  <div className="flex -space-x-2">
                                     <img src={fromUser.avatarUrl} alt={fromUser.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800"/>
                                     <img src={toUser.avatarUrl} alt={toUser.name} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800"/>
                                  </div>
                                  <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                                    {fromUser.name.replace(' (You)', '')} <span className="font-normal text-text-secondary-light dark:text-text-secondary-dark">pays</span> You
                                    <span className="block text-lg font-bold text-primary dark:text-primary-400">{formatCurrency(debt.amount, currency)}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onRecordPayment(debt)}
                                    className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors"
                                    title="Mark as received"
                                  >
                                    Mark As Paid
                                  </motion.button>
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-stone-200 dark:border-gray-600 text-right rounded-b-2xl">
            <button
                onClick={onClose}
                className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            >
                Done
            </button>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPayment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPayment(null);
          }}
          fromUser={getUserById(selectedPayment.from)!}
          toUser={getUserById(selectedPayment.to)!}
          amount={selectedPayment.amount}
          currency={currency}
          onMarkAsPaid={() => {
            onRecordPayment(selectedPayment);
            setIsPaymentModalOpen(false);
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
};

export default SettleUpModal;