import React, { useState } from 'react';
import type { Group } from '../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupData: Omit<Group, 'id'>) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim()) {
      // The parent component will handle adding the current user
      onCreate({ name: groupName.trim(), members: [] });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-content-light dark:bg-content-dark rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-border-light dark:border-border-dark">
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Create a New Group</h2>
            </div>

            <div className="p-6 space-y-4">
                <label htmlFor="newGroupName" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Group Name</label>
                <input
                    id="newGroupName"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Family, Ski Trip, etc."
                    required
                    className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-border-light dark:border-border-dark flex justify-end gap-3 rounded-b-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!groupName.trim()}
                    className="px-5 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    Create Group
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;