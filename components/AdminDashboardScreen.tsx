import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminStatsCards from './AdminStatsCards';
import AdminUserLookup from './AdminUserLookup';
import AdminGroupBrowser from './AdminGroupBrowser';
import { getDatabaseStats, getRecentAdminActions, exportAllData, findOrphanedData, runCurrencyMigrationAdmin, type DatabaseStats } from '../utils/adminTools';
import type { Group } from '../types';

type AdminTab = 'dashboard' | 'users' | 'groups' | 'system';

interface AdminDashboardScreenProps {
  currentUserId: string;
  onViewGroup?: (group: Group) => void;
  onDeleteUser?: (userId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onArchiveGroup?: (groupId: string) => void;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  currentUserId,
  onViewGroup,
  onDeleteUser,
  onDeleteGroup,
  onArchiveGroup
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab]);

  const loadDashboardData = async () => {
    setLoadingStats(true);
    setLoadingActions(true);

    try {
      const [statsData, actionsData] = await Promise.all([
        getDatabaseStats(),
        getRecentAdminActions(10)
      ]);
      setStats(statsData);
      setRecentActions(actionsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoadingStats(false);
      setLoadingActions(false);
    }
  };

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'groups', label: 'Groups', icon: '🏘️' },
    { id: 'system', label: 'System Tools', icon: '⚙️' }
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {loadingStats ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading stats...</p>
              </div>
            ) : stats ? (
              <AdminStatsCards
                stats={[
                  {
                    title: 'Total Users',
                    value: stats.totalUsers,
                    subtitle: `${stats.realUsers} real, ${stats.simulatedUsers} guest`,
                    color: 'blue',
                    icon: (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    )
                  },
                  {
                    title: 'Total Groups',
                    value: stats.totalGroups,
                    subtitle: stats.largestGroup ? `Largest: ${stats.largestGroup.name}` : undefined,
                    color: 'green',
                    icon: (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    )
                  },
                  {
                    title: 'Total Expenses',
                    value: stats.totalExpenses,
                    subtitle: stats.mostExpenses ? `Most: ${stats.mostExpenses.name}` : undefined,
                    color: 'purple',
                    icon: (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    )
                  },
                  {
                    title: 'Pending Invites',
                    value: stats.pendingInvites,
                    subtitle: `${stats.totalInvites} total invites`,
                    color: 'orange',
                    icon: (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    )
                  }
                ]}
              />
            ) : null}

            {/* Recent Admin Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Recent Admin Actions
              </h3>
              {loadingActions ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
              ) : recentActions.length > 0 ? (
                <div className="space-y-3">
                  {recentActions.map((action, index) => (
                    <div
                      key={action.id || index}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {action.action?.replace(/_/g, ' ').toUpperCase()}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {action.targetType}: {action.targetName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            By {action.adminName}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {action.timestamp?.toDate
                            ? new Date(action.timestamp.toDate()).toLocaleDateString()
                            : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No recent actions</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">User Lookup</h2>
            <AdminUserLookup onDeleteUser={onDeleteUser} />
          </div>
        )}

        {activeTab === 'groups' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">All Groups</h2>
            <AdminGroupBrowser
              currentUserId={currentUserId}
              onViewGroup={onViewGroup}
              onDeleteGroup={onDeleteGroup}
              onArchiveGroup={onArchiveGroup}
            />
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">System Tools</h2>

            {/* Currency Migration */}
            {stats && (stats.currencyMigrationNeeded.groupsNeedMigration > 0 || stats.currencyMigrationNeeded.expensesNeedMigration > 0) && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-900 dark:text-yellow-100 font-medium">
                  💰 Currency Migration Needed
                </p>
                <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                  Groups: {stats.currencyMigrationNeeded.groupsNeedMigration} |
                  Expenses: {stats.currencyMigrationNeeded.expensesNeedMigration}
                </p>
                <button
                  onClick={async () => {
                    if (confirm('Run currency migration? This will add USD currency to groups and expenses that don\'t have it.')) {
                      try {
                        await runCurrencyMigrationAdmin();
                        await loadDashboardData(); // Refresh stats
                      } catch (error) {
                        console.error('Migration failed:', error);
                      }
                    }
                  }}
                  className="mt-2 px-3 py-1 bg-yellow-600 text-white text-xs font-medium rounded-full hover:bg-yellow-700 transition-colors"
                >
                  Run Migration
                </button>
              </div>
            )}

            {/* System Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={exportAllData}
                className="px-6 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📥</span>
                  <div>
                    <p className="font-semibold">Export All Data</p>
                    <p className="text-xs opacity-75">Download JSON backup</p>
                  </div>
                </div>
              </button>

              <button
                onClick={async () => {
                  const orphaned = await findOrphanedData();
                  const total = orphaned.orphanedExpenses.length +
                               orphaned.orphanedGroupMembers.length +
                               orphaned.orphanedInvites.length;

                  if (total === 0) {
                    alert('✅ No orphaned data found! Database is healthy.');
                  } else {
                    console.log('Orphaned data:', orphaned);
                    alert(
                      `⚠️ Found ${total} orphaned items:\n` +
                      `• ${orphaned.orphanedExpenses.length} expenses\n` +
                      `• ${orphaned.orphanedGroupMembers.length} group members\n` +
                      `• ${orphaned.orphanedInvites.length} invites\n\n` +
                      'Check console for details.'
                    );
                  }
                }}
                className="px-6 py-4 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔍</span>
                  <div>
                    <p className="font-semibold">Check Orphaned Data</p>
                    <p className="text-xs opacity-75">Find integrity issues</p>
                  </div>
                </div>
              </button>

              <button
                onClick={loadDashboardData}
                className="px-6 py-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <p className="font-semibold">Refresh Stats</p>
                    <p className="text-xs opacity-75">Reload dashboard data</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Database Stats Display */}
            {stats && (
              <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Database Statistics</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Notifications</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.totalNotifications}</p>
                    <p className="text-xs text-gray-500">{stats.unreadNotifications} unread</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Error Logs</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.errorLogs}</p>
                  </div>
                  {stats.mostExpenses && (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Most Active Group</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.mostExpenses.name}</p>
                      <p className="text-xs text-gray-500">{stats.mostExpenses.count} expenses</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardScreen;
