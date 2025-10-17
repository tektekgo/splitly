import React, { useState, useMemo } from 'react';
import type { User, GroupInvite } from '../types';
import { useAuth } from '../contexts/AuthContext';
import InfoTooltip from './InfoTooltip';
import { DeleteIcon } from './icons';
import { getDatabaseStats, exportAllData, findOrphanedData, runCurrencyMigrationAdmin, type DatabaseStats } from '../utils/adminTools';

interface ProfileScreenProps {
    users: User[];
    onCreateUser: (name: string) => void;
    onDeleteGuestUser: (userId: string) => void;
    onOpenInviteModal?: () => void;
    onOpenGroupManagement?: () => void;
    onOpenGroupSelector?: () => void;
    groupInvites?: GroupInvite[];
    onResendInvite?: (inviteId: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ users, onCreateUser, onDeleteGuestUser, onOpenInviteModal, onOpenGroupManagement, onOpenGroupSelector, groupInvites = [], onResendInvite }) => {
    const { currentUser } = useAuth();
    const [newUserName, setNewUserName] = useState('');
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Check if current user is admin (set role: 'admin' in Firebase Console)
    const isAdmin = currentUser?.role === 'admin';

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUserName.trim() === '') return;
        onCreateUser(newUserName.trim());
        setNewUserName('');
    };

    // Separate logged-in user from simulated/guest users
    const { loggedInUser, simulatedUsers } = useMemo(() => {
        const loggedIn = users.find(u => u.id === currentUser?.id);
        const simulated = users.filter(u => u.authType === 'simulated');
        return { loggedInUser: loggedIn, simulatedUsers: simulated };
    }, [users, currentUser]);

    return (
        <main className="bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
            <div className="p-3 space-y-3">
                {/* Header */}
                <div>
                    <h2 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                        Profile
                    </h2>
                </div>

                {/* Your Account */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
                    <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Your Account</h3>
                    {loggedInUser && (
                        <div className="flex items-center gap-2">
                            <img src={loggedInUser.avatarUrl} alt={loggedInUser.name} className="w-8 h-8 rounded-full ring-1 ring-primary" />
                            <div>
                                <p className="text-base font-bold text-slate-800 dark:text-slate-100">{loggedInUser.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {loggedInUser.authType === 'google' ? 'Google' : 
                                     loggedInUser.authType === 'email' ? 'Email' : 
                                     'Auth'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>


                {/* Guest Users Section */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Guest Users</h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                            {simulatedUsers.length}
                        </span>
                    </div>
                    
                    {simulatedUsers.length > 0 ? (
                        <ul className="space-y-1">
                            {simulatedUsers.map(user => (
                                <li key={user.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-600 rounded-md group/item hover:bg-slate-100 dark:hover:bg-gray-500 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <img src={user.avatarUrl} alt={user.name} className="w-6 h-6 rounded-full" />
                                        <span className="text-base font-bold text-slate-800 dark:text-slate-100">{user.name}</span>
                                    </div>
                                    <button
                                        onClick={() => onDeleteGuestUser(user.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="Delete"
                                    >
                                        <DeleteIcon className="w-4 h-4"/>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-xs text-slate-500 dark:text-slate-400">No guest users yet</p>
                        </div>
                    )}
                </div>

                {/* Add Guest User Form */}
                <form onSubmit={handleAddUser} className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
                    <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Add Guest User</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Enter name"
                                className="block w-full px-2 py-1.5 bg-slate-50 dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                            <button
                                type="submit"
                            disabled={!newUserName.trim()}
                            className="px-3 py-1.5 bg-primary text-white font-medium rounded-md text-sm hover:bg-primary-600 focus:outline-none focus:ring-1 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            Add Person
                        </button>
                    </div>
                </form>

                {/* Invite Real User Section */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
                    <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Invite Real Users</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        Send email invites to people who will create their own Splitbi accounts
                    </p>
                    <div className="space-y-2">
                        <button
                            onClick={() => onOpenInviteModal?.()}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                        >
                            <span className="text-blue-600 dark:text-blue-400">📧</span>
                            <span className="text-base font-bold text-blue-700 dark:text-blue-400">Send Email Invite</span>
                        </button>
                        <button
                            onClick={() => onOpenGroupSelector?.()}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                        >
                            <span className="text-green-600 dark:text-green-400">👥</span>
                            <span className="text-base font-bold text-green-700 dark:text-green-400">Manage Group Members</span>
                        </button>
                    </div>
                </div>

                {/* Invite Status Section */}
                {groupInvites.length > 0 && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
                        <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">Invite Status</h3>
                        <div className="space-y-2">
                            {groupInvites.map(invite => {
                                const isExpired = new Date(invite.expiresAt) < new Date();
                                const statusColor = invite.status === 'pending' 
                                    ? (isExpired ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400')
                                    : invite.status === 'accepted' 
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400';
                                
                                const statusText = invite.status === 'pending' 
                                    ? (isExpired ? 'Expired' : 'Pending')
                                    : invite.status === 'accepted' 
                                    ? 'Accepted'
                                    : 'Declined';

                                return (
                                    <div key={invite.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-600 rounded-md">
                                        <div className="flex-grow min-w-0">
                                            <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                                                {invite.invitedEmail}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {invite.groupName} • {statusText}
                                            </p>
                                            {invite.status === 'pending' && !isExpired && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-medium ${statusColor}`}>
                                                {statusText}
                                            </span>
                                            {invite.status === 'pending' && !isExpired && onResendInvite && (
                                                <button
                                                    onClick={() => onResendInvite(invite.id)}
                                                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                                                    title="Resend invite"
                                                >
                                                    Resend
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ⚠️ ADMIN TOOLS - Only visible to admins */}
                {isAdmin && (
                    <div className="mt-6 p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-red-900 dark:text-red-100">
                                🔧 Admin Tools
                            </h3>
                            <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                                ADMIN ONLY
                            </span>
                        </div>

                        {/* Database Stats */}
                        <div className="mb-4">
                            <button
                                onClick={async () => {
                                    setLoadingStats(true);
                                    try {
                                        const data = await getDatabaseStats();
                                        setStats(data);
                                    } catch (error) {
                                        alert('Failed to load stats');
                                    } finally {
                                        setLoadingStats(false);
                                    }
                                }}
                                disabled={loadingStats}
                                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                            >
                                {loadingStats ? '⏳ Loading...' : '📊 View Database Stats'}
                            </button>

                            {/* Currency Migration Status */}
                            {stats && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                                        💰 Currency Migration Status:
                                    </p>
                                    <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                                        Groups needing migration: {stats.currencyMigrationNeeded.groupsNeedMigration}
                                        <br />
                                        Expenses needing migration: {stats.currencyMigrationNeeded.expensesNeedMigration}
                                    </p>
                                    {(stats.currencyMigrationNeeded.groupsNeedMigration > 0 || stats.currencyMigrationNeeded.expensesNeedMigration > 0) && (
                                        <button
                                            onClick={async () => {
                                                if (confirm('Run currency migration for existing data? This will add USD currency to groups and expenses that don\'t have it.')) {
                                                    try {
                                                        await runCurrencyMigrationAdmin();
                                                        // Refresh stats after migration
                                                        const data = await getDatabaseStats();
                                                        setStats(data);
                                                    } catch (error) {
                                                        console.error('Migration failed:', error);
                                                    }
                                                }
                                            }}
                                            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                                        >
                                            🚀 Run Currency Migration
                                        </button>
                                    )}
                                </div>
                            )}

                            {stats && (
                                <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg text-sm">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Total Users</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
                                            <p className="text-xs text-gray-500">
                                                {stats.realUsers} real, {stats.simulatedUsers} guest
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Total Groups</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalGroups}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Total Expenses</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalExpenses}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600 dark:text-gray-400">Pending Invites</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingInvites}</p>
                                        </div>
                                        {stats.largestGroup && (
                                            <div className="col-span-2">
                                                <p className="text-gray-600 dark:text-gray-400">Largest Group</p>
                                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {stats.largestGroup.name} ({stats.largestGroup.members} members)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Admin Actions */}
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={exportAllData}
                                className="px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                            >
                                📥 Export All Data (Backup)
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
                                className="px-4 py-3 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                                🔍 Check for Orphaned Data
                            </button>
                        </div>

                        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                            <p className="text-xs text-yellow-900 dark:text-yellow-100">
                                💡 <strong>Note:</strong> To enable admin tools for another user, set their user document field: <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">role: "admin"</code> in Firebase Console.
                            </p>
                        </div>
                </div>
                )}
            </div>
        </main>
    );
};

export default ProfileScreen;