import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { searchUsers, getUserGroupsAndExpenses, type UserStats } from '../utils/adminTools';
import type { User, Group, FinalExpense, GroupInvite } from '../types';
import { formatCurrency } from '../utils/currencyFormatter';

interface AdminUserLookupProps {
  onDeleteUser?: (userId: string) => void;
}

const AdminUserLookup: React.FC<AdminUserLookupProps> = ({ onDeleteUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserStats[]>([]);
  const [selectedUser, setSelectedUser] = useState<{
    user: User | null;
    groups: Group[];
    expenses: FinalExpense[];
    invitesSent: GroupInvite[];
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleViewUser = async (userId: string) => {
    setLoadingDetails(true);
    try {
      const details = await getUserGroupsAndExpenses(userId);
      setSelectedUser(details);
    } catch (error) {
      console.error('Failed to load user details:', error);
      alert('Failed to load user details');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by name or email..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition-colors"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {searchResults.map((userStat) => (
              <div
                key={userStat.userId}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => handleViewUser(userStat.userId)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{userStat.userName}</p>
                    {userStat.userEmail && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{userStat.userEmail}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>{userStat.groupCount} group{userStat.groupCount !== 1 ? 's' : ''}</span>
                      <span>{userStat.expenseCount} expense{userStat.expenseCount !== 1 ? 's' : ''}</span>
                      <span>{userStat.inviteCount} invite{userStat.inviteCount !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedUser.user?.name || 'Unknown User'}
                  </h2>
                  {selectedUser.user?.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedUser.user.email}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingDetails ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading details...</p>
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-100 opacity-75 uppercase">Groups</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{selectedUser.groups.length}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <p className="text-xs font-medium text-green-900 dark:text-green-100 opacity-75 uppercase">Expenses</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">{selectedUser.expenses.length}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <p className="text-xs font-medium text-purple-900 dark:text-purple-100 opacity-75 uppercase">Invites</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">{selectedUser.invitesSent.length}</p>
                    </div>
                  </div>

                  {/* Groups */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Groups</h3>
                    {selectedUser.groups.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUser.groups.map((group) => (
                          <div
                            key={group.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{group.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {group.members.length} members · {group.currency}
                                </p>
                              </div>
                              {group.archived && (
                                <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                                  Archived
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No groups</p>
                    )}
                  </div>

                  {/* Recent Expenses */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Recent Expenses (Last 10)
                    </h3>
                    {selectedUser.expenses.length > 0 ? (
                      <div className="space-y-2">
                        {selectedUser.expenses.slice(0, 10).map((expense) => (
                          <div
                            key={expense.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{expense.description}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{expense.category}</p>
                              </div>
                              <p className="font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(expense.amount, expense.currency)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No expenses</p>
                    )}
                  </div>

                  {/* Actions */}
                  {onDeleteUser && selectedUser.user && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          if (confirm(`Delete user ${selectedUser.user?.name}? This will remove all their data.`)) {
                            onDeleteUser(selectedUser.user!.id);
                            setSelectedUser(null);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Delete User
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminUserLookup;
