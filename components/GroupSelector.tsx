import React, { useState, useRef, useEffect } from 'react';
import type { Group } from '../types';
import { ChevronDownIcon, CheckIcon } from './icons';

interface GroupSelectorProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onNavigateToGroups: () => void;
  currentUserId: string;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({ groups, activeGroupId, onSelectGroup, onNavigateToGroups, currentUserId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter out archived groups
  const activeGroups = groups.filter(g => !g.archived);
  const activeGroup = activeGroups.find(g => g.id === activeGroupId);

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

  if (activeGroups.length === 0) {
    return null; // Don't show selector if no active groups
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
              {activeGroups.map(group => (
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
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{group.name}</span>
                    {group.createdBy === currentUserId && (
                      <svg 
                        className="w-3.5 h-3.5 flex-shrink-0 text-amber-500 dark:text-amber-400"
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                        title="You created this group"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                  </div>
                  {group.id === activeGroupId && (
                    <CheckIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      {!isOpen && activeGroups.length > 1 && (
        <p className="mt-2 text-xs text-text-secondary-light dark:text-text-secondary-dark text-center">
          Tip: Click the group name above to switch between {activeGroups.length} groups
        </p>
      )}
    </div>
  );
};

export default GroupSelector;

