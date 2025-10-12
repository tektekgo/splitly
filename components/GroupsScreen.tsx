import React, { useState } from 'react';
import type { Group, User } from '../types';
import { CURRENT_USER_ID } from '../constants';
import CreateGroupModal from './CreateGroupModal';

interface GroupsScreenProps {
    groups: Group[];
    users: User[];
    activeGroupId: string | null;
    onSelectGroup: (groupId: string) => void;
    onCreateGroup: (newGroup: Omit<Group, 'id'>) => void;
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ groups, users, activeGroupId, onSelectGroup, onCreateGroup }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleCreateGroup = (groupData: Omit<Group, 'id'>) => {
        const currentUser = users.find(m => m.id === CURRENT_USER_ID);
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
                    <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
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
                                <button
                                    onClick={() => onSelectGroup(group.id)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                                        activeGroupId === group.id
                                        ? 'bg-primary/10 border-primary shadow-md'
                                        : 'bg-gray-50 dark:bg-gray-900/50 border-transparent hover:border-primary/50'
                                    }`}
                                >
                                    <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">{group.name}</h3>
                                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{group.members.length} member(s)</p>
                                </button>
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