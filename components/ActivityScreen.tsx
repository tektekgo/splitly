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
    onDeleteNotification?: (notificationId: string) => void;
    onMarkAllAsRead?: () => void;
    onClearAll?: () => void;
    balanceHeader?: React.ReactNode;
}

const ActivityScreen: React.FC<ActivityScreenProps> = ({ notifications, groupInvites, onAcceptInvite, onDeclineInvite, onDeleteNotification, onMarkAllAsRead, onClearAll, balanceHeader }) => {
    // Show pending invites at the top
    const pendingInvites = groupInvites.filter(inv => inv.status === 'pending');
    const unreadCount = notifications.filter(n => !n.read).length;
    const hasNotifications = notifications.length > 0;

    return (
        <div className="overflow-hidden">
            {balanceHeader}
            <div className="px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg sm:text-xl font-extrabold text-charcoal dark:text-gray-100 tracking-tight">
                        Activity Feed
                    </h2>
                    {hasNotifications && (onMarkAllAsRead || onClearAll) && (
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && onMarkAllAsRead && (
                                <button
                                    onClick={onMarkAllAsRead}
                                    className="text-xs text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium px-2 py-1 rounded-md hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                            {onClearAll && (
                                <button
                                    onClick={() => {
                                        if (window.confirm('Clear all notifications? This cannot be undone.')) {
                                        onClearAll();
                                        }
                                    }}
                                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Pending Group Invites */}
                {pendingInvites.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-extrabold text-charcoal dark:text-gray-100 mb-4 flex items-center gap-2 tracking-tight">
                            📧 Pending Invites
                            <span className="px-3 py-1 bg-gradient-to-r from-primary to-primary-700 text-white text-xs font-bold rounded-full shadow-md">
                                {pendingInvites.length}
                            </span>
                        </h3>
                        <ul className="space-y-3">
                            {pendingInvites.map(invite => (
                                <li key={invite.id} className="p-5 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/25 dark:to-primary/15 border-2 border-primary/30 dark:border-primary/40 shadow-md">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-grow">
                                            <p className="font-medium text-charcoal dark:text-gray-100 mb-1">
                                                {invite.inviterName} invited you to join
                                            </p>
                                            <p className="text-xl font-extrabold text-primary dark:text-primary-300 mb-2 tracking-tight">
                                                {invite.groupName}
                                            </p>
                                            <p className="text-xs text-sage dark:text-gray-400">
                                                Invited {formatTimeAgo(invite.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onAcceptInvite(invite.id)}
                                                className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:from-primary-700 hover:to-primary-800 transition-all"
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
                <h3 className="text-lg font-extrabold text-charcoal dark:text-gray-100 mb-4 tracking-tight">
                    Recent Activity
                </h3>
                {notifications.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-stone-100 dark:border-gray-600">
                        <BellIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-4 text-sm font-medium text-charcoal dark:text-gray-100">No recent activity</h3>
                        <p className="mt-1 text-sm text-sage dark:text-gray-400">New expenses and payments will appear here.</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {notifications.map(notification => {
                            const isInvite = notification.type === NotificationType.GroupInvite;
                            
                            return (
                                <li key={notification.id} className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all group">
                                    <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${notification.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary'}`}></div>
                                    <div className="flex-grow min-w-0">
                                        <p className="text-sm text-charcoal dark:text-gray-100">
                                            {isInvite && <span className="mr-1">📧</span>}
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{formatTimeAgo(notification.timestamp)}</p>
                                    </div>
                                    {onDeleteNotification && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Delete this notification?')) {
                                                    onDeleteNotification(notification.id);
                                                }
                                            }}
                                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                                            title="Delete notification"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ActivityScreen;
