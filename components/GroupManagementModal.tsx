
import React, { useState, useMemo, useEffect } from 'react';
import type { Group, User } from '../types';
import { DeleteIcon } from './icons';

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  allUsers: User[];
  currentUserId: string;
  onSave: (updatedGroup: Group) => void;
  onDelete: (groupId: string) => void;
  totalDebt: number;
}

const GroupManagementModal: React.FC<GroupManagementModalProps> = ({ isOpen, onClose, group, allUsers, currentUserId, onSave, onDelete, totalDebt }) => {
  const [groupName, setGroupName] = useState(group.name);
  const [memberIds, setMemberIds] = useState(group.members);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (group) {
        setGroupName(group.name);
        setMemberIds(group.members);
        setShowDeleteConfirm(false);
        setSelectedUserToAdd('');
    }
  }, [group]);

  const currentMembers = useMemo(() => {
    return allUsers.filter(u => memberIds.includes(u.id));
  }, [allUsers, memberIds]);
  
  const availableUsersToAdd = useMemo(() => {
    return allUsers.filter(u => !memberIds.includes(u.id));
  }, [allUsers, memberIds]);

  const isDeleteDisabled = totalDebt > 0.01;

  if (!isOpen) return null;

  const handleAddMember = () => {
    if (selectedUserToAdd && !memberIds.includes(selectedUserToAdd)) {
      setMemberIds([...memberIds, selectedUserToAdd]);
      setSelectedUserToAdd('');
    }
  };

  const handleRemoveMember = (userId: string) => {
    if (userId === currentUserId) {
      alert("You cannot remove yourself from the group.");
      return;
    }
    if (window.confirm("Are you sure you want to remove this member? This cannot be undone.")) {
        setMemberIds(memberIds.filter(id => id !== userId));
    }
  };
  
  const handleSave = () => {
    if (groupName.trim() === '') {
        alert('Group name cannot be empty.');
        return;
    }
    onSave({ ...group, name: groupName, members: memberIds });
  };

  const handleRequestDelete = () => {
    if (isDeleteDisabled) {
        // This is primarily handled by the disabled attribute, but this is a safeguard.
        return;
    }
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(group.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-content-light dark:bg-content-dark rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Manage Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Group Name</label>
                <input
                    id="groupName"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">Members</h3>
                <ul className="space-y-2">
                    {currentMembers.map(member => (
                        <li key={member.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                            <div className="flex items-center">
                                <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full mr-3" />
                                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{member.name}</span>
                            </div>
                            {member.id !== currentUserId && (
                                <button onClick={() => handleRemoveMember(member.id)} className="p-2 text-gray-400 hover:text-error dark:hover:text-error-hover rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                    <DeleteIcon className="w-5 h-5"/>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            {availableUsersToAdd.length > 0 && (
                <div>
                    <label htmlFor="addMemberSelect" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Add Member</label>
                    <div className="mt-1 flex gap-2">
                        <select
                            id="addMemberSelect"
                            value={selectedUserToAdd}
                            onChange={(e) => setSelectedUserToAdd(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            <option value="" disabled>Select a user to add...</option>
                            {availableUsersToAdd.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleAddMember}
                            disabled={!selectedUserToAdd}
                            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-border-light dark:border-border-dark rounded-b-2xl">
            {showDeleteConfirm ? (
                <div className="w-full text-center">
                    <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">Are you sure you want to delete this group?</p>
                    <p className="text-sm text-error">This action cannot be undone.</p>
                    <div className="mt-3 flex justify-center gap-3">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-5 py-2 bg-error text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            Confirm Delete
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-between items-center gap-3">
                    <div>
                        <button
                            onClick={handleRequestDelete}
                            disabled={isDeleteDisabled}
                            className="px-5 py-2 bg-red-100 dark:bg-red-900/30 text-error font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                            title={isDeleteDisabled ? `Settle outstanding debts of $${totalDebt.toFixed(2)} to enable deletion` : 'Delete this group'}
                        >
                            Delete Group
                        </button>
                        {isDeleteDisabled && <p className="text-xs text-error mt-1">Settle debts to delete.</p>}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GroupManagementModal;
