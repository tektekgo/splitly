/**
 * DATABASE CLEANUP UTILITY
 * 
 * ⚠️ WARNING: This is a ONE-TIME cleanup before public launch
 * 
 * This script will:
 * 1. Delete all existing data (expenses, groups, invites, notifications)
 * 2. Preserve authentication users (they just need to re-login)
 * 3. Clean up orphaned data
 * 4. Reset to fresh state
 * 
 * IMPORTANT: Run this ONCE before beta launch, then remove/disable this file
 */

import { db } from '../firebase';
import { collection, getDocs, deleteDoc, writeBatch, doc } from 'firebase/firestore';

interface CleanupStats {
  notifications: number;
  groupInvites: number;
  expenses: number;
  groups: number;
  users: number;
  total: number;
}

export const performDatabaseCleanup = async (): Promise<CleanupStats> => {
  const stats: CleanupStats = {
    notifications: 0,
    groupInvites: 0,
    expenses: 0,
    groups: 0,
    users: 0,
    total: 0
  };

  console.log('🧹 Starting database cleanup...');
  console.log('⚠️  This will delete all data except authentication users');

  try {
    // Step 1: Delete notifications (no dependencies)
    console.log('1️⃣ Deleting notifications...');
    const notificationsSnapshot = await getDocs(collection(db, 'notifications'));
    let batch = writeBatch(db);
    let count = 0;
    
    for (const docSnap of notificationsSnapshot.docs) {
      batch.delete(docSnap.ref);
      count++;
      if (count % 500 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    if (count % 500 !== 0) await batch.commit();
    stats.notifications = notificationsSnapshot.size;
    console.log(`   ✅ Deleted ${stats.notifications} notifications`);

    // Step 2: Delete group invites (no dependencies)
    console.log('2️⃣ Deleting group invites...');
    const invitesSnapshot = await getDocs(collection(db, 'groupInvites'));
    batch = writeBatch(db);
    count = 0;
    
    for (const docSnap of invitesSnapshot.docs) {
      batch.delete(docSnap.ref);
      count++;
      if (count % 500 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    if (count % 500 !== 0) await batch.commit();
    stats.groupInvites = invitesSnapshot.size;
    console.log(`   ✅ Deleted ${stats.groupInvites} invites`);

    // Step 3: Delete expenses (depends on groups & users)
    console.log('3️⃣ Deleting expenses...');
    const expensesSnapshot = await getDocs(collection(db, 'expenses'));
    batch = writeBatch(db);
    count = 0;
    
    for (const docSnap of expensesSnapshot.docs) {
      batch.delete(docSnap.ref);
      count++;
      if (count % 500 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    if (count % 500 !== 0) await batch.commit();
    stats.expenses = expensesSnapshot.size;
    console.log(`   ✅ Deleted ${stats.expenses} expenses`);

    // Step 4: Delete groups (depends on users)
    console.log('4️⃣ Deleting groups...');
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    batch = writeBatch(db);
    count = 0;
    
    for (const docSnap of groupsSnapshot.docs) {
      batch.delete(docSnap.ref);
      count++;
      if (count % 500 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    if (count % 500 !== 0) await batch.commit();
    stats.groups = groupsSnapshot.size;
    console.log(`   ✅ Deleted ${stats.groups} groups`);

    // Step 5: Delete ALL user documents (including simulated & real)
    // Auth users remain - they just need to log back in
    console.log('5️⃣ Deleting user documents...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    batch = writeBatch(db);
    count = 0;
    
    for (const docSnap of usersSnapshot.docs) {
      batch.delete(docSnap.ref);
      count++;
      if (count % 500 === 0) {
        await batch.commit();
        batch = writeBatch(db);
      }
    }
    if (count % 500 !== 0) await batch.commit();
    stats.users = usersSnapshot.size;
    console.log(`   ✅ Deleted ${stats.users} user documents`);

    stats.total = stats.notifications + stats.groupInvites + stats.expenses + stats.groups + stats.users;

    console.log('\n✅ DATABASE CLEANUP COMPLETE!');
    console.log('📊 Summary:');
    console.log(`   Notifications: ${stats.notifications}`);
    console.log(`   Group Invites: ${stats.groupInvites}`);
    console.log(`   Expenses: ${stats.expenses}`);
    console.log(`   Groups: ${stats.groups}`);
    console.log(`   Users: ${stats.users}`);
    console.log(`   ─────────────────────`);
    console.log(`   TOTAL DELETED: ${stats.total} documents`);
    console.log('\n⚠️  Note: Authentication users still exist - they just need to log back in');
    console.log('🎉 Database is now clean and ready for public beta!');

    return stats;

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
};

/**
 * Confirmation wrapper - requires user to type confirmation
 */
export const confirmAndCleanup = async (): Promise<void> => {
  const confirmation = window.prompt(
    '⚠️ FINAL WARNING ⚠️\n\n' +
    'This will permanently delete ALL data:\n' +
    '• All expenses\n' +
    '• All groups\n' +
    '• All user documents\n' +
    '• All invites\n' +
    '• All notifications\n\n' +
    'Authentication users will remain (they need to re-login).\n\n' +
    'Type "CLEAN DATABASE" to proceed:'
  );

  if (confirmation !== 'CLEAN DATABASE') {
    alert('❌ Cleanup cancelled');
    return;
  }

  try {
    const stats = await performDatabaseCleanup();
    
    alert(
      '✅ Database cleaned successfully!\n\n' +
      `Deleted ${stats.total} documents:\n` +
      `• ${stats.notifications} notifications\n` +
      `• ${stats.groupInvites} invites\n` +
      `• ${stats.expenses} expenses\n` +
      `• ${stats.groups} groups\n` +
      `• ${stats.users} users\n\n` +
      '🔄 Please refresh the page.'
    );
  } catch (error) {
    alert('❌ Cleanup failed! Check console for details.');
    console.error(error);
  }
};

