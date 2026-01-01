/**
 * ADMIN TOOLS
 * 
 * Basic troubleshooting and monitoring tools for production
 * Only accessible to users with role: 'admin'
 */

import { db } from '../firebase';
import { collection, getDocs, query, where, doc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import type { User, Group, FinalExpense, GroupInvite, Notification } from '../types';
import { runCurrencyMigration, checkMigrationNeeded } from './currencyMigration';
import { getErrorLogs, exportErrorLogs, clearErrorLogs, getErrorSolutions } from './errorLogger';

export interface DatabaseStats {
  totalUsers: number;
  realUsers: number;
  simulatedUsers: number;
  totalGroups: number;
  totalExpenses: number;
  totalInvites: number;
  pendingInvites: number;
  totalNotifications: number;
  unreadNotifications: number;
  largestGroup: { name: string; members: number } | null;
  mostExpenses: { name: string; count: number } | null;
  currencyMigrationNeeded: { groupsNeedMigration: number; expensesNeedMigration: number };
  errorLogs: number;
}

/**
 * Get comprehensive database statistics
 */
export const getDatabaseStats = async (): Promise<DatabaseStats> => {
  console.log('📊 Fetching database statistics...');

  try {
    // Fetch all collections
    const [usersSnap, groupsSnap, expensesSnap, invitesSnap, notificationsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'expenses')),
      getDocs(collection(db, 'groupInvites')),
      getDocs(collection(db, 'notifications'))
    ]);

    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    const groups = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinalExpense));
    const invites = invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupInvite));
    const notifications = notificationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));

    // Calculate stats
    const realUsers = users.filter(u => u.authType === 'google' || u.authType === 'email').length;
    const simulatedUsers = users.filter(u => u.authType === 'simulated').length;
    const pendingInvites = invites.filter(inv => inv.status === 'pending').length;
    const unreadNotifications = notifications.filter(n => !n.read).length;

    // Find largest group
    let largestGroup = null;
    if (groups.length > 0) {
      const largest = groups.reduce((prev, current) => 
        current.members.length > prev.members.length ? current : prev
      );
      largestGroup = { name: largest.name, members: largest.members.length };
    }

    // Find group with most expenses
    let mostExpenses = null;
    if (groups.length > 0 && expenses.length > 0) {
      const expensesByGroup = new Map<string, number>();
      expenses.forEach(exp => {
        expensesByGroup.set(exp.groupId, (expensesByGroup.get(exp.groupId) || 0) + 1);
      });
      let maxCount = 0;
      let maxGroupId = '';
      expensesByGroup.forEach((count, groupId) => {
        if (count > maxCount) {
          maxCount = count;
          maxGroupId = groupId;
        }
      });
      const group = groups.find(g => g.id === maxGroupId);
      if (group) {
        mostExpenses = { name: group.name, count: maxCount };
      }
    }

    // Check currency migration status
    const currencyMigrationNeeded = await checkMigrationNeeded();

    // Get error logs count
    const errorLogs = getErrorLogs().length;

    const stats: DatabaseStats = {
      totalUsers: users.length,
      realUsers,
      simulatedUsers,
      totalGroups: groups.length,
      totalExpenses: expenses.length,
      totalInvites: invites.length,
      pendingInvites,
      totalNotifications: notifications.length,
      unreadNotifications,
      largestGroup,
      mostExpenses,
      currencyMigrationNeeded,
      errorLogs
    };

    console.log('✅ Stats fetched:', stats);
    return stats;

  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    throw error;
  }
};

/**
 * Export all data as JSON (for backup/analysis)
 */
export const exportAllData = async (): Promise<void> => {
  console.log('📥 Exporting all data...');

  try {
    const [usersSnap, groupsSnap, expensesSnap, invitesSnap, notificationsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'expenses')),
      getDocs(collection(db, 'groupInvites')),
      getDocs(collection(db, 'notifications'))
    ]);

    const data = {
      exportDate: new Date().toISOString(),
      users: usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      groups: groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      expenses: expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      invites: invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      notifications: notificationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    };

    // Create downloadable JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `splitbi-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Data exported successfully');
    alert('✅ Data exported! Check your downloads folder.');

  } catch (error) {
    console.error('❌ Error exporting data:', error);
    alert('❌ Export failed. Check console for details.');
    throw error;
  }
};

/**
 * Find orphaned data (data that references non-existent entities)
 */
export const findOrphanedData = async (): Promise<{
  orphanedExpenses: string[];
  orphanedGroupMembers: string[];
  orphanedInvites: string[];
}> => {
  console.log('🔍 Searching for orphaned data...');

  try {
    const [usersSnap, groupsSnap, expensesSnap, invitesSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'expenses')),
      getDocs(collection(db, 'groupInvites'))
    ]);

    const userIds = new Set(usersSnap.docs.map(doc => doc.id));
    const groupIds = new Set(groupsSnap.docs.map(doc => doc.id));

    const groups = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinalExpense));
    const invites = invitesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupInvite));

    // Find expenses referencing non-existent groups
    const orphanedExpenses = expenses
      .filter(exp => !groupIds.has(exp.groupId))
      .map(exp => `${exp.description} (${exp.id})`);

    // Find group members referencing non-existent users
    const orphanedGroupMembers: string[] = [];
    groups.forEach(group => {
      group.members.forEach(memberId => {
        if (!userIds.has(memberId)) {
          orphanedGroupMembers.push(`${group.name}: member ${memberId}`);
        }
      });
    });

    // Find invites referencing non-existent groups
    const orphanedInvites = invites
      .filter(inv => !groupIds.has(inv.groupId))
      .map(inv => `${inv.invitedEmail} → ${inv.groupName} (${inv.id})`);

    const result = {
      orphanedExpenses,
      orphanedGroupMembers,
      orphanedInvites
    };

    console.log('🔍 Orphaned data found:', result);
    return result;

  } catch (error) {
    console.error('❌ Error finding orphaned data:', error);
    throw error;
  }
};

/**
 * Run currency migration for existing data
 */
export const runCurrencyMigrationAdmin = async (): Promise<void> => {
  console.log('💰 Running currency migration...');

  try {
    const result = await runCurrencyMigration();
    
    const message = `✅ Currency migration completed!
    
Groups updated: ${result.groupsUpdated}
Expenses updated: ${result.expensesUpdated}
${result.errors.length > 0 ? `\nErrors: ${result.errors.length}` : ''}

${result.errors.length > 0 ? result.errors.join('\n') : ''}`;

    console.log(message);
    alert(message);

  } catch (error) {
    console.error('❌ Error running currency migration:', error);
    alert('❌ Currency migration failed. Check console for details.');
    throw error;
  }
};

/**
 * Get error logs for debugging user issues
 */
export const getErrorLogsAdmin = () => {
  return getErrorLogs();
};

/**
 * Export error logs for analysis
 */
export const exportErrorLogsAdmin = () => {
  const logs = exportErrorLogs();
  const blob = new Blob([logs], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `splitbi-error-logs-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log('✅ Error logs exported');
};

/**
 * Clear error logs
 */
export const clearErrorLogsAdmin = () => {
  clearErrorLogs();
  console.log('✅ Error logs cleared');
};

/**
 * Delete user and all associated data
 * ⚠️ DESTRUCTIVE OPERATION - Use with caution!
 * 
 * IMPORTANT LIMITATION: This function only deletes Firestore data (user document, groups, expenses, etc.)
 * It does NOT delete the Firebase Authentication account. The Auth account must be deleted separately
 * through Firebase Console or using Firebase Admin SDK (requires backend/Cloud Functions).
 * 
 * If you need to delete Auth accounts, you can:
 * 1. Use Firebase Console → Authentication → Users → Delete user
 * 2. Create a Cloud Function with Admin SDK to delete Auth accounts
 * 
 * This is a security feature - Auth account deletion requires elevated privileges.
 */
export interface DeleteUserResult {
  success: boolean;
  userId: string;
  userName: string;
  deleted: {
    user: boolean;
    groups: number;
    expenses: number;
    invites: number;
    notifications: number;
  };
  errors: string[];
  warning?: string; // Warning about Auth account not being deleted
}

export const deleteUserAndData = async (userId: string, currentAdminId: string): Promise<DeleteUserResult> => {
  console.log(`🗑️ Deleting user ${userId} and all associated data...`);
  
  const result: DeleteUserResult = {
    success: false,
    userId,
    userName: 'Unknown',
    deleted: {
      user: false,
      groups: 0,
      expenses: 0,
      invites: 0,
      notifications: 0
    },
    errors: []
  };

  try {
    // Prevent deleting yourself
    if (userId === currentAdminId) {
      throw new Error('Cannot delete your own account');
    }

    // Fetch all data
    const [usersSnap, groupsSnap, expensesSnap, invitesSnap, notificationsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'expenses')),
      getDocs(collection(db, 'groupInvites')),
      getDocs(collection(db, 'notifications'))
    ]);

    const userDoc = usersSnap.docs.find(d => d.id === userId);
    if (!userDoc) {
      throw new Error('User not found');
    }

    const userData = userDoc.data() as User;
    result.userName = userData.name || userData.email || 'Unknown';

    const groups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
    const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() } as FinalExpense));
    const invites = invitesSnap.docs.map(d => ({ id: d.id, ...d.data() } as GroupInvite));
    const notifications = notificationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Notification));

    // Find all groups where user is a member
    const userGroups = groups.filter(g => g.members.includes(userId));
    
    // Find all expenses where user is payer or in splits
    const userExpenses = expenses.filter(exp => 
      exp.paidBy === userId || exp.splits.some(s => s.userId === userId)
    );

    // Find all invites sent by or to this user
    const userInvites = invites.filter(inv => 
      inv.invitedBy === userId || inv.invitedEmail?.toLowerCase() === userData.email?.toLowerCase()
    );

    // Find all notifications related to this user
    // Note: Notifications don't have userId field, so we filter by inviteId -> groupId -> user membership
    const userGroupIds = new Set(userGroups.map(g => g.id));
    const userInviteIds = new Set(userInvites.map(inv => inv.id));
    
    const userNotifications = notifications.filter(notif => {
      // If notification has inviteId, check if it's for this user
      if (notif.inviteId && userInviteIds.has(notif.inviteId)) {
        return true;
      }
      // For other notifications, we can't easily determine ownership without userId field
      // So we'll skip deleting them (they'll become orphaned but won't cause issues)
      return false;
    });

    // Use batches for efficient deletion (Firestore limit: 500 operations per batch)
    let batch = writeBatch(db);
    let operationCount = 0;
    const BATCH_LIMIT = 500;

    // 1. Delete expenses
    console.log(`   Deleting ${userExpenses.length} expenses...`);
    for (const exp of userExpenses) {
      batch.delete(doc(db, 'expenses', exp.id));
      operationCount++;
      result.deleted.expenses++;
      
      if (operationCount >= BATCH_LIMIT) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    // 2. Update or delete groups
    console.log(`   Processing ${userGroups.length} groups...`);
    for (const group of userGroups) {
      const remainingMembers = group.members.filter(m => m !== userId);
      
      if (remainingMembers.length === 0) {
        // Delete group if user was the only member
        batch.delete(doc(db, 'groups', group.id));
        result.deleted.groups++;
      } else {
        // Remove user from group members
        batch.update(doc(db, 'groups', group.id), {
          members: remainingMembers
        });
        result.deleted.groups++;
      }
      
      operationCount++;
      if (operationCount >= BATCH_LIMIT) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    // 3. Delete invites
    console.log(`   Deleting ${userInvites.length} invites...`);
    for (const inv of userInvites) {
      batch.delete(doc(db, 'groupInvites', inv.id));
      operationCount++;
      result.deleted.invites++;
      
      if (operationCount >= BATCH_LIMIT) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    // 4. Delete notifications
    console.log(`   Deleting ${userNotifications.length} notifications...`);
    for (const notif of userNotifications) {
      batch.delete(doc(db, 'notifications', notif.id));
      operationCount++;
      result.deleted.notifications++;
      
      if (operationCount >= BATCH_LIMIT) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }
    }

    // 5. Delete user document
    console.log(`   Deleting user document...`);
    batch.delete(doc(db, 'users', userId));
    result.deleted.user = true;
    operationCount++;

    // Commit final batch
    if (operationCount > 0) {
      await batch.commit();
    }

    result.success = true;
    result.warning = '⚠️ Note: Firebase Authentication account was NOT deleted. The user can still sign in. Delete the Auth account manually in Firebase Console if needed.';
    console.log(`✅ Successfully deleted Firestore data for user ${result.userName} (${userId})`);
    console.log(`   Groups: ${result.deleted.groups}, Expenses: ${result.deleted.expenses}, Invites: ${result.deleted.invites}, Notifications: ${result.deleted.notifications}`);
    console.warn(`⚠️ Firebase Auth account for ${userData.email} still exists. Delete it manually in Firebase Console.`);

  } catch (error: any) {
    console.error(`❌ Error deleting user ${userId}:`, error);
    const errorMessage = error?.message || error?.code || 'Unknown error';
    result.errors.push(errorMessage);
    result.success = false;
    console.error('Error details:', {
      code: error?.code,
      message: error?.message,
      userId,
      currentAdminId
    });
  }

  return result;
};

/**
 * Get all users for admin management
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    return usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
};

/**
 * Get all groups (admin only - no member filter)
 * Returns enriched group data with creator info and stats
 */
export const getAllGroupsAdmin = async (): Promise<import('../types').EnrichedGroup[]> => {
  console.log('📊 Fetching all groups for admin...');

  try {
    const [groupsSnap, usersSnap, expensesSnap] = await Promise.all([
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'expenses'))
    ]);

    const groups = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    const expenses = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinalExpense));

    // Enrich groups with creator and stats
    const enrichedGroups = groups.map(group => {
      const creator = users.find(u => u.id === group.createdBy);
      const groupExpenses = expenses.filter(exp => exp.groupId === group.id);

      return {
        ...group,
        creatorName: creator?.name,
        creatorEmail: creator?.email,
        memberCount: group.members.length,
        expenseCount: groupExpenses.length
      };
    });

    console.log(`✅ Fetched ${enrichedGroups.length} groups`);
    return enrichedGroups;

  } catch (error) {
    console.error('❌ Error fetching all groups:', error);
    throw error;
  }
};

/**
 * Get user's groups and expenses for troubleshooting
 */
export const getUserGroupsAndExpenses = async (userId: string): Promise<{
  user: User | null;
  groups: Group[];
  expenses: FinalExpense[];
  invitesSent: GroupInvite[];
}> => {
  console.log(`🔍 Fetching data for user ${userId}...`);

  try {
    const [usersSnap, groupsSnap, expensesSnap, invitesSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'expenses')),
      getDocs(collection(db, 'groupInvites'))
    ]);

    const user = usersSnap.docs.find(d => d.id === userId);
    const userData = user ? ({ id: user.id, ...user.data() } as User) : null;

    const allGroups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
    const userGroups = allGroups.filter(g => g.members.includes(userId));

    const allExpenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() } as FinalExpense));
    const userExpenses = allExpenses.filter(exp =>
      exp.paidBy === userId || exp.splits.some(s => s.userId === userId)
    );

    const allInvites = invitesSnap.docs.map(d => ({ id: d.id, ...d.data() } as GroupInvite));
    const invitesSent = allInvites.filter(inv => inv.invitedBy === userId);

    console.log(`✅ Found ${userGroups.length} groups, ${userExpenses.length} expenses, ${invitesSent.length} invites`);

    return {
      user: userData,
      groups: userGroups,
      expenses: userExpenses,
      invitesSent
    };

  } catch (error) {
    console.error(`❌ Error fetching user data for ${userId}:`, error);
    throw error;
  }
};

/**
 * Search users by email or name
 */
export const searchUsers = async (searchTerm: string): Promise<import('../types').UserStats[]> => {
  console.log(`🔍 Searching users: "${searchTerm}"...`);

  try {
    const [usersSnap, groupsSnap, expensesSnap, invitesSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'groups')),
      getDocs(collection(db, 'expenses')),
      getDocs(collection(db, 'groupInvites'))
    ]);

    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));
    const groups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Group));
    const expenses = expensesSnap.docs.map(d => ({ id: d.id, ...d.data() } as FinalExpense));
    const invites = invitesSnap.docs.map(d => ({ id: d.id, ...d.data() } as GroupInvite));

    // Filter users by search term
    const searchLower = searchTerm.toLowerCase();
    const matchingUsers = users.filter(u =>
      u.name.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower)
    );

    // Calculate stats for each matching user
    const userStats = matchingUsers.map(user => {
      const groupCount = groups.filter(g => g.members.includes(user.id)).length;
      const expenseCount = expenses.filter(exp =>
        exp.paidBy === user.id || exp.splits.some(s => s.userId === user.id)
      ).length;
      const inviteCount = invites.filter(inv => inv.invitedBy === user.id).length;

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        groupCount,
        expenseCount,
        inviteCount
      };
    });

    console.log(`✅ Found ${userStats.length} matching users`);
    return userStats;

  } catch (error) {
    console.error('❌ Error searching users:', error);
    throw error;
  }
};

/**
 * Get group by ID (admin can access any group)
 */
export const getGroupById = async (groupId: string): Promise<Group | null> => {
  console.log(`🔍 Fetching group ${groupId}...`);

  try {
    const groupsSnap = await getDocs(collection(db, 'groups'));
    const groupDoc = groupsSnap.docs.find(d => d.id === groupId);

    if (!groupDoc) {
      console.log('❌ Group not found');
      return null;
    }

    const group = { id: groupDoc.id, ...groupDoc.data() } as Group;
    console.log(`✅ Found group: ${group.name}`);
    return group;

  } catch (error) {
    console.error(`❌ Error fetching group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Join group as admin for troubleshooting
 * Adds admin to group members and logs the action
 */
export const joinGroupAsAdmin = async (groupId: string, adminUserId: string): Promise<void> => {
  console.log(`🔧 Admin ${adminUserId} joining group ${groupId}...`);

  try {
    const groupDoc = doc(db, 'groups', groupId);
    const groupSnap = await getDocs(collection(db, 'groups'));
    const group = groupSnap.docs.find(d => d.id === groupId);

    if (!group) {
      throw new Error('Group not found');
    }

    const groupData = { id: group.id, ...group.data() } as Group;

    // Check if already a member
    if (groupData.members.includes(adminUserId)) {
      console.log('⚠️ Admin is already a member');
      return;
    }

    // Add admin to members
    const updatedMembers = [...groupData.members, adminUserId];
    await updateDoc(groupDoc, {
      members: updatedMembers
    });

    console.log(`✅ Admin added to group ${groupData.name}`);

  } catch (error) {
    console.error(`❌ Error joining group:`, error);
    throw error;
  }
};

/**
 * Get recent admin actions for audit log
 */
export const getRecentAdminActions = async (limit: number = 50): Promise<any[]> => {
  console.log(`📋 Fetching recent admin actions (limit: ${limit})...`);

  try {
    const actionsSnap = await getDocs(collection(db, 'adminActions'));
    const actions = actionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Sort by timestamp (newest first)
    const sortedActions = actions.sort((a, b) => {
      const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
      const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
      return timeB - timeA;
    });

    const limitedActions = sortedActions.slice(0, limit);
    console.log(`✅ Fetched ${limitedActions.length} admin actions`);

    return limitedActions;

  } catch (error) {
    console.error('❌ Error fetching admin actions:', error);
    throw error;
  }
};

