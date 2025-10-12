import React from 'react';
import { FinalExpense, User } from '../types';
import ExpenseItem from './ExpenseItem';
import { FilterIcon } from './icons';

interface ExpenseListProps {
  expenses: FinalExpense[];
  members: User[];
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: FinalExpense) => void;
  onViewExpense: (expense: FinalExpense) => void;
  hasActiveFilters: boolean;
  originalExpenseCount: number;
  currentUserId: string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, members, onDeleteExpense, onEditExpense, onViewExpense, hasActiveFilters, originalExpenseCount, currentUserId }) => {
  if (originalExpenseCount === 0) {
    return (
      <div className="text-center py-16 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-text-primary-light dark:text-text-primary-dark">No expenses recorded</h3>
        <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">Switch to the 'Add Expense' tab to get started.</p>
      </div>
    );
  }

  if (expenses.length === 0 && hasActiveFilters) {
     return (
      <div className="text-center py-16 px-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <FilterIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-text-primary-light dark:text-text-primary-dark">No Matching Expenses</h3>
        <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }


  return (
    <ul className="space-y-4">
      {expenses.map(expense => (
        <ExpenseItem 
            key={expense.id} 
            expense={expense} 
            members={members} 
            onDelete={onDeleteExpense}
            onEdit={onEditExpense}
            onView={onViewExpense}
            currentUserId={currentUserId}
        />
      ))}
    </ul>
  );
};

export default ExpenseList;