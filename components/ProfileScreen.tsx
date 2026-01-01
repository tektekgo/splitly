import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { User, GroupInvite, Group } from '../types';
import { useAuth } from '../contexts/AuthContext';
import InfoTooltip from './InfoTooltip';
import { DeleteIcon } from './icons';
import { getDatabaseStats, exportAllData, findOrphanedData, runCurrencyMigrationAdmin, deleteUserAndData, getAllUsers, type DatabaseStats, type DeleteUserResult } from '../utils/adminTools';
import VersionFooter from './VersionFooter';
import { formatCurrency } from '../utils/currencyFormatter';
import AdminDashboardScreen from './AdminDashboardScreen';

interface ProfileScreenProps {
    users: User[];
    groups?: Group[];
    onCreateUser: (name: string) => void;
    onDeleteGuestUser: (userId: string) => void;
    onUpdatePaymentInfo?: (paymentInfo: { venmo?: string; zelle?: string; cashApp?: string }, userId?: string) => void;
    onOpenInviteModal?: () => void;
    onOpenGroupManagement?: () => void;
    onOpenGroupSelector?: () => void;
    groupInvites?: GroupInvite[];
    onDeleteInvite?: (inviteId: string) => void;
    onClearCompletedInvites?: () => void;
    onUnarchiveGroup?: (groupId: string) => void;
    currentUserId?: string;
    onViewGroup?: (group: Group) => void;
    onDeleteGroup?: (groupId: string) => void;
    onArchiveGroup?: (groupId: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ users, groups = [], onCreateUser, onDeleteGuestUser, onUpdatePaymentInfo, onOpenInviteModal, onOpenGroupManagement, onOpenGroupSelector, groupInvites = [], onDeleteInvite, onClearCompletedInvites, onUnarchiveGroup, currentUserId, onViewGroup, onDeleteGroup, onArchiveGroup }) => {
    const { currentUser } = useAuth();
    const [profileTab, setProfileTab] = useState<'myProfile' | 'adminDashboard'>('myProfile');
    const [newUserName, setNewUserName] = useState('');
    const [stats, setStats] = useState<DatabaseStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [isEditingPayment, setIsEditingPayment] = useState(false);
    const [editingPaymentUserId, setEditingPaymentUserId] = useState<string | null>(null);
    const [paymentInfo, setPaymentInfo] = useState({
        venmo: '',
        zelle: '',
        cashApp: '',
    });
    const [showUserManagement, setShowUserManagement] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [deletingUsers, setDeletingUsers] = useState(false);
    const [deleteResults, setDeleteResults] = useState<DeleteUserResult[]>([]);

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

    // Initialize payment info when editing starts
    const startEditingPayment = (userId: string | null) => {
        setEditingPaymentUserId(userId);
        setIsEditingPayment(true);
        
        const targetUser = userId 
            ? users.find(u => u.id === userId)
            : loggedInUser;
            
        if (targetUser?.paymentInfo) {
            setPaymentInfo({
                venmo: targetUser.paymentInfo.venmo || '',
                zelle: targetUser.paymentInfo.zelle || '',
                cashApp: targetUser.paymentInfo.cashApp || '',
            });
        } else {
            setPaymentInfo({ venmo: '', zelle: '', cashApp: '' });
        }
    };

    const handleSavePaymentInfo = () => {
        const updatedInfo: { venmo?: string; zelle?: string; cashApp?: string } = {};
        if (paymentInfo.venmo.trim()) updatedInfo.venmo = paymentInfo.venmo.trim();
        if (paymentInfo.zelle.trim()) updatedInfo.zelle = paymentInfo.zelle.trim();
        if (paymentInfo.cashApp.trim()) updatedInfo.cashApp = paymentInfo.cashApp.trim();
        
        onUpdatePaymentInfo?.(updatedInfo, editingPaymentUserId || undefined);
        setIsEditingPayment(false);
        setEditingPaymentUserId(null);
    };

    const handleCancelEditingPayment = () => {
        setIsEditingPayment(false);
        setEditingPaymentUserId(null);
        // Reset to saved values
        const targetUser = editingPaymentUserId 
            ? users.find(u => u.id === editingPaymentUserId)
            : loggedInUser;
        if (targetUser?.paymentInfo) {
            setPaymentInfo({
                venmo: targetUser.paymentInfo.venmo || '',
                zelle: targetUser.paymentInfo.zelle || '',
                cashApp: targetUser.paymentInfo.cashApp || '',
            });
        } else {
            setPaymentInfo({ venmo: '', zelle: '', cashApp: '' });
        }
    };

    return (
        <div className="overflow-hidden">
            <div className="px-4 py-3 sm:px-6 sm:py-4 space-y-3">
                {/* Header */}
                <div>
                    <h2 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                        Profile
                    </h2>
                </div>

                {/* Tab Navigation (Admin Only) */}
                {isAdmin && (
                    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                        <button
                            onClick={() => setProfileTab('myProfile')}
                            className={`px-4 py-2 font-semibold transition-colors text-sm border-b-2 ${
                                profileTab === 'myProfile'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            My Profile
                        </button>
                        <button
                            onClick={() => setProfileTab('adminDashboard')}
                            className={`px-4 py-2 font-semibold transition-colors text-sm border-b-2 ${
                                profileTab === 'adminDashboard'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            🔧 Admin Dashboard
                        </button>
                    </div>
                )}

                {/* My Profile Tab */}
                {profileTab === 'myProfile' && (
                    <>
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

                {/* Payment Info Section */}
                <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            {editingPaymentUserId ? `Payment Info - ${users.find(u => u.id === editingPaymentUserId)?.name}` : 'Your Payment Info'}
                        </h3>
                        {!isEditingPayment && (
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => startEditingPayment(null)}
                                className="text-xs text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                            >
                                {loggedInUser?.paymentInfo ? 'Edit' : 'Add'}
                            </motion.button>
                        )}
                    </div>
                    {isEditingPayment && !editingPaymentUserId ? (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Venmo Username
                                </label>
                                <input
                                    type="text"
                                    value={paymentInfo.venmo}
                                    onChange={(e) => setPaymentInfo({ ...paymentInfo, venmo: e.target.value })}
                                    placeholder="@username"
                                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Zelle Email/Phone
                                </label>
                                <input
                                    type="text"
                                    value={paymentInfo.zelle}
                                    onChange={(e) => setPaymentInfo({ ...paymentInfo, zelle: e.target.value })}
                                    placeholder="email@example.com or phone"
                                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Cash App Username
                                </label>
                                <input
                                    type="text"
                                    value={paymentInfo.cashApp}
                                    onChange={(e) => setPaymentInfo({ ...paymentInfo, cashApp: e.target.value })}
                                    placeholder="$cashtag"
                                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-gray-600 border border-slate-200 dark:border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div className="flex gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSavePaymentInfo}
                                    className="flex-1 px-3 py-1.5 bg-primary text-white font-medium rounded-md text-sm hover:bg-primary-700 transition-colors"
                                >
                                    Save
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCancelEditingPayment}
                                    className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                >
                                    Cancel
                                </motion.button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                💡 This info will be visible to group members when they want to pay you.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {loggedInUser?.paymentInfo ? (
                                <>
                                    {loggedInUser.paymentInfo.venmo && (
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            💙 Venmo: <span className="font-medium">{loggedInUser.paymentInfo.venmo}</span>
                                        </p>
                                    )}
                                    {loggedInUser.paymentInfo.zelle && (
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            💜 Zelle: <span className="font-medium">{loggedInUser.paymentInfo.zelle}</span>
                                        </p>
                                    )}
                                    {loggedInUser.paymentInfo.cashApp && (
                                        <p className="text-sm text-slate-700 dark:text-slate-300">
                                            💚 Cash App: <span className="font-medium">{loggedInUser.paymentInfo.cashApp}</span>
                                        </p>
                                    )}
                                    {!loggedInUser.paymentInfo.venmo && !loggedInUser.paymentInfo.zelle && !loggedInUser.paymentInfo.cashApp && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400">No payment info added yet</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-xs text-slate-500 dark:text-slate-400">No payment info added yet</p>
                            )}
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
                        <ul className="space-y-2">
                            {simulatedUsers.map(user => (
                                <li key={user.id} className="p-2 bg-slate-50 dark:bg-gray-600 rounded-md group/item hover:bg-slate-100 dark:hover:bg-gray-500 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
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
                                    </div>
                                    
                                    {/* Guest User Payment Info */}
                                    {isEditingPayment && editingPaymentUserId === user.id ? (
                                        <div className="mt-2 space-y-2 pt-2 border-t border-slate-200 dark:border-gray-500">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Venmo Username
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentInfo.venmo}
                                                    onChange={(e) => setPaymentInfo({ ...paymentInfo, venmo: e.target.value })}
                                                    placeholder="@username"
                                                    className="w-full px-2 py-1 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-500 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Zelle Email/Phone
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentInfo.zelle}
                                                    onChange={(e) => setPaymentInfo({ ...paymentInfo, zelle: e.target.value })}
                                                    placeholder="email@example.com or phone"
                                                    className="w-full px-2 py-1 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-500 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Cash App Username
                                                </label>
                                                <input
                                                    type="text"
                                                    value={paymentInfo.cashApp}
                                                    onChange={(e) => setPaymentInfo({ ...paymentInfo, cashApp: e.target.value })}
                                                    placeholder="$cashtag"
                                                    className="w-full px-2 py-1 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-500 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <motion.button
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleSavePaymentInfo}
                                                    className="flex-1 px-2 py-1 bg-primary text-white font-medium rounded-md text-xs hover:bg-primary-700 transition-colors"
                                                >
                                                    Save
                                                </motion.button>
                                                <motion.button
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleCancelEditingPayment}
                                                    className="flex-1 px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-md text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                                >
                                                    Cancel
                                                </motion.button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-gray-500">
                                            {user.paymentInfo ? (
                                                <div className="space-y-1">
                                                    {user.paymentInfo.venmo && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            💙 Venmo: <span className="font-medium">{user.paymentInfo.venmo}</span>
                                                        </p>
                                                    )}
                                                    {user.paymentInfo.zelle && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            💜 Zelle: <span className="font-medium">{user.paymentInfo.zelle}</span>
                                                        </p>
                                                    )}
                                                    {user.paymentInfo.cashApp && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            💚 Cash App: <span className="font-medium">{user.paymentInfo.cashApp}</span>
                                                        </p>
                                                    )}
                                                    {!user.paymentInfo.venmo && !user.paymentInfo.zelle && !user.paymentInfo.cashApp && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-500">No payment info</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">No payment info</p>
                                            )}
                                            <motion.button
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => startEditingPayment(user.id)}
                                                className="text-xs text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium mt-1"
                                            >
                                                {user.paymentInfo ? 'Edit Payment Info' : 'Add Payment Info'}
                                            </motion.button>
                                        </div>
                                    )}
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
                        Send email invites to people who will create their own Split<span className="text-primary">Bi</span> accounts
                    </p>
                    <div className="space-y-2">
                        <button
                            onClick={() => onOpenInviteModal?.()}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-teal-light dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                        >
                            <span className="text-primary dark:text-primary-400">📧</span>
                            <span className="text-base font-bold text-primary dark:text-primary-400">Send Email Invite</span>
                        </button>
                        <button
                            onClick={() => onOpenGroupSelector?.()}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-teal-light dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                        >
                            <span className="text-primary dark:text-primary-400">👥</span>
                            <span className="text-base font-bold text-primary dark:text-primary-400">Manage Group Members</span>
                        </button>
                    </div>
                </div>

                {/* Invite Status Section */}
                {groupInvites.length > 0 && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Invite Status</h3>
                            {onClearCompletedInvites && (() => {
                                const completedInvites = groupInvites.filter(inv => {
                                    if (inv.status === 'pending') {
                                        return new Date(inv.expiresAt) < new Date(); // Expired
                                    }
                                    return inv.status === 'accepted' || inv.status === 'declined';
                                });
                                return completedInvites.length > 0 ? (
                                    <button
                                        onClick={onClearCompletedInvites}
                                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                        title="Clear all completed invites"
                                    >
                                        Clear Completed ({completedInvites.length})
                                    </button>
                                ) : null;
                            })()}
                        </div>
                        <div className="space-y-2">
                            {groupInvites.map(invite => {
                                const isExpired = new Date(invite.expiresAt) < new Date();
                                const statusColor = invite.status === 'pending' 
                                    ? (isExpired ? 'text-orange-500 dark:text-orange-400' : 'text-primary dark:text-primary-400')
                                    : invite.status === 'accepted' 
                                    ? 'text-primary dark:text-primary-400'
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
                                            {onDeleteInvite && (
                                                <button
                                                    onClick={() => onDeleteInvite(invite.id)}
                                                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                                                    title="Delete invite"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Archived Groups Section */}
                {(() => {
                    const archivedGroupsList = groups.filter(g => g.archived);
                    return archivedGroupsList.length > 0 ? (
                        <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-slate-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Archived Groups</h3>
                                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                                    {archivedGroupsList.length}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {archivedGroupsList.map(group => {
                                    const isCreatedByUser = currentUserId && group.createdBy === currentUserId;
                                    return (
                                        <div key={group.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-gray-600 rounded-md">
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                                                        {group.name}
                                                    </p>
                                                    {isCreatedByUser && (
                                                        <svg 
                                                            className="w-3.5 h-3.5 flex-shrink-0 text-amber-500 dark:text-amber-400"
                                                            fill="currentColor" 
                                                            viewBox="0 0 20 20"
                                                            title="You created this group"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {group.members.length} {group.members.length === 1 ? 'member' : 'members'} • Archived {group.archivedAt ? new Date(group.archivedAt).toLocaleDateString() : 'recently'}
                                                </p>
                                            </div>
                                            {onUnarchiveGroup && (
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        if (window.confirm(`Unarchive "${group.name}"? It will appear in your active groups again.`)) {
                                                            onUnarchiveGroup(group.id);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-300 rounded-md hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors font-medium flex-shrink-0"
                                                    title="Unarchive group"
                                                >
                                                    Restore
                                                </motion.button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null;
                })()}
                    </>
                )}

                {/* Admin Dashboard Tab */}
                {profileTab === 'adminDashboard' && isAdmin && (
                    <AdminDashboardScreen
                        currentUserId={currentUserId || currentUser?.id || ''}
                        onViewGroup={onViewGroup}
                        onDeleteUser={onDeleteGuestUser}
                        onDeleteGroup={onDeleteGroup}
                        onArchiveGroup={onArchiveGroup}
                    />
                )}

                {/* User Management Modal */}
                {showUserManagement && (
                    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-stone-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-stone-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-red-900 dark:text-red-100">
                                        🗑️ User Management
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowUserManagement(false);
                                            setSelectedUserIds(new Set());
                                            setDeleteResults([]);
                                        }}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    Select users to delete. This will remove the user and all associated data (groups, expenses, invites, notifications).
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {loadingStats ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4 flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {selectedUserIds.size} of {allUsers.length} selected
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const allIds = new Set(allUsers.map(u => u.id));
                                                        allIds.delete(currentUser?.id || ''); // Don't select yourself
                                                        setSelectedUserIds(allIds);
                                                    }}
                                                    className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    onClick={() => setSelectedUserIds(new Set())}
                                                    className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                                >
                                                    Deselect All
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {allUsers.map(user => {
                                                const isCurrentUser = user.id === currentUser?.id;
                                                const isSelected = selectedUserIds.has(user.id);
                                                const userType = user.authType === 'simulated' ? 'Guest' : user.authType === 'google' ? 'Google' : 'Email';
                                                
                                                return (
                                                    <div
                                                        key={user.id}
                                                        className={`p-4 rounded-lg border-2 transition-all ${
                                                            isSelected
                                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                                : 'border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-700'
                                                        } ${isCurrentUser ? 'opacity-50' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    const newSelected = new Set(selectedUserIds);
                                                                    if (e.target.checked && !isCurrentUser) {
                                                                        newSelected.add(user.id);
                                                                    } else {
                                                                        newSelected.delete(user.id);
                                                                    }
                                                                    setSelectedUserIds(newSelected);
                                                                }}
                                                                disabled={isCurrentUser}
                                                                className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                        {user.name}
                                                                    </p>
                                                                    {isCurrentUser && (
                                                                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                                            You
                                                                        </span>
                                                                    )}
                                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                                                                        {userType}
                                                                    </span>
                                                                </div>
                                                                {user.email && (
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                                        {user.email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {deleteResults.length > 0 && (
                                            <div className="mt-4 space-y-3">
                                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                                                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                                                        Deletion Results:
                                                    </h3>
                                                    <div className="space-y-2 text-sm">
                                                        {deleteResults.map((result, idx) => (
                                                            <div key={idx} className={result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                                                                {result.success ? '✅' : '❌'} {result.userName}: {result.success ? 'Firestore data deleted' : result.errors.join(', ')}
                                                                {result.success && (
                                                                    <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                                                                        (Groups: {result.deleted.groups}, Expenses: {result.deleted.expenses}, Invites: {result.deleted.invites})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                {deleteResults.some(r => r.success && r.warning) && (
                                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg">
                                                        <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                                                            <span>⚠️</span>
                                                            <span>Important: Firebase Auth Accounts Not Deleted</span>
                                                        </h3>
                                                        <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                                                            The Firestore data was deleted, but the Firebase Authentication accounts still exist. 
                                                            Users can still sign in with these email addresses.
                                                        </p>
                                                        <p className="text-xs text-red-700 dark:text-red-400">
                                                            To delete Auth accounts, go to Firebase Console → Authentication → Users and delete them manually, 
                                                            or create a Cloud Function with Admin SDK to delete them programmatically.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="p-6 border-t border-stone-200 dark:border-gray-700 flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        setShowUserManagement(false);
                                        setSelectedUserIds(new Set());
                                        setDeleteResults([]);
                                    }}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (selectedUserIds.size === 0) {
                                            alert('Please select at least one user to delete');
                                            return;
                                        }

                                        const confirmMessage = `⚠️ WARNING: This will permanently delete ${selectedUserIds.size} user(s) and ALL associated Firestore data:\n\n` +
                                            `• User documents\n` +
                                            `• Groups (or remove user from groups)\n` +
                                            `• Expenses\n` +
                                            `• Invites\n` +
                                            `• Notifications\n\n` +
                                            `⚠️ IMPORTANT: Firebase Authentication accounts will NOT be deleted.\n` +
                                            `Users can still sign in. Delete Auth accounts manually in Firebase Console.\n\n` +
                                            `This action CANNOT be undone!\n\n` +
                                            `Are you absolutely sure?`;

                                        if (!window.confirm(confirmMessage)) {
                                            return;
                                        }

                                        setDeletingUsers(true);
                                        setDeleteResults([]);

                                        const results: DeleteUserResult[] = [];
                                        for (const userId of selectedUserIds) {
                                            try {
                                                const result = await deleteUserAndData(userId, currentUser?.id || '');
                                                results.push(result);
                                                setDeleteResults([...results]);
                                            } catch (error: any) {
                                                results.push({
                                                    success: false,
                                                    userId,
                                                    userName: 'Unknown',
                                                    deleted: { user: false, groups: 0, expenses: 0, invites: 0, notifications: 0 },
                                                    errors: [error.message || 'Unknown error']
                                                });
                                                setDeleteResults([...results]);
                                            }
                                        }

                                        setDeletingUsers(false);
                                        setSelectedUserIds(new Set());
                                        
                                        // Refresh users list
                                        try {
                                            const users = await getAllUsers();
                                            setAllUsers(users);
                                        } catch (error) {
                                            console.error('Failed to refresh users:', error);
                                        }

                                        const successCount = results.filter(r => r.success).length;
                                        const hasWarnings = results.some(r => r.success && r.warning);
                                        
                                        let alertMessage = `Deletion complete!\n\nSuccessfully deleted Firestore data: ${successCount}\nFailed: ${results.length - successCount}`;
                                        if (hasWarnings) {
                                            alertMessage += `\n\n⚠️ WARNING: Firebase Auth accounts were NOT deleted.\nUsers can still sign in. Delete Auth accounts manually in Firebase Console.`;
                                        }
                                        alert(alertMessage);
                                    }}
                                    disabled={selectedUserIds.size === 0 || deletingUsers}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {deletingUsers ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            <span>Deleting...</span>
                                        </>
                                    ) : (
                                        <>
                                            🗑️ Delete Selected ({selectedUserIds.size})
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Version Footer */}
                <VersionFooter className="pt-4 mt-4 border-t border-slate-200 dark:border-gray-600" />
            </div>
        </div>
    );
};

export default ProfileScreen;