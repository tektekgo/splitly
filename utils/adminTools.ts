/**
 * ADMIN TOOLS
 * 
 * Basic troubleshooting and monitoring tools for production
 * Only accessible to users with role: 'admin'
 */

import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { User, Group, FinalExpense, GroupInvite, Notification } from '../types';
import { runCurrencyMigration, checkMigrationNeeded } from './currencyMigration';

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
      currencyMigrationNeeded
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
    a.download = `splitly-backup-${new Date().toISOString().split('T')[0]}.json`;
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

