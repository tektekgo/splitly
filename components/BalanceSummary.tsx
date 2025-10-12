import React, { useMemo } from 'react';
import type { FinalExpense, Group, User } from '../types';
import { ChevronRightIcon, CogIcon, ExportIcon } from './icons';
import { CURRENT_USER_ID } from '../constants';

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

const BalanceItem: React.FC<{ user: User; balance: number; onViewDetail: (user: User) => void; }> = ({ user, balance, onViewDetail }) => {
    const isCurrentUser = user.id === CURRENT_USER_ID;

    const balanceText = Math.abs(balance) < 0.01 
        ? 'is settled up' 
        : balance > 0 
        ? `gets back $${balance.toFixed(2)}` 
        : `owes $${(-balance).toFixed(2)}`;
    
    const textColor = Math.abs(balance) < 0.01 ? 'text-text-secondary-light dark:text-text-secondary-dark' : balance > 0 ? 'text-success' : 'text-error';

    return (
        <button 
            onClick={() => onViewDetail(user)}
            disabled={isCurrentUser}
            className="w-full flex items-center justify-between py-3 px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:hover:bg-transparent disabled:cursor-default transition-colors group"
        >
            <div className="flex items-center">
                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full mr-4"/>
                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{user.name.replace(' (You)', '')}</span>
            </div>
            <div className="flex items-center space-x-2">
                <span className={`font-semibold ${textColor}`}>{balanceText}</span>
                {!isCurrentUser && <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />}
            </div>
        </button>
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
        return Array.from(balances.values()).reduce((sum, balance) => {
            return sum + (balance < 0 ? Math.abs(balance) : 0);
        }, 0);
    }, [balances]);
    
    let balanceColor = 'text-text-primary-light dark:text-text-primary-dark';
    let balanceDescription = 'You are all settled up.';
    if (currentUserBalance > 0.01) {
        balanceColor = 'text-success';
        balanceDescription = 'Overall, you are owed';
    } else if (currentUserBalance < -0.01) {
        balanceColor = 'text-error';
        balanceDescription = 'Overall, you owe';
    }
    const formattedBalance = `$${Math.abs(currentUserBalance).toFixed(2)}`;

    return (
        <div className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg">
            <div className="p-6 flex justify-between items-center border-b border-border-light dark:border-border-dark">
                 <div>
                    <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{group.name}</h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{members.length} Members</p>
                 </div>
                 <div className="flex items-center space-x-2">
                    <button
                        onClick={onExportClick}
                        className="p-2 rounded-full text-primary bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                        aria-label="Export Data"
                    >
                        <ExportIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={onManageGroupClick}
                        className="p-2 rounded-full text-primary bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                        aria-label="Manage Group"
                    >
                        <CogIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
           
            <div className="p-6">
                <div className="text-center my-4">
                    <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Your Balance</p>
                    <p className={`text-5xl font-extrabold mt-1 ${balanceColor}`}>{formattedBalance}</p>
                    <p className="mt-1 text-text-secondary-light dark:text-text-secondary-dark">{balanceDescription}</p>
                </div>
                
                <div className="my-6">
                     <button
                        onClick={onSettleUpClick}
                        disabled={totalDebt < 0.01}
                        className="w-full max-w-xs mx-auto flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                    >
                        Settle Up
                    </button>
                </div>

                <div className="divide-y divide-border-light dark:divide-border-dark">
                    {members
                        .filter(member => member.id !== currentUserId)
                        .map(member => (
                            <BalanceItem 
                                key={member.id} 
                                user={member} 
                                balance={balances.get(member.id) || 0}
                                onViewDetail={onViewDetail}
                            />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BalanceSummary;