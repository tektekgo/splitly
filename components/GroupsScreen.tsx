import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Group, User, FinalExpense } from '../types';
import CreateGroupModal from './CreateGroupModal';
import { UsersIcon } from './icons';
import { formatCurrency } from '../utils/currencyFormatter';

// Group type icon component
const GroupIcon: React.FC<{ groupName: string; className?: string }> = ({ groupName, className = 'w-5 h-5' }) => {
    const name = groupName.toLowerCase();
    if (name.includes('room') || name.includes('home') || name.includes('house')) {
        return (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
            </svg>
        );
    } else if (name.includes('trip') || name.includes('travel') || name.includes('vacation')) {
        return (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V21l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
        );
    } else if (name.includes('family')) {
        return (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0018.54 7H16.5c-.8 0-1.54.5-1.85 1.26L12.5 14H11v-4c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1v4H2v2h6v8h2v-8h2.5l1.35-4H14v6h2v8h2zm-11.5 0v-6H6v6h2.5z"/>
            </svg>
        );
    } else if (name.includes('work') || name.includes('office') || name.includes('business')) {
        return (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
            </svg>
        );
    } else {
        return <UsersIcon className={className} />;
    }
};

interface GroupsScreenProps {
    groups: Group[];
    users: User[];
    expenses: FinalExpense[];
    activeGroupId: string | null;
    currentUserId: string;
    onSelectGroup: (groupId: string) => void;
    onCreateGroup: (newGroup: Omit<Group, 'id'>) => void;
    onManageGroupMembers?: (groupId: string) => void;
    onArchiveGroup?: (groupId: string) => void;
    onUnarchiveGroup?: (groupId: string) => void;
    balanceHeader?: React.ReactNode;
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ groups, users, expenses, activeGroupId, currentUserId, onSelectGroup, onCreateGroup, onManageGroupMembers, onArchiveGroup, onUnarchiveGroup, balanceHeader }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateGroup = (groupData: Omit<Group, 'id'>) => {
        // Find current user in users array, or use currentUserId directly as fallback
        const currentUser = users.find(m => m.id === currentUserId);
        
        if (!currentUser) {
            // If user not found in array, still proceed with currentUserId
            // This handles race conditions where user document hasn't been fetched yet
            console.warn("Current user not found in users array, using currentUserId directly:", currentUserId);
            
            // Still try to create the group - the parent component will handle it
            const newGroupData = {
                ...groupData,
                members: [currentUserId] // Use currentUserId directly
            };
            onCreateGroup(newGroupData);
            setIsCreateModalOpen(false);
            return;
        }

        const newGroupData = {
            ...groupData,
            members: [currentUser.id]
        };
        onCreateGroup(newGroupData);
        setIsCreateModalOpen(false);
    };

    // Calculate stats for each group
    const groupStats = useMemo(() => {
        const stats = new Map<string, {
            expenseCount: number;
            totalAmount: number;
            lastActivity: Date | null;
            hasOutstandingBalance: boolean;
        }>();

        groups.forEach(group => {
            const groupExpenses = expenses.filter(e => e.groupId === group.id);
            const expenseCount = groupExpenses.length;
            const totalAmount = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
            
            // Find most recent expense
            let lastActivity: Date | null = null;
            if (groupExpenses.length > 0) {
                const dates = groupExpenses.map(e => new Date(e.expenseDate));
                lastActivity = new Date(Math.max(...dates.map(d => d.getTime())));
            }

            // Check for outstanding balances
            const memberBalances = new Map<string, number>();
            group.members.forEach(memberId => memberBalances.set(memberId, 0));
            
            groupExpenses.forEach(expense => {
                if (memberBalances.has(expense.paidBy)) {
                    const payerBalance = memberBalances.get(expense.paidBy) || 0;
                    memberBalances.set(expense.paidBy, payerBalance + expense.amount);
                }
                expense.splits.forEach(split => {
                    if (memberBalances.has(split.userId)) {
                        const splitteeBalance = memberBalances.get(split.userId) || 0;
                        memberBalances.set(split.userId, splitteeBalance - split.amount);
                    }
                });
            });

            const hasOutstandingBalance = Array.from(memberBalances.values()).some(balance => Math.abs(balance) > 0.01);

            stats.set(group.id, {
                expenseCount,
                totalAmount,
                lastActivity,
                hasOutstandingBalance
            });
        });

        return stats;
    }, [groups, expenses]);

    const formatLastActivity = (date: Date | null): string => {
        if (!date) return 'No activity';
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };


    return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden"
        >
            {balanceHeader}
            <div className="px-4 py-2.5 sm:px-6 sm:py-3">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-base sm:text-lg font-sans font-extrabold text-charcoal dark:text-gray-100 tracking-tight">
                        Groups
                    </h2>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-xs sm:text-sm text-primary dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-400 transition-colors font-semibold"
                    >
                        Create
                    </motion.button>
                </div>

                {(() => {
                    const activeGroups = groups.filter(g => !g.archived);
                    const archivedGroups = groups.filter(g => g.archived);
                    
                    return (
                        <>
                            {activeGroups.length === 0 && archivedGroups.length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-sage dark:text-gray-400">You haven't created any groups yet.</p>
                                </div>
                            ) : (
                                <>
                                    {activeGroups.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                                            {activeGroups.map((group, index) => (
                            <motion.div 
                              key={group.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                                <motion.div 
                                    whileHover={{ scale: 1.02, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                                        activeGroupId === group.id
                                        ? 'bg-gradient-to-br from-primary-100 via-primary-50 to-white dark:from-primary/40 dark:via-primary/30 dark:to-gray-700 border-primary dark:border-primary-400 shadow-lg ring-1 ring-primary/30 dark:ring-primary/40'
                                        : 'bg-white dark:bg-gray-700 border-stone-200 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/20 shadow-sm hover:shadow-md'
                                    }`}
                                    onClick={() => onSelectGroup(group.id)}
                                >
                                    {(() => {
                                        const stats = groupStats.get(group.id);
                                        return (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border ${
                                                        activeGroupId === group.id 
                                                            ? 'bg-white dark:bg-primary/20 border-primary dark:border-primary-400 shadow-sm' 
                                                            : 'bg-white dark:bg-gray-600 border-stone-200 dark:border-gray-500'
                                                    }`}>
                                                        <GroupIcon 
                                                            groupName={group.name} 
                                                            className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                                                activeGroupId === group.id 
                                                                    ? 'text-primary dark:text-primary-300' 
                                                                    : 'text-charcoal dark:text-gray-300'
                                                            }`}
                                                        />
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <h3 className={`font-sans font-extrabold text-sm sm:text-base truncate leading-tight ${
                                                                activeGroupId === group.id
                                                                ? 'text-primary dark:text-primary-200'
                                                                : 'text-charcoal dark:text-gray-100'
                                                            }`}>{group.name}</h3>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {stats?.hasOutstandingBalance && (
                                                                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" title="Outstanding balances"></div>
                                                                )}
                                                                {activeGroupId === group.id && (
                                                                    <div className="w-1.5 h-1.5 bg-primary dark:bg-primary-300 rounded-full animate-pulse"></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                            <p className={`text-xs font-medium ${
                                                                activeGroupId === group.id
                                                                ? 'text-primary/70 dark:text-primary-300'
                                                                : 'text-sage dark:text-gray-400'
                                                            }`}>
                                                                {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                                                            </p>
                                                            {stats && stats.expenseCount > 0 && (
                                                                <>
                                                                    <span className="text-sage dark:text-gray-500">•</span>
                                                                    <p className={`text-xs font-medium ${
                                                                        activeGroupId === group.id
                                                                        ? 'text-primary/70 dark:text-primary-300'
                                                                        : 'text-sage dark:text-gray-400'
                                                                    }`}>
                                                                        {stats.expenseCount} {stats.expenseCount === 1 ? 'expense' : 'expenses'}
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Additional Stats Row - Compact */}
                                                {stats && stats.expenseCount > 0 && (
                                                    <div className="pt-1.5 border-t border-stone-200 dark:border-gray-600 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-sage dark:text-gray-400">Total</span>
                                                            <span className={`text-xs sm:text-sm font-bold ${
                                                                activeGroupId === group.id
                                                                ? 'text-primary dark:text-primary-200'
                                                                : 'text-charcoal dark:text-gray-100'
                                                            }`}>
                                                                {formatCurrency(stats.totalAmount, group.currency)}
                                                            </span>
                                                        </div>
                                                        {stats.lastActivity && (
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-sage dark:text-gray-400">Last</span>
                                                                <span className="text-xs font-medium text-sage dark:text-gray-400">
                                                                    {formatLastActivity(stats.lastActivity)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </motion.div>
                                            </motion.div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {archivedGroups.length > 0 && (
                                        <div className="mt-6 pt-6 border-t-2 border-stone-200 dark:border-gray-600">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-sm sm:text-base font-sans font-extrabold text-sage dark:text-gray-400 tracking-tight flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                    </svg>
                                                    Archived Groups
                                                </h3>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {archivedGroups.map((group, index) => (
                                                    <motion.div 
                                                      key={group.id}
                                                      initial={{ opacity: 0, y: 20 }}
                                                      animate={{ opacity: 1, y: 0 }}
                                                      transition={{ delay: index * 0.05 }}
                                                    >
                                                        <motion.div 
                                                            whileHover={{ scale: 1.02, y: -1 }}
                                                            whileTap={{ scale: 0.98 }}
                                                            className="w-full p-2.5 sm:p-3 rounded-xl border border-stone-200 dark:border-gray-600 bg-stone-50 dark:bg-gray-800/50 opacity-75 hover:opacity-100 transition-all cursor-pointer"
                                                            onClick={() => onSelectGroup(group.id)}
                                                        >
                                                            {(() => {
                                                                const stats = groupStats.get(group.id);
                                                                return (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border border-stone-300 dark:border-gray-500 bg-white dark:bg-gray-700">
                                                                                <GroupIcon 
                                                                                    groupName={group.name} 
                                                                                    className="w-4 h-4 sm:w-5 sm:h-5 text-sage dark:text-gray-400"
                                                                                />
                                                                            </div>
                                                                            <div className="flex-grow min-w-0">
                                                                                <div className="flex items-center justify-between gap-2">
                                                                                    <h3 className="font-sans font-extrabold text-sm sm:text-base truncate leading-tight text-sage dark:text-gray-400">
                                                                                        {group.name}
                                                                                    </h3>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                                                    <p className="text-xs font-medium text-sage dark:text-gray-500">
                                                                                        {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                                                                                    </p>
                                                                                    {stats && stats.expenseCount > 0 && (
                                                                                        <>
                                                                                            <span className="text-sage dark:text-gray-600">•</span>
                                                                                            <p className="text-xs font-medium text-sage dark:text-gray-500">
                                                                                                {stats.expenseCount} {stats.expenseCount === 1 ? 'expense' : 'expenses'}
                                                                                            </p>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {stats && stats.expenseCount > 0 && (
                                                                            <div className="pt-1.5 border-t border-stone-200 dark:border-gray-700 space-y-1">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className="text-xs text-sage dark:text-gray-500">Total</span>
                                                                                    <span className="text-xs sm:text-sm font-bold text-sage dark:text-gray-400">
                                                                                        {formatCurrency(stats.totalAmount, group.currency)}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {onUnarchiveGroup && (
                                                                            <div className="pt-2 flex justify-end">
                                                                                <motion.button
                                                                                    whileTap={{ scale: 0.95 }}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        onUnarchiveGroup!(group.id);
                                                                                    }}
                                                                                    className="text-xs text-primary dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-400 font-semibold"
                                                                                >
                                                                                    Unarchive →
                                                                                </motion.button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </motion.div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    );
                })()}
            </div>
            {isCreateModalOpen && (
                <CreateGroupModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreate={handleCreateGroup}
                />
            )}
        </motion.div>
    );
};

export default GroupsScreen;