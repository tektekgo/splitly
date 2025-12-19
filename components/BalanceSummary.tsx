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
    
    const textColor = Math.abs(balance) < 0.01 ? 'text-sage dark:text-text-secondary-dark' : balance > 0 ? 'text-teal-primary' : 'text-orange-500';

    return (
        <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewDetail(user)}
            disabled={isCurrentUser}
            className="w-full flex items-center justify-between py-3 px-4 rounded-2xl hover:bg-surface dark:hover:bg-gray-800 disabled:hover:bg-transparent disabled:cursor-default transition-colors group"
        >
            <div className="flex items-center">
                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full mr-3"/>
                <span className="text-sm font-medium text-charcoal dark:text-text-primary-dark">{user.name.replace(' (You)', '')}</span>
            </div>
            <div className="flex items-center space-x-2">
                <span className={`font-semibold ${textColor}`}>{balanceText}</span>
                {!isCurrentUser && <ChevronRightIcon className="w-5 h-5 text-sage group-hover:text-teal-primary dark:group-hover:text-gray-300 transition-colors" />}
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

        expenses.forEach(expense => {
            // Only consider expenses relevant to the current group's members
            const payerInGroup = memberBalances.has(expense.paidBy);
            if (payerInGroup) {
                const payerBalance = memberBalances.get(expense.paidBy) || 0;
                memberBalances.set(expense.paidBy, payerBalance + expense.amount);
                expense.splits.forEach(split => {
                    if (memberBalances.has(split.userId)) {
                        const splitteeBalance = memberBalances.get(split.userId) || 0;
                        memberBalances.set(split.userId, splitteeBalance - split.amount);
                    }
                });
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
        balanceColor = 'text-teal-primary';
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
          className="bg-white dark:bg-content-dark rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700"
        >
            <div className="p-6 flex justify-between items-center border-b border-stone-200 dark:border-stone-700">
                 <div>
                    <p className="text-xs text-sage dark:text-text-secondary-dark uppercase tracking-wider mb-1">
                      Members
                    </p>
                    <p className="text-base font-serif font-bold text-charcoal dark:text-text-primary-dark">{members.length}</p>
                 </div>
                 <div className="flex gap-2">
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onManageGroupClick}
                        className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-white bg-stone-600 dark:bg-gray-600 hover:bg-stone-700 dark:hover:bg-gray-700 rounded-full transition-colors"
                        aria-label={`Manage current group: ${group.name}`}
                        title={`Manage current group: ${group.name}`}
                    >
                        <CogIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Manage</span>
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onExportClick}
                        className="flex items-center gap-1 px-4 py-2 text-xs font-medium text-white bg-teal-primary hover:bg-teal-dark rounded-full transition-colors"
                        aria-label="Export to CSV"
                    >
                        <ExportIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                    </motion.button>
                </div>
            </div>
           
            <div className="p-6">
                <div className="text-center mb-6">
                    <p className="text-xs font-medium text-sage dark:text-text-secondary-dark uppercase tracking-wider">Your Balance</p>
                    <p className={`text-3xl font-serif font-bold mt-2 ${balanceColor}`}>{formattedBalance}</p>
                    <p className="mt-2 text-sm text-sage dark:text-text-secondary-dark">{balanceDescription}</p>
                </div>
                
                <div className="mb-6">
                     <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onSettleUpClick}
                        disabled={totalDebt < 0.01}
                        className="w-full max-w-xs mx-auto flex justify-center py-3 px-6 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-teal-primary hover:bg-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
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
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
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