import React from 'react';
import { motion } from 'framer-motion';
import { HomeIcon, PlusCircleIcon, UsersIcon, UserCircleIcon, BellIcon } from './icons';

type Screen = 'dashboard' | 'add' | 'groups' | 'profile' | 'activity';

interface BottomNavProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
  notificationCount: number;
  onHelpClick?: () => void;
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
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => onClick(screen)} 
      className={`relative flex flex-col items-center justify-center w-full h-full text-xs font-semibold transition-all rounded-xl py-1.5 px-1 ${isActive ? 'bg-primary/10 dark:bg-primary/20' : 'hover:bg-stone-50 dark:hover:bg-gray-800/50'}`}
    >
        <Icon className={`w-6 h-6 mb-1 transition-all ${isActive ? 'text-primary scale-110' : 'text-sage dark:text-gray-500'}`} />
        <span className={`transition-colors ${isActive ? 'text-primary font-bold' : 'text-sage dark:text-gray-400'}`}>{label}</span>
        {badgeCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-0 right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-md ring-2 ring-white dark:ring-gray-800">
                {badgeCount > 9 ? '9+' : badgeCount}
            </motion.span>
        )}
    </motion.button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onNavigate, notificationCount, onHelpClick }) => {
  const isAddActive = activeScreen === 'add';
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto">
            <div className="bg-gradient-to-b from-stone-100 to-stone-100 dark:from-gray-800 dark:to-gray-800 border-x border-b border-stone-200 dark:border-gray-700 rounded-b-3xl overflow-hidden">
                {/* Utility Bar - Links */}
                <div className="border-b border-stone-200 dark:border-gray-700 px-3 sm:px-4 py-4 relative z-0">
                    <div className="flex items-center justify-center gap-3 text-xs">
                        <a 
                            href="/install.html" 
                            target="_blank"
                            className="text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors"
                        >
                            📱 Install App
                        </a>
                        <span className="text-stone-300 dark:text-gray-600">•</span>
                        <a 
                            href="https://forms.gle/1w3Vk6FhrQDppagw5"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors leading-tight -mt-0.5"
                        >
                            💬 Send Feedback
                        </a>
                        <span className="text-stone-300 dark:text-gray-600">•</span>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={onHelpClick}
                            className="text-primary hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1 transition-colors"
                        >
                            ❓ Help & FAQ
                        </motion.button>
                    </div>
                </div>
                {/* Navigation Bar */}
                <div className="h-20 grid grid-cols-5 items-center gap-1 px-3 sm:px-4 relative z-10">
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
            <div className="flex flex-col items-center justify-center relative z-20" data-tour="add-expense-button">
                <motion.button 
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                    onClick={() => onNavigate('add')}
                        className={`-mt-6 flex items-center justify-center w-16 h-16 rounded-full shadow-xl text-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-cream dark:focus:ring-offset-surface-dark bg-gradient-to-br from-primary to-primary-700 hover:from-primary-700 hover:to-primary-800 ${isAddActive ? 'ring-4 ring-primary/30 shadow-2xl' : ''}`}
                    aria-label="Add Expense"
                    title="Add Expense"
                >
                        <PlusCircleIcon className="w-9 h-9" />
                </motion.button>
                    <span className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${isAddActive ? 'text-primary' : 'text-sage dark:text-text-secondary-dark'}`}>Add Expense</span>
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
        </div>
    </div>
  );
};

export default BottomNav;