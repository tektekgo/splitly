import React from 'react';
import type { User, Category } from '../types';
import { SearchIcon } from './icons';

interface ExpenseFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterCategory: Category | 'all';
  onCategoryChange: (value: Category | 'all') => void;
  filterUser: string | 'all';
  onUserChange: (value: string | 'all') => void;
  members: User[];
  categories: Category[];
}

const ExpenseFilter: React.FC<ExpenseFilterProps> = ({
  searchTerm,
  onSearchChange,
  filterCategory,
  onCategoryChange,
  filterUser,
  onUserChange,
  members,
  categories,
}) => {
  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-border-light dark:border-border-dark">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
          <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by description..."
          className="block w-full pl-10 pr-3 py-2 border border-border-light dark:border-border-dark bg-content-light dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <select
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value as Category | 'all')}
          className="block w-full pl-3 pr-10 py-2 bg-content-light dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterUser}
          onChange={(e) => onUserChange(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 bg-content-light dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          <option value="all">All Members</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ExpenseFilter;