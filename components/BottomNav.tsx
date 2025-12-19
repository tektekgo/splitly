import React from 'react';
import { motion } from 'framer-motion';
import { HomeIcon, PlusCircleIcon, UsersIcon, UserCircleIcon, BellIcon } from './icons';

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
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick(screen)} 
      className="relative flex flex-col items-center justify-center w-full h-full text-xs font-medium transition-colors"
    >
        <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-teal-primary' : 'text-sage dark:text-gray-500'}`} />
        <span className={`${isActive ? 'text-teal-primary' : 'text-sage dark:text-gray-400'}`}>{label}</span>
        {badgeCount > 0 && (
            <span className="absolute top-1 right-3.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {badgeCount > 9 ? '9+' : badgeCount}
            </span>
        )}
    </motion.button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onNavigate, notificationCount }) => {
  const isAddActive = activeScreen === 'add';
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-content-dark border-t border-stone-100 dark:border-stone-700 z-40 shadow-sm">
        <div className="max-w-md sm:max-w-lg lg:max-w-xl mx-auto h-full grid grid-cols-5 items-center px-2">
            <div data-tour="dashboard-tab">
              <NavItem
                  screen="dashboard"
                  label="Dashboard"
                  Icon={HomeIcon}
                  isActive={activeScreen === 'dashboard'}
                  onClick={onNavigate}
              />
            </div>
            <div data-tour="groups-tab">
              <NavItem
                  screen="groups"
                  label="Groups"
                  Icon={UsersIcon}
                  isActive={activeScreen === 'groups'}
                  onClick={onNavigate}
              />
            </div>
            <div className="flex flex-col items-center justify-center" data-tour="add-expense-button">
                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onNavigate('add')}
                    className={`-mt-6 flex items-center justify-center w-14 h-14 rounded-full shadow-lg text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-primary focus:ring-offset-cream dark:focus:ring-offset-surface-dark ${isAddActive ? 'bg-teal-primary ring-2 ring-teal-primary/60' : 'bg-teal-primary hover:bg-teal-dark'}`}
                    aria-label="Add Expense"
                    title="Add Expense"
                >
                    <PlusCircleIcon className="w-8 h-8" />
                </motion.button>
                <span className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${isAddActive ? 'text-teal-primary' : 'text-sage dark:text-text-secondary-dark'}`}>Add Expense</span>
            </div>
            <NavItem
                screen="activity"
                label="Activity"
                Icon={BellIcon}
                isActive={activeScreen === 'activity'}
                onClick={onNavigate}
                badgeCount={notificationCount}
            />
            <div data-tour="profile-tab">
              <NavItem
                  screen="profile"
                  label="Profile"
                  Icon={UserCircleIcon}
                  isActive={activeScreen === 'profile'}
                  onClick={onNavigate}
              />
            </div>
        </div>
    </div>
  );
};

export default BottomNav;