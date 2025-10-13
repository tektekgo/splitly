import React from 'react';
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
    <button onClick={() => onClick(screen)} className="relative flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors">
        <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
        <span className={`${isActive ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>{label}</span>
        {badgeCount > 0 && (
            <span className="absolute top-1 right-3.5 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-error rounded-full">
                {badgeCount > 9 ? '9+' : badgeCount}
            </span>
        )}
    </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, onNavigate, notificationCount }) => {
  const isAddActive = activeScreen === 'add';
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-content-light dark:bg-content-dark border-t border-border-light dark:border-border-dark z-40">
        <div className="max-w-3xl mx-auto h-full grid grid-cols-5 items-center px-2">
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
                <button 
                    onClick={() => onNavigate('add')}
                    className={`-mt-8 flex items-center justify-center w-16 h-16 rounded-full shadow-lg text-white transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark ${isAddActive ? 'bg-primary ring-2 ring-primary/60' : 'bg-primary hover:bg-primary-600'}`}
                    aria-label="Add Expense"
                    title="Add Expense"
                >
                    <PlusCircleIcon className="w-10 h-10" />
                </button>
                <span className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${isAddActive ? 'text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>Add Expense</span>
            </div>
            <NavItem
                screen="activity"
                label="Activity"
                Icon={BellIcon}
                isActive={activeScreen === 'activity'}
                onClick={onNavigate}
                badgeCount={notificationCount}
            />
            <div data-tour="people-tab">
              <NavItem
                  screen="profile"
                  label="People"
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