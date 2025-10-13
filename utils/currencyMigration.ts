import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_CURRENCY } from './currencyFormatter';

/**
 * Migration script to add currency support to existing groups and expenses
 * This script should be run once to migrate existing data
 */

export interface MigrationResult {
  groupsUpdated: number;
  expensesUpdated: number;
  errors: string[];
}

/**
 * Migrate all existing groups to have a default currency
 */
export async function migrateGroupsToCurrency(): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Get all groups
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    
    for (const groupDoc of groupsSnapshot.docs) {
      const groupData = groupDoc.data();
      
      // Only update groups that don't have currency field
      if (!groupData.currency) {
        try {
          await updateDoc(doc(db, 'groups', groupDoc.id), {
            currency: DEFAULT_CURRENCY,
            createdAt: groupData.createdAt || new Date(),
            createdBy: groupData.createdBy || null,
          });
          updated++;
          console.log(`Updated group: ${groupData.name} (${groupDoc.id})`);
        } catch (error) {
          const errorMsg = `Failed to update group ${groupDoc.id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }
  } catch (error) {
    const errorMsg = `Failed to fetch groups: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  return { updated, errors };
}

/**
 * Migrate all existing expenses to have currency from their group
 */
export async function migrateExpensesToCurrency(): Promise<{ updated: number; errors: string[] }> {
  const errors: string[] = [];
  let updated = 0;

  try {
    // Get all expenses
    const expensesSnapshot = await getDocs(collection(db, 'expenses'));
    
    for (const expenseDoc of expensesSnapshot.docs) {
      const expenseData = expenseDoc.data();
      
      // Only update expenses that don't have currency field
      if (!expenseData.currency) {
        try {
          // Get the group to find its currency
          const groupDoc = await doc(db, 'groups', expenseData.groupId);
          const groupSnapshot = await getDocs(query(collection(db, 'groups'), where('__name__', '==', expenseData.groupId)));
          
          let groupCurrency = DEFAULT_CURRENCY;
          if (!groupSnapshot.empty) {
            const groupData = groupSnapshot.docs[0].data();
            groupCurrency = groupData.currency || DEFAULT_CURRENCY;
          }

          await updateDoc(doc(db, 'expenses', expenseDoc.id), {
            currency: groupCurrency,
          });
          updated++;
          console.log(`Updated expense: ${expenseData.description} (${expenseDoc.id}) with currency ${groupCurrency}`);
        } catch (error) {
          const errorMsg = `Failed to update expense ${expenseDoc.id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }
  } catch (error) {
    const errorMsg = `Failed to fetch expenses: ${error}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }

  return { updated, errors };
}

/**
 * Run the complete currency migration
 */
export async function runCurrencyMigration(): Promise<MigrationResult> {
  console.log('Starting currency migration...');
  
  const result: MigrationResult = {
    groupsUpdated: 0,
    expensesUpdated: 0,
    errors: [],
  };

  // Migrate groups first
  console.log('Migrating groups...');
  const groupsResult = await migrateGroupsToCurrency();
  result.groupsUpdated = groupsResult.updated;
  result.errors.push(...groupsResult.errors);

  // Migrate expenses second
  console.log('Migrating expenses...');
  const expensesResult = await migrateExpensesToCurrency();
  result.expensesUpdated = expensesResult.updated;
  result.errors.push(...expensesResult.errors);

  console.log('Currency migration completed:', result);
  return result;
}

/**
 * Check if migration is needed
 */
export async function checkMigrationNeeded(): Promise<{ groupsNeedMigration: number; expensesNeedMigration: number }> {
  let groupsNeedMigration = 0;
  let expensesNeedMigration = 0;

  try {
    // Check groups
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    groupsNeedMigration = groupsSnapshot.docs.filter(doc => !doc.data().currency).length;

    // Check expenses
    const expensesSnapshot = await getDocs(collection(db, 'expenses'));
    expensesNeedMigration = expensesSnapshot.docs.filter(doc => !doc.data().currency).length;
  } catch (error) {
    console.error('Error checking migration status:', error);
  }

  return { groupsNeedMigration, expensesNeedMigration };
}
