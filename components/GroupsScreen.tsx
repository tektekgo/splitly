import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Group, User } from '../types';
import CreateGroupModal from './CreateGroupModal';
import { UsersIcon } from './icons';

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
    activeGroupId: string | null;
    currentUserId: string;
    onSelectGroup: (groupId: string) => void;
    onCreateGroup: (newGroup: Omit<Group, 'id'>) => void;
    onManageGroupMembers?: (groupId: string) => void;
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ groups, users, activeGroupId, currentUserId, onSelectGroup, onCreateGroup, onManageGroupMembers }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateGroup = (groupData: Omit<Group, 'id'>) => {
        const currentUser = users.find(m => m.id === currentUserId);
        if (!currentUser) {
            alert("Error: Current user not found.");
            return;
        }

        const newGroupData = {
            ...groupData,
            members: [currentUser.id]
        };
        onCreateGroup(newGroupData);
        setIsCreateModalOpen(false);
    };


    return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden"
        >
            <div className="px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg sm:text-xl font-sans font-extrabold text-charcoal dark:text-gray-100 tracking-tight">
                        Your Groups
                    </h2>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-primary-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                    >
                        Create New Group
                    </motion.button>
                </div>

                {groups.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-sage dark:text-gray-400">You haven't created any groups yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {groups.map((group, index) => (
                            <motion.div 
                              key={group.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                                <motion.div 
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
                                        activeGroupId === group.id
                                        ? 'bg-gradient-to-br from-primary-100 via-primary-50 to-white dark:from-primary/40 dark:via-primary/30 dark:to-gray-700 border-primary dark:border-primary-400 shadow-xl ring-2 ring-primary/30 dark:ring-primary/40'
                                        : 'bg-white dark:bg-gray-700 border-stone-300 dark:border-gray-600 hover:border-primary/60 dark:hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/20 shadow-lg hover:shadow-xl'
                                    }`}
                                    onClick={() => onSelectGroup(group.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                                            activeGroupId === group.id 
                                                ? 'bg-white dark:bg-primary/20 border-primary dark:border-primary-400' 
                                                : 'bg-white dark:bg-gray-600 border-stone-200 dark:border-gray-500'
                                        }`}>
                                            <GroupIcon 
                                                groupName={group.name} 
                                                className={`w-5 h-5 ${
                                                    activeGroupId === group.id 
                                                        ? 'text-primary dark:text-primary-300' 
                                                        : 'text-charcoal dark:text-gray-300'
                                                }`}
                                            />
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className={`font-sans font-extrabold text-base truncate ${
                                                    activeGroupId === group.id
                                                    ? 'text-primary dark:text-primary-200'
                                                    : 'text-charcoal dark:text-gray-100'
                                                }`}>{group.name}</h3>
                                                {activeGroupId === group.id && (
                                                    <div className="w-2 h-2 bg-primary dark:bg-primary-300 rounded-full flex-shrink-0 animate-pulse shadow-lg"></div>
                                                )}
                                            </div>
                                            <p className={`text-sm font-medium mt-0.5 ${
                                                activeGroupId === group.id
                                                ? 'text-primary/70 dark:text-primary-300'
                                                : 'text-sage dark:text-gray-400'
                                            }`}>{group.members.length} member{group.members.length !== 1 ? 's' : ''}</p>
                                            {activeGroupId === group.id && (
                                                <span className="text-xs font-bold text-primary dark:text-primary-300 mt-1 inline-block">Currently Active</span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                )}
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