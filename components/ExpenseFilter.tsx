import React from 'react';
import type { User, Category } from '../types';
import { SearchIcon } from './icons';
import InfoTooltip from './InfoTooltip';

export type DatePreset = 'all' | 'today' | 'week' | 'month' | '30days' | 'custom';

interface ExpenseFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterCategory: Category | 'all';
  onCategoryChange: (value: Category | 'all') => void;
  filterUser: string | 'all';
  onUserChange: (value: string | 'all') => void;
  members: User[];
  categories: Category[];
  filterDatePreset: DatePreset;
  onDatePresetChange: (value: DatePreset) => void;
  filterDateFrom: string;
  onDateFromChange: (value: string) => void;
  filterDateTo: string;
  onDateToChange: (value: string) => void;
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
  filterDatePreset,
  onDatePresetChange,
  filterDateFrom,
  onDateFromChange,
  filterDateTo,
  onDateToChange,
}) => {
  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-stone-200 dark:border-gray-600">
      <div>
        <div className="flex items-center mb-2">
          <label htmlFor="search" className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
            Search
          </label>
          <InfoTooltip text="Find expenses by description - try searching for 'dinner', 'uber', 'groceries', or any part of the expense name." />
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by description (e.g., 'dinner', 'uber')"
            className="block w-full pl-10 pr-3 py-2 border border-border-light dark:border-border-dark bg-content-light dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        <select
          value={filterDatePreset}
          onChange={(e) => onDatePresetChange(e.target.value as DatePreset)}
          className="block w-full pl-3 pr-10 py-2 bg-content-light dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="30days">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
      {filterDatePreset === 'custom' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateFrom" className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              From
            </label>
            <input
              id="dateFrom"
              type="date"
              value={filterDateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="block w-full pl-3 pr-3 py-2 bg-content-light dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              To
            </label>
            <input
              id="dateTo"
              type="date"
              value={filterDateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="block w-full pl-3 pr-3 py-2 bg-content-light dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseFilter;