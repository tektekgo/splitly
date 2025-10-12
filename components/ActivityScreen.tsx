import React from 'react';
import type { Notification } from '../types';
import { BellIcon } from './icons';

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
}

const ActivityScreen: React.FC<ActivityScreenProps> = ({ notifications }) => {
    return (
        <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
                    Activity Feed
                </h2>

                {notifications.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-text-primary-light dark:text-text-primary-dark">No recent activity</h3>
                        <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">New expenses and payments will appear here.</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {notifications.map(notification => (
                            <li key={notification.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${notification.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary'}`}></div>
                                <div className="flex-grow">
                                    <p className="text-sm text-text-primary-light dark:text-text-primary-dark">{notification.message}</p>
                                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{formatTimeAgo(notification.timestamp)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
};

export default ActivityScreen;
