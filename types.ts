export type AuthType = 'google' | 'email' | 'simulated';
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email?: string; // Only for real users (google/email auth)
  avatarUrl: string;
  authType: AuthType; // How the user was created
  createdBy?: string; // User ID of creator (only for simulated users)
  createdAt?: string; // ISO 8601 date string
  role?: UserRole; // Admin role (set manually in Firebase Console)
  paymentInfo?: {
    venmo?: string; // Venmo username
    zelle?: string; // Zelle email or phone number
    cashApp?: string; // Cash App username/cashtag
  };
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // Changed from User[] to string[]
  currency: string; // ISO code (USD, EUR, INR, GBP, etc.)
  createdAt?: Date;
  createdBy?: string;
  archived?: boolean; // Whether the group is archived
  archivedAt?: Date; // When the group was archived
}

export enum SplitMethod {
  Equal = 'equal',
  Unequal = 'unequal',
  Percentage = 'percentage',
  Shares = 'shares',
}

export enum Category {
  FoodAndDrink = 'Food & Drink',
  Transportation = 'Transportation',
  Housing = 'Housing',
  Entertainment = 'Entertainment',
  Utilities = 'Utilities',
  Health = 'Health',
  PersonalCare = 'Personal Care',
  Rent = 'Rent',
  Shopping = 'Shopping',
  Groceries = 'Groceries',
  Payment = 'Payment',
  Other = 'Other',
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
}

export interface FinalExpense {
  id:string;
  groupId: string; // Added to link expense to a group
  description: string;
  amount: number; // Converted to group currency (base currency)
  currency: string; // Group currency (base currency for display and calculations)
  category: Category;
  paidBy: string; // User ID
  expenseDate: string; // ISO 8601 date string
  splitMethod: SplitMethod;
  splits: ExpenseSplit[];
  // Multi-currency support fields (optional - only present if expense was entered in different currency)
  originalAmount?: number; // Amount entered by user in original currency
  originalCurrency?: string; // Currency in which expense was entered
  exchangeRate?: number; // Exchange rate used for conversion (originalCurrency to group currency)
  rateDate?: string; // Date when exchange rate was fetched/used (ISO 8601)
  rateSource?: 'auto' | 'manual'; // How the exchange rate was obtained
}

export interface SimplifiedDebt {
  from: string; // User ID
  to: string; // User ID
  amount: number;
}

export enum NotificationType {
  ExpenseAdded = 'expense_added',
  ExpenseEdited = 'expense_edited',
  PaymentRecorded = 'payment_recorded',
  GroupInvite = 'group_invite',
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string; // ISO 8601 date string
  read: boolean;
  inviteId?: string; // For group invite notifications
}

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface GroupInvite {
  id: string;
  groupId: string;
  groupName: string; // For display in notifications
  invitedEmail: string;
  invitedUserId?: string; // Set if user already has account
  invitedBy: string; // User ID who sent invite
  inviterName: string; // For display: "Sarah invited you..."
  status: InviteStatus;
  createdAt: string; // ISO 8601 date string
  expiresAt?: string; // Optional: auto-expire after 7 days
  acceptedAt?: string; // When invite was accepted
}

// Admin-specific types
export interface EnrichedGroup extends Group {
  creatorName?: string;
  creatorEmail?: string;
  memberCount: number;
  expenseCount: number;
}

export interface UserStats {
  userId: string;
  userName: string;
  userEmail?: string;
  groupCount: number;
  expenseCount: number;
  inviteCount: number;
}