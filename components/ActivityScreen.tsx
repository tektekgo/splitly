import React from 'react';
import type { Notification, GroupInvite } from '../types';
import { BellIcon } from './icons';
import { NotificationType } from '../types';

// A simple utility to format time relatively.
// In a real app, use a library like `date-fns`.
const formatTimeAgo = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};


interface ActivityScreenProps {
    notifications: Notification[];
    groupInvites: GroupInvite[];
    onAcceptInvite: (inviteId: string) => void;
    onDeclineInvite: (inviteId: string) => void;
}

const ActivityScreen: React.FC<ActivityScreenProps> = ({ notifications, groupInvites, onAcceptInvite, onDeclineInvite }) => {
    // Show pending invites at the top
    const pendingInvites = groupInvites.filter(inv => inv.status === 'pending');

    return (
        <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
                <h2 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
                    Activity Feed
                </h2>

                {/* Pending Group Invites */}
                {pendingInvites.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3 flex items-center gap-2">
                            📧 Pending Invites
                            <span className="px-2 py-0.5 bg-primary text-white text-xs font-bold rounded-full">
                                {pendingInvites.length}
                            </span>
                        </h3>
                        <ul className="space-y-3">
                            {pendingInvites.map(invite => (
                                <li key={invite.id} className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-grow">
                                            <p className="font-medium text-text-primary-light dark:text-text-primary-dark mb-1">
                                                {invite.inviterName} invited you to join
                                            </p>
                                            <p className="text-lg font-bold text-primary mb-2">
                                                {invite.groupName}
                                            </p>
                                            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                                Invited {formatTimeAgo(invite.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onAcceptInvite(invite.id)}
                                                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => onDeclineInvite(invite.id)}
                                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Activity Notifications */}
                <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                    Recent Activity
                </h3>
                {notifications.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-sm font-medium text-text-primary-light dark:text-text-primary-dark">No recent activity</h3>
                        <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">New expenses and payments will appear here.</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {notifications.map(notification => {
                            const isInvite = notification.type === NotificationType.GroupInvite;
                            
                            return (
                                <li key={notification.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${notification.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary'}`}></div>
                                    <div className="flex-grow">
                                        <p className="text-sm text-text-primary-light dark:text-text-primary-dark">
                                            {isInvite && <span className="mr-1">📧</span>}
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{formatTimeAgo(notification.timestamp)}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </main>
    );
};

export default ActivityScreen;
