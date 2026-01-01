import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { User } from '../types';

export type AdminActionType =
  | 'delete_group'
  | 'archive_group'
  | 'unarchive_group'
  | 'delete_user'
  | 'modify_group'
  | 'join_group_as_admin'
  | 'view_user_details'
  | 'lookup_group'
  | 'search_users';

export interface AdminActionLog {
  action: AdminActionType;
  adminId: string;
  adminName: string;
  adminEmail?: string;
  targetType: 'group' | 'user' | 'expense';
  targetId: string;
  targetName: string;
  originalCreatorId?: string;
  originalCreatorName?: string;
  details?: Record<string, any>;
  timestamp: Date;
  metadata?: {
    memberCount?: number;
    expenseCount?: number;
    [key: string]: any;
  };
}

/**
 * Log an admin action to Firestore for audit trail
 */
export async function logAdminAction(params: {
  action: AdminActionType;
  admin: User;
  targetType: 'group' | 'user' | 'expense';
  targetId: string;
  targetName: string;
  originalCreator?: User;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const logEntry: Omit<AdminActionLog, 'timestamp'> & { timestamp: Timestamp } = {
      action: params.action,
      adminId: params.admin.id,
      adminName: params.admin.name,
      adminEmail: params.admin.email,
      targetType: params.targetType,
      targetId: params.targetId,
      targetName: params.targetName,
      originalCreatorId: params.originalCreator?.id,
      originalCreatorName: params.originalCreator?.name,
      details: params.details,
      metadata: params.metadata,
      timestamp: Timestamp.now()
    };

    await addDoc(collection(db, 'adminActions'), logEntry);

    console.log(`[Admin Action] ${params.action} on ${params.targetType} "${params.targetName}" by ${params.admin.name}`);
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw - logging failure shouldn't block the actual action
  }
}
