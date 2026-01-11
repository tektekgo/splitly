import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { HomeIcon, PlusCircleIcon, UserCircleIcon, BellIcon, UsersIcon } from './icons';
import { getVersionString } from '../src/version';

type Screen = 'dashboard' | 'add' | 'groups' | 'profile' | 'activity';

interface BottomNavProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  notificationCount: number;
}

const NavItem: React.FC<{
    screen: Screen,
    label: string,
    Icon: React.ElementType,
    isActive: boolean,
    onClick: (screen: Screen) => void,
    badgeCount?: number
}> = ({ screen, label, Icon, isActive, onClick, badgeCount = 0 }) => (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => onClick(screen)}
      className="relative flex flex-col items-center justify-center w-full py-2 px-1"
    >
        {/* Icon with badge */}
        <div className="relative">
          <motion.div
            animate={{ scale: isActive ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Icon className={`w-7 h-7 transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
          </motion.div>
          {badgeCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
            >
              {badgeCount > 9 ? '9+' : badgeCount}
            </motion.span>
          )}
        </div>
        {/* Label */}
        <span className={`mt-1 text-[11px] font-medium transition-colors duration-200 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
          {label}
        </span>
        {/* Active indicator dot */}
        {isActive && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute -bottom-0.5 w-1 h-1 bg-primary rounded-full"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
    </motion.button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onNavigate, notificationCount }) => {
  const isAddActive = activeScreen === 'add';

  let versionString = '';
  try {
    versionString = getVersionString();
  } catch {
    // Version not available
  }

  return (
    <nav className="flex-shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-stone-200/60 dark:border-gray-700/60">
      {/* Navigation Bar */}
      <div className="h-[76px] pt-2 grid grid-cols-5 items-center px-2 sm:px-3">
        <div data-tour="dashboard-tab" className="flex items-center justify-center">
          <NavItem
            screen="dashboard"
            label="Home"
            Icon={HomeIcon}
            isActive={activeScreen === 'dashboard'}
            onClick={onNavigate}
          />
        </div>
        <div className="flex items-center justify-center">
          <NavItem
            screen="groups"
            label="Groups"
            Icon={UsersIcon}
            isActive={activeScreen === 'groups'}
            onClick={onNavigate}
          />
        </div>
        <div className="flex items-center justify-center" data-tour="add-expense-button">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onNavigate('add')}
            className={`flex flex-col items-center justify-center transition-all focus:outline-none ${isAddActive ? 'scale-105' : ''}`}
            aria-label="Add Expense"
            title="Add Expense"
          >
            <div className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white bg-gradient-to-br from-primary to-primary-700 ${isAddActive ? 'shadow-xl ring-2 ring-primary/30' : ''}`}>
              <PlusCircleIcon className="w-9 h-9" />
            </div>
            <span className={`mt-1 text-[11px] font-medium transition-colors duration-200 ${isAddActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>Add</span>
          </motion.button>
        </div>
        <div className="flex items-center justify-center">
          <NavItem
            screen="activity"
            label="Activity"
            Icon={BellIcon}
            isActive={activeScreen === 'activity'}
            onClick={onNavigate}
            badgeCount={notificationCount}
          />
        </div>
        <div data-tour="profile-tab" className="flex items-center justify-center">
          <NavItem
            screen="profile"
            label="Profile"
            Icon={UserCircleIcon}
            isActive={activeScreen === 'profile'}
            onClick={onNavigate}
          />
        </div>
      </div>
      {/* Version Footer - Below navigation */}
      <div className="text-center pb-2 pt-1.5">
        <p className="text-[9px] text-gray-500 dark:text-gray-400 font-mono tracking-wide">
          {versionString ? `${versionString} • Sujit` : 'Sujit'}
        </p>
      </div>
    </nav>
  );
};

export default BottomNav;