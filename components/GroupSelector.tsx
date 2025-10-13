import React, { useState, useRef, useEffect } from 'react';
import type { Group } from '../types';
import { ChevronDownIcon, CheckIcon } from './icons';

interface GroupSelectorProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onNavigateToGroups: () => void;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({ groups, activeGroupId, onSelectGroup, onNavigateToGroups }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (groups.length === 0) {
    return null; // Don't show selector if no groups
  }

  return (
    <div className="mb-6" ref={dropdownRef}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-2 border-primary/10 dark:border-primary/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">
              Current Group
            </p>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 text-left group w-full"
            >
              <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark group-hover:text-primary transition-colors">
                {activeGroup ? activeGroup.name : 'Select a group'}
              </h3>
              <ChevronDownIcon 
                className={`w-5 h-5 text-gray-400 group-hover:text-primary transition-all ${isOpen ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
          <button
            onClick={onNavigateToGroups}
            className="px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Create or edit groups"
          >
            Manage All Groups
          </button>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="mt-3 pt-3 border-t border-border-light dark:border-border-dark">
            <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2 px-2">
              Switch to:
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => {
                    onSelectGroup(group.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    group.id === activeGroupId
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-text-primary-light dark:text-text-primary-dark'
                  }`}
                >
                  <span>{group.name}</span>
                  {group.id === activeGroupId && (
                    <CheckIcon className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      {!isOpen && groups.length > 1 && (
        <p className="mt-2 text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
          Tip: Click the group name above to switch between {groups.length} groups
        </p>
      )}
    </div>
  );
};

export default GroupSelector;

