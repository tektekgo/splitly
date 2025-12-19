import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Group } from '../types';
import CurrencySelector from './CurrencySelector';
import { DEFAULT_CURRENCY } from '../utils/currencyFormatter';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (groupData: Omit<Group, 'id'>) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupName.trim()) {
      // The parent component will handle adding the current user
      onCreate({ 
        name: groupName.trim(), 
        members: [], 
        currency: currency || DEFAULT_CURRENCY,
        createdAt: new Date(),
        createdBy: undefined // Will be set by parent component
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-stone-100 dark:border-gray-700 w-full max-w-md" 
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
            <div className="p-6 border-b border-stone-200 dark:border-gray-600">
            <h2 className="text-2xl font-sans font-bold text-charcoal dark:text-text-primary-dark">Create a New Group</h2>
            </div>

            <div className="p-6 space-y-6">
                <div>
                    <label htmlFor="newGroupName" className="block text-sm font-medium text-sage dark:text-text-secondary-dark mb-2">Group Name</label>
                    <input
                        id="newGroupName"
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g., Family, Ski Trip, etc."
                        required
                        className="block w-full px-4 py-3 bg-surface dark:bg-gray-700 border border-stone-200 dark:border-gray-600 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-primary dark:focus:ring-primary-400 focus:border-teal-primary dark:focus:border-primary-400 text-charcoal dark:text-gray-100 sm:text-sm"
                    />
                </div>
                
                <div>
                    <label htmlFor="groupCurrency" className="block text-sm font-medium text-sage dark:text-text-secondary-dark mb-2">Currency</label>
                    <CurrencySelector
                        value={currency}
                        onChange={setCurrency}
                        className="mt-1"
                    />
                    <p className="mt-2 text-xs text-sage dark:text-text-secondary-dark">
                        All expenses in this group will use this currency
                    </p>
                </div>
            </div>

            <div className="p-6 bg-surface dark:bg-gray-700 border-t border-stone-200 dark:border-gray-600 flex justify-end gap-3 rounded-b-2xl">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-white dark:bg-gray-700 border border-stone-200 dark:border-gray-600 text-charcoal dark:text-gray-200 font-medium rounded-full hover:bg-surface dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-gray-500 transition-colors"
                >
                    Cancel
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!groupName.trim()}
                    className="px-6 py-3 bg-primary text-white font-medium rounded-full shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                    Create Group
                </motion.button>
            </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateGroupModal;