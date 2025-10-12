export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // Changed from User[] to string[]
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
  amount: number;
  category: Category;
  paidBy: string; // User ID
  expenseDate: string; // ISO 8601 date string
  splitMethod: SplitMethod;
  splits: ExpenseSplit[];
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
}

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: string; // ISO 8601 date string
  read: boolean;
}