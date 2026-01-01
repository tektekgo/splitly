import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getAllGroupsAdmin, joinGroupAsAdmin } from '../utils/adminTools';
import type { EnrichedGroup, Group, User } from '../types';

interface AdminGroupBrowserProps {
  currentUserId: string;
  onViewGroup?: (group: Group) => void;
  onDeleteGroup?: (groupId: string) => void;
  onArchiveGroup?: (groupId: string) => void;
}

const AdminGroupBrowser: React.FC<AdminGroupBrowserProps> = ({
  currentUserId,
  onViewGroup,
  onDeleteGroup,
  onArchiveGroup
}) => {
  const [groups, setGroups] = useState<EnrichedGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArchived, setFilterArchived] = useState<'all' | 'active' | 'archived'>('active');
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'expenses' | 'created'>('name');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const allGroups = await getAllGroupsAdmin();
      setGroups(allGroups);
    } catch (error) {
      console.error('Failed to load groups:', error);
      alert('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedGroups = useMemo(() => {
    let filtered = groups;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.name.toLowerCase().includes(searchLower) ||
        g.creatorName?.toLowerCase().includes(searchLower) ||
        g.creatorEmail?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by archived status
    if (filterArchived === 'active') {
      filtered = filtered.filter(g => !g.archived);
    } else if (filterArchived === 'archived') {
      filtered = filtered.filter(g => g.archived);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return b.memberCount - a.memberCount;
        case 'expenses':
          return b.expenseCount - a.expenseCount;
        case 'created':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        default:
          return 0;
      }
    });

    return sorted;
  }, [groups, searchTerm, filterArchived, sortBy]);

  const handleJoinGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Join "${groupName}" as admin?`)) return;

    try {
      await joinGroupAsAdmin(groupId, currentUserId);
      alert('Joined group successfully');
      await loadGroups(); // Refresh
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('Failed to join group');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search groups by name or creator..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* Filter */}
        <select
          value={filterArchived}
          onChange={(e) => setFilterArchived(e.target.value as 'all' | 'active' | 'archived')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Groups</option>
          <option value="active">Active Only</option>
          <option value="archived">Archived Only</option>
        </select>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="name">Sort by Name</option>
          <option value="members">Sort by Members</option>
          <option value="expenses">Sort by Expenses</option>
          <option value="created">Sort by Date</option>
        </select>

        {/* Refresh */}
        <button
          onClick={loadGroups}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-700 disabled:bg-gray-400 transition-colors whitespace-nowrap"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAndSortedGroups.length} of {groups.length} groups
      </div>

      {/* Groups Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading groups...</p>
        </div>
      ) : filteredAndSortedGroups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-600 dark:text-gray-400">No groups found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Expenses
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Currency
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedGroups.map((group) => {
                  const isMember = group.members.includes(currentUserId);

                  return (
                    <tr
                      key={group.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{group.name}</span>
                          {group.archived && (
                            <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                              Archived
                            </span>
                          )}
                          {isMember && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                              Member
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {group.creatorName || 'Unknown'}
                          </p>
                          {group.creatorEmail && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{group.creatorEmail}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900 dark:text-gray-100">
                        {group.memberCount}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900 dark:text-gray-100">
                        {group.expenseCount}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-900 dark:text-gray-100">
                        {group.currency}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isMember && (
                            <button
                              onClick={() => handleJoinGroup(group.id, group.name)}
                              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                            >
                              Join
                            </button>
                          )}
                          <button
                            onClick={() => onViewGroup?.(group)}
                            className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGroupBrowser;
