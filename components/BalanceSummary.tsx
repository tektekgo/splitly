import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { FinalExpense, Group, User } from '../types';
import { ChevronRightIcon, CogIcon, ExportIcon } from './icons';
import { formatCurrency } from '../utils/currencyFormatter';


interface BalanceSummaryProps {
    expenses: FinalExpense[];
    group: Group;
    members: User[];
    currentUserId: string;
    onSettleUpClick: () => void;
    onViewDetail: (user: User) => void;
    onManageGroupClick: () => void;
    onExportClick: () => void;
}

const BalanceItem: React.FC<{ user: User; balance: number; currentUserId: string; currency: string; onViewDetail: (user: User) => void; }> = ({ user, balance, currentUserId, currency, onViewDetail }) => {
    const isCurrentUser = user.id === currentUserId;

    const balanceText = Math.abs(balance) < 0.01 
        ? 'is settled up' 
        : balance > 0 
        ? `gets back ${formatCurrency(balance, currency)}` 
        : `owes ${formatCurrency(-balance, currency)}`;
    
    const textColor = Math.abs(balance) < 0.01 ? 'text-sage dark:text-text-secondary-dark' : balance > 0 ? 'text-primary' : 'text-orange-500';

    const statusBadgeColor = Math.abs(balance) < 0.01 
        ? 'bg-stone-100 dark:bg-gray-600/80 text-sage dark:text-gray-300' 
        : balance > 0 
        ? 'bg-teal-light dark:bg-primary/30 text-primary dark:text-primary-200' 
        : 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';

    return (
        <motion.button 
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onViewDetail(user)}
            disabled={isCurrentUser}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white dark:bg-gray-700 hover:bg-primary/5 dark:hover:bg-gray-600 disabled:hover:bg-white dark:disabled:hover:bg-gray-700 disabled:cursor-default transition-all duration-200 group border-2 border-stone-200 dark:border-gray-600 shadow-sm hover:shadow-md"
        >
            <div className="flex items-center gap-2.5">
                <div className="relative">
                    <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full ring-1 ring-stone-200 dark:ring-gray-500 group-hover:ring-primary/50 dark:group-hover:ring-primary-400/50 transition-all"/>
                    {Math.abs(balance) > 0.01 && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${balance > 0 ? 'bg-primary' : 'bg-orange-500'}`}></div>
                    )}
                </div>
                <div className="text-left">
                    <span className="text-base font-extrabold text-charcoal dark:text-gray-100 block">{user.name.replace(' (You)', '')}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusBadgeColor} inline-block mt-1`}>
                        {Math.abs(balance) < 0.01 ? 'Settled' : balance > 0 ? 'Owed' : 'Owes'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-base font-extrabold ${textColor}`}>{balanceText}</span>
                {!isCurrentUser && <ChevronRightIcon className="w-5 h-5 text-sage group-hover:text-primary dark:group-hover:text-primary-300 transition-colors" />}
            </div>
        </motion.button>
    );
};


const BalanceSummary: React.FC<BalanceSummaryProps> = ({ expenses, group, members, currentUserId, onSettleUpClick, onViewDetail, onManageGroupClick, onExportClick }) => {
    const balances = useMemo(() => {
        if (!members) return new Map();
        const memberBalances = new Map<string, number>();
        members.forEach(member => {
            memberBalances.set(member.id, 0);
        });

        // Deduplicate expenses by ID first
        const uniqueExpenses = new Map<string, FinalExpense>();
        expenses.forEach(expense => {
          if (!uniqueExpenses.has(expense.id)) {
            uniqueExpenses.set(expense.id, expense);
          }
        });
        const deduplicatedExpenses = Array.from(uniqueExpenses.values());

        deduplicatedExpenses.forEach(expense => {
            // Only consider expenses relevant to the current group's members
            // Regular expenses need 2+ people in splits. Payment expenses need 1 (payer is paidBy, recipient is in splits)
            const payerInGroup = memberBalances.has(expense.paidBy);
            const isPayment = expense.category === 'Payment';
            if (payerInGroup && expense.splits && (isPayment ? expense.splits.length >= 1 : expense.splits.length >= 2)) {
                if (isPayment) {
                    // Backward compatibility: Detect old payment structure (paidBy = recipient, payer in splits)
                    // Old structure: expenseDate before 2025-12-21 (when we fixed the semantic inconsistency)
                    const expenseDate = new Date(expense.expenseDate);
                    const fixDate = new Date('2025-12-21T00:00:00Z');
                    const isOldStructure = expenseDate < fixDate;
                    
                    if (isOldStructure) {
                        // Old structure: paidBy = recipient, payer is in splits
                        // Recipient (paidBy) balance INCREASES, payer (in splits) balance DECREASES
                        const recipientBalance = memberBalances.get(expense.paidBy) || 0;
                        memberBalances.set(expense.paidBy, recipientBalance + expense.amount);
                        expense.splits.forEach(split => {
                            if (memberBalances.has(split.userId)) {
                                const payerBalance = memberBalances.get(split.userId) || 0;
                                memberBalances.set(split.userId, payerBalance - split.amount);
                            }
                        });
                    } else {
                        // New structure: paidBy = payer, recipient is in splits
                        // Payer (paidBy) balance DECREASES, recipient (in splits) balance INCREASES
                        const payerBalance = memberBalances.get(expense.paidBy) || 0;
                        memberBalances.set(expense.paidBy, payerBalance - expense.amount);
                        expense.splits.forEach(split => {
                            if (memberBalances.has(split.userId)) {
                                const recipientBalance = memberBalances.get(split.userId) || 0;
                                memberBalances.set(split.userId, recipientBalance + split.amount);
                            }
                        });
                    }
                } else {
                    // Regular expense: payer (paidBy) balance INCREASES, split participants balance DECREASES
                    const payerBalance = memberBalances.get(expense.paidBy) || 0;
                    memberBalances.set(expense.paidBy, payerBalance + expense.amount);
                    expense.splits.forEach(split => {
                        if (memberBalances.has(split.userId)) {
                            const splitteeBalance = memberBalances.get(split.userId) || 0;
                            memberBalances.set(split.userId, splitteeBalance - split.amount);
                        }
                    });
                }
            }
        });
        return memberBalances;
    }, [expenses, members]);
    
    if (!group) {
        return null;
    }

    const currentUserBalance = balances.get(currentUserId) || 0;
    const totalDebt = useMemo(() => {
        return Array.from(balances.values()).reduce((sum: number, balance: number) => {
            return sum + (balance < 0 ? Math.abs(balance) : 0);
        }, 0);
    }, [balances]);
    
    let balanceColor = 'text-charcoal dark:text-text-primary-dark';
    let balanceDescription = 'You are all settled up.';
    if (currentUserBalance > 0.01) {
        balanceColor = 'text-primary';
        balanceDescription = 'Overall, you are owed';
    } else if (currentUserBalance < -0.01) {
        balanceColor = 'text-orange-500';
        balanceDescription = 'Overall, you owe';
    }
    const formattedBalance = formatCurrency(Math.abs(currentUserBalance), group.currency);

    return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface dark:bg-gray-800 rounded-2xl overflow-hidden border border-stone-100 dark:border-gray-700 shadow-sm"
        >
            <div className="px-6 py-5 flex justify-between items-center bg-gradient-to-r from-primary/10 to-white dark:from-primary/15 dark:to-gray-700 border-b-2 border-primary/20 dark:border-primary/30">
                 <div>
                    <p className="text-xs text-primary dark:text-primary-300 uppercase tracking-widest mb-1 font-bold">
                      Members
                    </p>
                    <p className="text-3xl font-sans font-extrabold text-charcoal dark:text-gray-100 tracking-tight">{members.length}</p>
                 </div>
                 <div className="flex gap-2">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={onManageGroupClick}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-stone-600 to-stone-700 dark:from-gray-600 dark:to-gray-700 hover:from-stone-700 hover:to-stone-800 dark:hover:from-gray-700 dark:hover:to-gray-800 rounded-full shadow-md transition-all"
                        aria-label={`Manage current group: ${group.name}`}
                        title={`Manage current group: ${group.name}`}
                    >
                        <CogIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Manage</span>
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={onExportClick}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-primary to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-full shadow-md transition-all"
                        aria-label="Export to CSV"
                    >
                        <ExportIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </motion.button>
                </div>
            </div>
           
            <div className="px-6 py-5 bg-gradient-to-br from-white via-primary/5 to-white dark:from-gray-700 dark:via-primary/10 dark:to-gray-700">
                <div className="text-center mb-4">
                    {/* Removed "Your Balance" label to save space */}
                    <div className="relative inline-block">
                        <p className={`text-3xl sm:text-4xl font-sans font-extrabold tracking-tight ${balanceColor}`}>{formattedBalance}</p>
                        {currentUserBalance > 0.01 && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
                        )}
                    </div>
                    <p className="mt-1.5 text-sm text-charcoal/80 dark:text-gray-300 font-medium">{balanceDescription}</p>
                </div>
                
                <div className="mb-4">
                     <motion.button
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ scale: 1.01 }}
                        onClick={onSettleUpClick}
                        disabled={totalDebt < 0.01}
                        className="w-full flex justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg hover:shadow-xl text-base font-bold text-white bg-gradient-to-r from-primary to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed transition-all"
                    >
                        Settle Up
                    </motion.button>
                </div>

                <div className="space-y-2">
                    {members
                        .filter(member => member.id !== currentUserId)
                        .map((member, index) => (
                            <motion.div
                              key={member.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.08, type: "spring", stiffness: 100 }}
                            >
                              <BalanceItem 
                                  user={member} 
                                  balance={balances.get(member.id) || 0}
                                  currentUserId={currentUserId}
                                  currency={group.currency}
                                  onViewDetail={onViewDetail}
                              />
                            </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default BalanceSummary;