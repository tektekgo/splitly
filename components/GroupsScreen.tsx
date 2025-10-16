import React, { useState } from 'react';
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
        <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                        Your Groups
                    </h2>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
                    >
                        Create New Group
                    </button>
                </div>

                {groups.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-text-secondary-light dark:text-text-secondary-dark">You haven't created any groups yet.</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {groups.map(group => (
                            <li key={group.id}>
                                <div className={`w-full p-4 rounded-xl border-2 transition-all duration-200 ${
                                    activeGroupId === group.id
                                    ? 'bg-primary/10 border-primary shadow-md'
                                    : 'bg-gray-50 dark:bg-gray-900/50 border-transparent hover:border-primary/50'
                                }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <h3 className="font-bold text-base text-text-primary-light dark:text-text-primary-dark">{group.name}</h3>
                                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{group.members.length} member(s)</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onSelectGroup(group.id)}
                                                className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-600 transition-colors"
                                            >
                                                View
                                            </button>
                                            {onManageGroupMembers && (
                                                <button
                                                    onClick={() => onManageGroupMembers(group.id)}
                                                    className="px-3 py-1 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors"
                                                >
                                                    Manage Members
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
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