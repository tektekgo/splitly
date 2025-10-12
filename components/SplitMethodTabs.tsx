import React from 'react';
import { SplitMethod } from '../types';

interface SplitMethodTabsProps {
  activeMethod: SplitMethod;
  onSelectMethod: (method: SplitMethod) => void;
}

const tabs = [
  { id: SplitMethod.Equal, label: 'Equally' },
  { id: SplitMethod.Unequal, label: 'Unequally' },
  { id: SplitMethod.Percentage, label: 'By %' },
  { id: SplitMethod.Shares, label: 'By Shares' },
];

const SplitMethodTabs: React.FC<SplitMethodTabsProps> = ({ activeMethod, onSelectMethod }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">Split method</label>
      <div className="grid grid-cols-4 gap-2 rounded-lg bg-gray-200 dark:bg-gray-800 p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectMethod(tab.id)}
            className={`w-full text-center px-2 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50
              ${activeMethod === tab.id
                ? 'bg-white dark:bg-gray-600 text-primary dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SplitMethodTabs;