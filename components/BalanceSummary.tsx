import React, { useMemo } from 'react';
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
    
    const textColor = Math.abs(balance) < 0.01 ? 'text-text-secondary-light dark:text-text-secondary-dark' : balance > 0 ? 'text-success' : 'text-error';

    return (
        <button 
            onClick={() => onViewDetail(user)}
            disabled={isCurrentUser}
            className="w-full flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:hover:bg-transparent disabled:cursor-default transition-colors group"
        >
            <div className="flex items-center">
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full mr-3"/>
                <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{user.name.replace(' (You)', '')}</span>
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
        return Array.from(balances.values()).reduce((sum: number, balance: number) => {
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
    const formattedBalance = formatCurrency(Math.abs(currentUserBalance), group.currency);

    return (
        <div className="bg-content-light dark:bg-content-dark rounded-lg shadow-md">
            <div className="p-3 flex justify-between items-center border-b border-border-light dark:border-border-dark">
                 <div>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-0.5">
                      Members
                    </p>
                    <p className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">{members.length}</p>
                 </div>
                 <div className="flex gap-1.5">
                    <button
                        onClick={onManageGroupClick}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-gray-700 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-700 rounded-md transition-colors"
                        aria-label={`Manage current group: ${group.name}`}
                        title={`Manage current group: ${group.name}`}
                    >
                        <CogIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">Manage Group</span>
                    </button>
                    <button
                        onClick={onExportClick}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-600 rounded-md transition-colors"
                        aria-label="Export to CSV"
                    >
                        <ExportIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>
           
            <div className="p-4">
                <div className="text-center mb-4">
                    <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">Your Balance</p>
                    <p className={`text-2xl font-bold mt-1 ${balanceColor}`}>{formattedBalance}</p>
                    <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">{balanceDescription}</p>
                </div>
                
                <div className="mb-4">
                     <button
                        onClick={onSettleUpClick}
                        disabled={totalDebt < 0.01}
                        className="w-full max-w-xs mx-auto flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
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
                                currentUserId={currentUserId}
                                currency={group.currency}
                                onViewDetail={onViewDetail}
                            />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BalanceSummary;