import React, { useState } from 'react';
import type { Group } from '../types';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onSendInvite: (email: string) => Promise<void>;
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, group, onSendInvite }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      await onSendInvite(email.trim().toLowerCase());
      setEmail('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send invite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-content-light dark:bg-content-dark rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Invite Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-text-primary-light dark:text-text-primary-dark">
              <strong>Inviting to:</strong> {group.name}
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              They'll receive an invite and can join once they sign up or log in.
            </p>
          </div>

          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Email Address
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="friend@example.com"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm"
              disabled={isLoading}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-error">{error}</p>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              💡 <strong>Tip:</strong> If they don't have a Splitbi account yet, they can sign up using this email to see the invite.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;

