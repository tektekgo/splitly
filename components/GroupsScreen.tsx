import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Group, User } from '../types';
import CreateGroupModal from './CreateGroupModal';

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
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-content-dark rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 overflow-hidden"
        >
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-serif font-bold text-charcoal dark:text-text-primary-dark">
                        Your Groups
                    </h2>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-3 bg-teal-primary text-white font-medium rounded-full shadow-sm hover:bg-teal-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-primary transition-colors"
                    >
                        Create New Group
                    </motion.button>
                </div>

                {groups.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-sage dark:text-text-secondary-dark">You haven't created any groups yet.</p>
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
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                                        activeGroupId === group.id
                                        ? 'bg-teal-light border-teal-primary shadow-sm'
                                        : 'bg-surface dark:bg-gray-900/50 border-stone-200 dark:border-stone-700 hover:border-teal-primary/50 hover:bg-teal-light/50'
                                    }`}
                                    onClick={() => onSelectGroup(group.id)}
                                >
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`font-serif font-bold text-base truncate ${
                                                activeGroupId === group.id
                                                ? 'text-teal-primary'
                                                : 'text-charcoal dark:text-text-primary-dark'
                                            }`}>{group.name}</h3>
                                            {activeGroupId === group.id && (
                                                <div className="w-2 h-2 bg-teal-primary rounded-full flex-shrink-0"></div>
                                            )}
                                        </div>
                                        <p className="text-sm text-sage dark:text-text-secondary-dark">{group.members.length} member(s)</p>
                                        {activeGroupId === group.id && (
                                            <span className="text-xs font-medium text-teal-primary">Currently Active</span>
                                        )}
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
        </main>
    );
};

export default GroupsScreen;