
import React, { useState, useMemo, useEffect } from 'react';
import type { Group, User, GroupInvite } from '../types';
import { DeleteIcon } from './icons';

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  allUsers: User[];
  currentUserId: string;
  onSave: (updatedGroup: Group) => void;
  onDelete: (groupId: string) => void;
  onArchive?: (groupId: string) => void;
  onUnarchive?: (groupId: string) => void;
  totalDebt: number;
  onCreateUser: (name: string) => Promise<void>;
  groupInvites?: GroupInvite[];
  onInviteMember?: () => void;
  onDeleteInvite?: (inviteId: string) => void;
}

const GroupManagementModal: React.FC<GroupManagementModalProps> = ({ isOpen, onClose, group, allUsers, currentUserId, onSave, onDelete, onArchive, onUnarchive, totalDebt, onCreateUser, groupInvites = [], onInviteMember, onDeleteInvite }) => {
  const [groupName, setGroupName] = useState(group.name);
  const [memberIds, setMemberIds] = useState(group.members);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  useEffect(() => {
    if (group) {
        setGroupName(group.name);
        setMemberIds(group.members);
        setShowDeleteConfirm(false);
        setSelectedUserToAdd('');
        setIsCreatingUser(false);
        setNewUserName('');
    }
  }, [group]);

  const currentMembers = useMemo(() => {
    return allUsers.filter(u => memberIds.includes(u.id));
  }, [allUsers, memberIds]);
  
  const availableUsersToAdd = useMemo(() => {
    return allUsers.filter(u => !memberIds.includes(u.id));
  }, [allUsers, memberIds]);
  
  // Helper to count how many users have the same name (for display purposes)
  const getUsersWithSameName = useMemo(() => {
    const nameCounts = new Map<string, number>();
    availableUsersToAdd.forEach(u => {
      const count = nameCounts.get(u.name.toLowerCase()) || 0;
      nameCounts.set(u.name.toLowerCase(), count + 1);
    });
    return nameCounts;
  }, [availableUsersToAdd]);

  const isDeleteDisabled = totalDebt > 0.01;
  const isArchived = group.archived || false;
  const canArchive = !isArchived && totalDebt < 0.01; // Can archive when all debts are settled

  if (!isOpen) return null;

  const handleAddMember = () => {
    if (selectedUserToAdd && !memberIds.includes(selectedUserToAdd)) {
      const userToAdd = allUsers.find(u => u.id === selectedUserToAdd);
      if (!userToAdd) return;
      
      // Check if a member with the same name already exists in the group
      const existingMemberWithSameName = currentMembers.find(
        m => m.name.toLowerCase() === userToAdd.name.toLowerCase()
      );
      
      if (existingMemberWithSameName) {
        const confirmMessage = `A member named "${userToAdd.name}" already exists in this group.\n\n` +
          `Would you like to add another member with the same name?\n\n` +
          `(Note: You'll have multiple members with the same name, which may be confusing.)`;
        
        if (!window.confirm(confirmMessage)) {
          setSelectedUserToAdd(''); // Clear selection
          return; // User cancelled
        }
      }
      
      setMemberIds([...memberIds, selectedUserToAdd]);
      setSelectedUserToAdd('');
    }
  };

  const handleRemoveMember = (userId: string) => {
    if (userId === currentUserId) {
      alert("You cannot remove yourself from the group.");
      return;
    }
    if (window.confirm("Are you sure you want to remove this member? This cannot be undone.")) {
        setMemberIds(memberIds.filter(id => id !== userId));
    }
  };
  
  const handleSave = () => {
    if (groupName.trim() === '') {
        alert('Group name cannot be empty.');
        return;
    }
    // Remove any duplicate member IDs before saving
    const uniqueMemberIds = Array.from(new Set(memberIds));
    if (uniqueMemberIds.length !== memberIds.length) {
        console.warn('Duplicate members detected and removed:', memberIds.length - uniqueMemberIds.length);
        setMemberIds(uniqueMemberIds);
    }
    onSave({ ...group, name: groupName, members: uniqueMemberIds });
  };

  const handleRequestDelete = () => {
    if (isDeleteDisabled) {
        // This is primarily handled by the disabled attribute, but this is a safeguard.
        return;
    }
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(group.id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg border border-stone-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Group Settings</h2>
            <p className="text-sm text-sage dark:text-gray-400 mt-1">Manage members, invites, and settings for {group.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
            <div>
                <label htmlFor="groupName" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Group Name</label>
                <input
                    id="groupName"
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
            </div>
            <div>
                <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">
                  Members
                  <span className="text-xs font-normal text-text-secondary-light dark:text-text-secondary-dark ml-2">
                    (Real Users & Guest Users in this group)
                  </span>
                </h3>
                <ul className="space-y-2">
                    {currentMembers.map(member => (
                        <li key={member.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-stone-100 dark:border-gray-600">
                            <div className="flex items-center">
                                <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full mr-3" />
                                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{member.name}</span>
                            </div>
                            {member.id !== currentUserId && (
                                <button onClick={() => handleRemoveMember(member.id)} className="p-2 text-gray-400 hover:text-error dark:hover:text-error-hover rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                    <DeleteIcon className="w-5 h-5"/>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Add Members Section - Three Equal Options */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-3">Add Members</h3>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3">
                <strong>Member</strong> = Anyone in your group (can be a Real User or Guest User)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option 1: Invite Real User */}
                {onInviteMember && (
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 border-2 border-primary/20 dark:border-primary/30 hover:border-primary/40 dark:hover:border-primary/50 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center mb-2 group-hover:bg-primary/30 dark:group-hover:bg-primary/40 transition-colors">
                        <span className="text-xl">📧</span>
                      </div>
                      <h4 className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark mb-1">
                        Invite Real User
                      </h4>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3 leading-tight">
                        Invite by email (they'll create an account)
                      </p>
                      <button
                        type="button"
                        onClick={onInviteMember}
                        className="w-full px-3 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition-colors text-sm"
                      >
                        Invite
                      </button>
                    </div>
                  </div>
                )}

                {/* Option 2: Add Guest User */}
                <div 
                  className={`bg-sage/5 dark:bg-sage/10 rounded-lg p-4 border-2 ${!isCreatingUser ? 'border-sage/20 dark:border-sage/30 hover:border-sage/40 dark:hover:border-sage/50' : 'border-sage/40 dark:border-sage/50'} transition-all cursor-pointer group`}
                  onClick={() => !isCreatingUser && setIsCreatingUser(true)}
                >
                  {!isCreatingUser ? (
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-sage/20 dark:bg-sage/30 flex items-center justify-center mb-2 group-hover:bg-sage/30 dark:group-hover:bg-sage/40 transition-colors">
                        <span className="text-xl">👤</span>
                      </div>
                      <h4 className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark mb-1">
                        Add Guest User
                      </h4>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3 leading-tight">
                        Create member (no login needed)
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreatingUser(true);
                        }}
                        className="w-full px-3 py-2 bg-sage text-white font-medium rounded-lg hover:bg-sage-600 transition-colors text-sm"
                      >
                        Add Guest
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        Guest User Name
                      </label>
                      <input
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="Enter name"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-sage text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newUserName.trim()) {
                            onCreateUser(newUserName.trim());
                            setNewUserName('');
                            setIsCreatingUser(false);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (newUserName.trim()) {
                              await onCreateUser(newUserName.trim());
                              setNewUserName('');
                              setIsCreatingUser(false);
                            }
                          }}
                          disabled={!newUserName.trim()}
                          className="flex-1 px-3 py-1.5 bg-sage text-white rounded-lg hover:bg-sage-600 text-xs font-medium disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsCreatingUser(false);
                            setNewUserName('');
                          }}
                          className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 3: Add Existing Member */}
                {availableUsersToAdd.length > 0 ? (
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700/50 transition-all">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-800/30 flex items-center justify-center mb-2">
                        <span className="text-xl">➕</span>
                      </div>
                      <h4 className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark mb-1">
                        Add Existing Member
                      </h4>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3 leading-tight">
                        From your Guest Users
                      </p>
                      <div className="w-full space-y-2">
                        <select
                          id="addMemberSelect"
                          value={selectedUserToAdd}
                          onChange={(e) => setSelectedUserToAdd(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                        >
                          <option value="" disabled>Select member...</option>
                          {availableUsersToAdd.map((user, index) => {
                            const sameNameCount = getUsersWithSameName.get(user.name.toLowerCase()) || 0;
                            // If multiple users have the same name, show a number to distinguish them
                            const displayName = sameNameCount > 1 
                              ? `${user.name} (${availableUsersToAdd.filter((u, idx) => u.name.toLowerCase() === user.name.toLowerCase() && idx <= index).length} of ${sameNameCount})`
                              : user.name;
                            return (
                              <option key={user.id} value={user.id}>
                                {displayName}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddMember}
                          disabled={!selectedUserToAdd}
                          className="w-full px-3 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600 opacity-50">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mb-2">
                        <span className="text-xl">➕</span>
                      </div>
                      <h4 className="font-semibold text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Add Existing Member
                      </h4>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        No available members
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Show pending invites for this group */}
              {onInviteMember && groupInvites.filter(inv => inv.groupId === group.id && inv.status === 'pending').length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-stone-100 dark:border-gray-600">
                  <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                    Pending Invites:
                  </p>
                  <ul className="space-y-2">
                    {groupInvites
                      .filter(inv => inv.groupId === group.id && inv.status === 'pending')
                      .map(invite => {
                        const isExpired = new Date(invite.expiresAt) < new Date();
                        return (
                          <li key={invite.id} className="text-xs text-text-secondary-light dark:text-text-secondary-dark flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-grow min-w-0">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isExpired ? 'bg-orange-500' : 'bg-yellow-500'}`}></span>
                              <span className="truncate">{invite.invitedEmail}</span>
                              <span className="text-gray-400 flex-shrink-0">
                                {isExpired ? '(expired)' : '(waiting)'}
                              </span>
                            </div>
                            {onDeleteInvite && (
                              <button
                                onClick={() => onDeleteInvite(invite.id)}
                                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                                title="Delete invite"
                              >
                                🗑️
                              </button>
                            )}
                          </li>
                        );
                      })
                    }
                  </ul>
                </div>
              )}
            </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-stone-200 dark:border-gray-600 rounded-b-2xl">
            {showDeleteConfirm ? (
                <div className="w-full text-center">
                    <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">Are you sure you want to delete this group?</p>
                    <p className="text-sm text-error">This action cannot be undone.</p>
                    <div className="mt-3 flex justify-center gap-3">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-5 py-2 bg-error text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            Confirm Delete
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {isArchived ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-sage/20 dark:bg-sage/30 text-sage dark:text-sage font-semibold rounded-lg text-sm">
                                    Archived
                                </span>
                                {onUnarchive && (
                                    <button
                                        onClick={() => {
                                            onUnarchive(group.id);
                                            onClose();
                                        }}
                                        className="px-5 py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-300 font-semibold rounded-lg hover:bg-primary/20 dark:hover:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                    >
                                        Unarchive
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {canArchive && onArchive && (
                                <div className="mb-4 p-3 bg-[#1E3450]/10 dark:bg-[#1E3450]/20 rounded-lg border border-[#1E3450]/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-[#1E3450] dark:text-[#1E3450]">No debts to settle in Group</p>
                                            <p className="text-xs text-sage dark:text-gray-400 mt-0.5">Archive this group to keep it for reference</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Archive this group? You can unarchive it later from the Archived Groups section.')) {
                                                    onArchive(group.id);
                                                    onClose();
                                                }
                                            }}
                                            className="px-4 py-2 bg-[#1E3450] text-white font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3450] transition-colors text-sm"
                                            title="Archive this group to keep it for reference without cluttering your active groups"
                                        >
                                            Archive
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-center gap-3">
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleRequestDelete}
                                        disabled={isDeleteDisabled}
                                        className="px-5 py-2 bg-red-100 dark:bg-red-900/30 text-error font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                        title={isDeleteDisabled ? `Settle outstanding debts of $${totalDebt.toFixed(2)} to enable deletion` : 'Permanently delete this group and all its expenses'}
                                    >
                                        Delete Group
                                    </button>
                                    {isDeleteDisabled && <p className="text-xs text-error mt-1">Settle debts to delete.</p>}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-5 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GroupManagementModal;
