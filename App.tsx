
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import AddExpenseForm from './components/AddExpenseForm';
import ExpenseList from './components/ExpenseList';
import BalanceSummary from './components/BalanceSummary';
import BalanceHeader from './components/BalanceHeader';
import SettleUpModal from './components/SettleUpModal';
import ExpenseDetailModal from './components/ExpenseDetailModal';
import ExpenseFilter from './components/ExpenseFilter';
import BalanceDetailModal from './components/BalanceDetailModal';
import BottomNav from './components/BottomNav';
import GroupManagementModal from './components/GroupManagementModal';
import GroupsScreen from './components/GroupsScreen';
import CreateGroupModal from './components/CreateGroupModal';
import ProfileScreen from './components/ProfileScreen';
import ActivityScreen from './components/ActivityScreen';
import ExportModal from './components/ExportModal';
import { CATEGORIES, createNewUser } from './constants';
import type { FinalExpense, SimplifiedDebt, User, Group, Notification, GroupInvite } from './types';
import { SplitMethod, Category, NotificationType } from './types';
import { MoonIcon, SunIcon, UsersIcon } from './components/icons';
import { simplifyDebts } from './utils/debtSimplification';
import { formatCurrency } from './utils/currencyFormatter';
import { logError } from './utils/errorLogger';
import { sendGroupInviteEmail } from './utils/emailService';
import { db } from './firebase';
import { collection, getDocs, getDoc, doc, writeBatch, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import FeedbackModal from './components/FeedbackModal';
import CurrencyConverterModal from './components/CurrencyConverterModal';
import UtilityBar from './components/UtilityBar';
import InfoTooltip from './components/InfoTooltip';
import GroupSelector from './components/GroupSelector';
import InviteMemberModal from './components/InviteMemberModal';
import HelpModal from './components/HelpModal';
import OnboardingTour from './components/OnboardingTour';

const genAI = new GoogleGenerativeAI((import.meta as any).env?.VITE_GEMINI_API_KEY || "");

// Group type icon component
const GroupIcon: React.FC<{ groupName: string; className?: string }> = ({ groupName, className = 'w-5 h-5' }) => {
    const name = groupName.toLowerCase();
    if (name.includes('room') || name.includes('home') || name.includes('house')) {
        return (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
            </svg>
        );
    } else if (name.includes('trip') || name.includes('travel') || name.includes('vacation')) {
        return (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V21l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
        );
    } else if (name.includes('family')) {
        return (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0018.54 7H16.5c-.8 0-1.54.5-1.85 1.26L12.5 14H11v-4c0-.55-.45-1-1-1H6c-.55 0-1 .45-1 1v4H2v2h6v8h2v-8h2.5l1.35-4H14v6h2v8h2zm-11.5 0v-6H6v6h2.5z"/>
            </svg>
        );
    } else if (name.includes('work') || name.includes('office') || name.includes('business')) {
        return (
            <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
            </svg>
        );
    } else {
        return <UsersIcon className={className} />;
    }
};

type Theme = 'light' | 'dark';
type Screen = 'dashboard' | 'add' | 'groups' | 'profile' | 'activity';

const ThemeToggle: React.FC<{ theme: Theme, toggleTheme: () => void }> = ({ theme, toggleTheme }) => {
  const isDark = theme === 'dark';
  
  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.98 }}
      className="relative inline-flex h-7 w-14 items-center rounded-full bg-stone-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer shadow-sm border border-stone-300 dark:border-gray-600"
      aria-label="Toggle theme"
    >
      <motion.span
        className={`absolute flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md transition-colors ${
          isDark ? 'text-yellow-400' : 'text-stone-600'
        }`}
        initial={false}
        animate={{
          x: isDark ? 28 : 2,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      >
        {isDark ? (
          <MoonIcon className="h-4 w-4" />
        ) : (
          <SunIcon className="h-4 w-4" />
        )}
      </motion.span>
      <span className="sr-only">Toggle theme</span>
    </motion.button>
  );
};

const App: React.FC = () => {
  const { currentUser, loading: authLoading, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<FinalExpense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([]);

  const [isSettleUpModalOpen, setIsSettleUpModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isCurrencyConverterOpen, setIsCurrencyConverterOpen] = useState(false);
  const [isGroupManagementModalOpen, setIsGroupManagementModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [inviteGroupId, setInviteGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupDebt, setEditingGroupDebt] = useState(0);

  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddHint, setShowAddHint] = useState(() => !localStorage.getItem('add-hint-dismissed'));
  
  const [editingExpense, setEditingExpense] = useState<FinalExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<FinalExpense | null>(null);
  const [viewingBalanceForUser, setViewingBalanceForUser] = useState<User | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  const bannerDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tourAutoFinishTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial data from Firestore
  useEffect(() => {
    const fetchData = async () => {
        if (!currentUser) {
          setLoading(false);
          return;
        }
        
        // Initialize with empty arrays to prevent crashes
        let usersData: User[] = [];
        let groupsData: Group[] = [];
        let expensesData: FinalExpense[] = [];
        let notificationsData: Notification[] = [];
        let invitesData: GroupInvite[] = [];
        
        try {
            console.log("Fetching data from Firestore...");
            
            // PRIVACY & SECURITY: Only fetch users relevant to current user
            // Previously fetched ALL users (privacy issue at scale)
            // Now only fetch:
            // 1. Current user themselves (for profile display)
            // 2. Simulated/guest users created by current user (for group management)
            // This ensures users can't see or add other real users without permission
            
            // Get current user's document by ID first (most important)
            const currentUserDocRef = doc(db, 'users', currentUser.id);
            let currentUserDocSnap;
            try {
                currentUserDocSnap = await getDoc(currentUserDocRef);
            } catch (error: any) {
                console.warn("Could not fetch current user document (may not exist yet):", error);
                // Document might not exist yet - this is OK for brand new users
                currentUserDocSnap = { exists: () => false } as any;
            }
            
            // Fetch simulated users created by current user (may be empty for new users)
            let simulatedUsersSnapshot;
            try {
                const usersQuery = query(
                    collection(db, 'users'),
                    where('createdBy', '==', currentUser.id)
                );
                simulatedUsersSnapshot = await getDocs(usersQuery);
            } catch (error: any) {
                console.warn("Could not fetch simulated users (may be blocked by security rules):", error);
                // Create empty snapshot - new users won't have simulated users anyway
                simulatedUsersSnapshot = { docs: [] } as any;
            }
            
            // Combine current user + their simulated users
            // Both DocumentSnapshot and QueryDocumentSnapshot have .id and .data() methods
            const allUserDocs: any[] = [];
            if (currentUserDocSnap.exists()) {
                allUserDocs.push(currentUserDocSnap);
            }
            allUserDocs.push(...simulatedUsersSnapshot.docs);
            const usersSnapshot = { docs: allUserDocs };
            
            console.log(`Loaded ${allUserDocs.length} users (1 real + ${simulatedUsersSnapshot.docs.length} guest)`);
            
            // Fetch only groups where current user is a member
            let groupsSnapshot;
            try {
                const groupsQuery = query(
                    collection(db, 'groups'), 
                    where('members', 'array-contains', currentUser.id)
                );
                groupsSnapshot = await getDocs(groupsQuery);
            } catch (error: any) {
                console.warn("Could not fetch groups (may be blocked by security rules):", error);
                // Create empty snapshot - new users won't have groups anyway
                groupsSnapshot = { docs: [] } as any;
            }
            
            // Get group IDs for fetching expenses
            const groupIds = groupsSnapshot.docs.map(doc => doc.id);
            
            // Fetch expenses only for user's groups
            let expensesData: FinalExpense[] = [];
            if (groupIds.length > 0) {
                try {
                    // Firestore 'in' queries support max 10 items at a time
                    const batchSize = 10;
                    for (let i = 0; i < groupIds.length; i += batchSize) {
                        const batch = groupIds.slice(i, i + batchSize);
                        const expensesQuery = query(
                            collection(db, 'expenses'),
                            where('groupId', 'in', batch)
                        );
                        const expensesSnapshot = await getDocs(expensesQuery);
                        expensesData.push(...expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinalExpense)));
                    }
                } catch (error: any) {
                    console.warn("Could not fetch expenses (may be blocked by security rules):", error);
                    // Continue with empty expenses array
                }
            }
            
            // Fetch notifications (filtered by user's groups via invites)
            // Note: Notifications don't have userId field, so we fetch all and filter client-side
            // Security rules may block this - handle gracefully
            let notificationsSnapshot: { docs: any[] };
            try {
                const notificationsQuery = await getDocs(collection(db, 'notifications'));
                notificationsSnapshot = notificationsQuery;
            } catch (error: any) {
                console.warn("Could not fetch notifications (may be blocked by security rules):", error);
                // Create empty snapshot to prevent errors
                notificationsSnapshot = { docs: [] };
            }

            // Fetch group invites (sent by or to current user)
            let sentInvitesSnapshot, receivedInvitesSnapshot;
            try {
                const sentInvitesQuery = query(
                    collection(db, 'groupInvites'),
                    where('invitedBy', '==', currentUser.id)
                );
                const receivedInvitesQuery = query(
                    collection(db, 'groupInvites'),
                    where('invitedEmail', '==', currentUser.email?.toLowerCase())
                );
                
                [sentInvitesSnapshot, receivedInvitesSnapshot] = await Promise.all([
                    getDocs(sentInvitesQuery),
                    getDocs(receivedInvitesQuery)
                ]);
            } catch (error: any) {
                console.warn("Could not fetch group invites (may be blocked by security rules):", error);
                // Create empty snapshots - new users won't have invites anyway
                sentInvitesSnapshot = { docs: [] } as any;
                receivedInvitesSnapshot = { docs: [] } as any;
            }

            // Process all the data
            // Both DocumentSnapshot and QueryDocumentSnapshot have .id and .data() methods
            let usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            
            // CRITICAL FIX: Ensure current user is always in the users array
            // This prevents "Current user not found" errors for new users
            // If current user document exists in Firestore, it's already in usersData
            // If not (race condition or error), add currentUser from AuthContext
            const currentUserInArray = usersData.find(u => u.id === currentUser.id);
            if (!currentUserInArray) {
                // Add current user from AuthContext to ensure it's always available
                usersData = [currentUser, ...usersData];
                console.log("Added current user from AuthContext to users array (document may not exist in Firestore yet)");
            }
            
            const groupsData = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
            
            // Combine and deduplicate invites
            const allInviteDocs = [...sentInvitesSnapshot.docs, ...receivedInvitesSnapshot.docs];
            const uniqueInvites = new Map();
            allInviteDocs.forEach(doc => {
                if (!uniqueInvites.has(doc.id)) {
                    uniqueInvites.set(doc.id, { id: doc.id, ...doc.data() } as GroupInvite);
                }
            });
            const invitesData = Array.from(uniqueInvites.values()).sort((a,b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            // Filter notifications: only show notifications related to user's groups or invites
            // Notifications don't have userId field, so we filter based on inviteId -> groupId -> user membership
            const userGroupIds = new Set(groupsData.map(g => g.id));
            const userInviteIds = new Set(invitesData.map(inv => inv.id));
            
            // Safely map notifications - handle case where docs might be empty or undefined
            const allNotifications = (notificationsSnapshot?.docs || []).map(doc => {
                try {
                    return { id: doc.id, ...doc.data() } as Notification;
                } catch (e) {
                    console.warn("Error processing notification:", e);
                    return null;
                }
            }).filter((notif): notif is Notification => notif !== null);
            
            const filteredNotifications = allNotifications.filter(notif => {
                // If notification has inviteId, check if it's for the user
                if (notif.inviteId && userInviteIds.has(notif.inviteId)) {
                    return true;
                }
                // For expense notifications, they're typically for group members
                // Since we can't easily filter these without userId, skip them for now
                // This is safe - notifications are not critical for app functionality
                return false;
            });
            
            const notificationsData = filteredNotifications.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            // Sort expenses by date
            expensesData.sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

            setUsers(usersData);
            setGroups(groupsData);
            setExpenses(expensesData);
            setNotifications(notificationsData);
            setGroupInvites(invitesData);

            // Only set activeGroupId if not already set (only from active groups)
            const activeGroupsData = groupsData.filter(g => !g.archived);
            setActiveGroupId(prev => {
                if (prev) return prev;
                return activeGroupsData.length > 0 ? activeGroupsData[0].id : null;
            });
            console.log("Data fetched successfully.");
        } catch (error: any) {
            console.error("Error fetching data from Firestore:", error);
            
            // Even if fetch fails, ensure current user is in users array to prevent crashes
            setUsers(prevUsers => {
                const currentUserInUsers = prevUsers.find(u => u.id === currentUser.id);
                if (!currentUserInUsers) {
                    return [currentUser, ...prevUsers];
                }
                return prevUsers;
            });
            
            // Set empty arrays for other data to prevent crashes
            setGroups([]);
            setExpenses([]);
            setNotifications([]);
            setGroupInvites([]);
            
            // Only show alert for critical errors, not permission errors
            if (error?.code !== 'permission-denied') {
                alert("Could not fetch data from the database. Please check your Firebase connection and configuration.");
            } else {
                console.warn("Permission denied - some data may not be available. This is normal for new users.");
            }
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [currentUser]);

  // Handle password reset link from email
  useEffect(() => {
    const handlePasswordReset = async () => {
      // Check if URL contains password reset code
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const actionCode = urlParams.get('oobCode');
      
      if (mode === 'resetPassword' && actionCode) {
        // Show password reset form
        // We'll handle this in LoginScreen component
        console.log('Password reset link detected');
        // Store the action code in sessionStorage for LoginScreen to use
        sessionStorage.setItem('passwordResetCode', actionCode);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    handlePasswordReset();
  }, []);

  // Auto-dismiss install banner after 10 seconds (with pause on hover/interaction)
  // Follows Apple/Google best practices: auto-dismiss with pause on user interaction
  useEffect(() => {
    const AUTO_DISMISS_DELAY = 10000; // 10 seconds - gives users more time to read and interact
    
    // Check if banner should be shown (show on dashboard screen, regardless of activeGroup)
    const isDismissed = sessionStorage.getItem('install-banner-dismissed');
    const shouldShow = activeScreen === 'dashboard' && !isDismissed;
    
    // Update banner visibility
    setShowInstallBanner(shouldShow);

    if (!shouldShow) {
      // Clear timeout if banner shouldn't be shown
      if (bannerDismissTimeoutRef.current) {
        clearTimeout(bannerDismissTimeoutRef.current);
        bannerDismissTimeoutRef.current = null;
      }
      return;
    }

    // Clear any existing timeout before starting a new one
    if (bannerDismissTimeoutRef.current) {
      clearTimeout(bannerDismissTimeoutRef.current);
      bannerDismissTimeoutRef.current = null;
    }

    // Only start timer if banner is visible and not hovered
    if (!isBannerHovered) {
      bannerDismissTimeoutRef.current = setTimeout(() => {
        setShowInstallBanner(false);
        sessionStorage.setItem('install-banner-dismissed', 'true');
        bannerDismissTimeoutRef.current = null;
      }, AUTO_DISMISS_DELAY);
    }

    // Cleanup on unmount or when conditions change
    return () => {
      if (bannerDismissTimeoutRef.current) {
        clearTimeout(bannerDismissTimeoutRef.current);
        bannerDismissTimeoutRef.current = null;
      }
    };
  }, [activeScreen, isBannerHovered]);

  // Check if user needs onboarding (first time user)
  useEffect(() => {
    if (currentUser && !loading) {
      const hasCompletedOnboarding = localStorage.getItem('onboarding-completed');
      if (!hasCompletedOnboarding) {
        // Small delay to let UI render before starting tour
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, loading]);

  const handleFinishOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem('onboarding-completed', 'true');
    // Clear auto-finish timer if it exists
    if (tourAutoFinishTimeoutRef.current) {
      clearTimeout(tourAutoFinishTimeoutRef.current);
      tourAutoFinishTimeoutRef.current = null;
    }
  }, []);

  // Auto-finish onboarding tour after 10 seconds if user doesn't interact
  // Similar to banner auto-dismiss - gives users time but doesn't force them to complete
  useEffect(() => {
    const AUTO_FINISH_DELAY = 10000; // 10 seconds - same as banner
    
    if (!showOnboarding) {
      // Clear timeout if tour is not running
      if (tourAutoFinishTimeoutRef.current) {
        clearTimeout(tourAutoFinishTimeoutRef.current);
        tourAutoFinishTimeoutRef.current = null;
      }
      return;
    }

    // Start auto-finish timer when tour starts
    tourAutoFinishTimeoutRef.current = setTimeout(() => {
      handleFinishOnboarding();
    }, AUTO_FINISH_DELAY);

    // Cleanup on unmount or when tour ends
    return () => {
      if (tourAutoFinishTimeoutRef.current) {
        clearTimeout(tourAutoFinishTimeoutRef.current);
        tourAutoFinishTimeoutRef.current = null;
      }
    };
  }, [showOnboarding, handleFinishOnboarding]);

  // One-time hint: explain the + button purpose
  useEffect(() => {
    if (activeScreen === 'dashboard' && showAddHint) {
      const timer = setTimeout(() => {
        // Auto-hide after 6s so it doesn't linger if user ignores
        setShowAddHint(false);
        localStorage.setItem('add-hint-dismissed', 'true');
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activeScreen, showAddHint]);

  const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId && !g.archived), [groups, activeGroupId]);
  
  // Filter active (non-archived) groups
  const activeGroups = useMemo(() => groups.filter(g => !g.archived), [groups]);
  
  // Filter archived groups
  const archivedGroups = useMemo(() => groups.filter(g => g.archived), [groups]);
  const activeGroupMembers = useMemo(() => {
    if (!activeGroup) return [];
    return users.filter(u => activeGroup.members.includes(u.id));
  }, [activeGroup, users]);
  const groupForEditing = useMemo(() => groups.find(g => g.id === editingGroupId), [groups, editingGroupId]);

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && localStorage.theme) {
      return localStorage.theme as Theme;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // This effect ensures the active group ID is always valid (only from active groups).
  useEffect(() => {
    if (activeGroupId) {
      const activeGroupExists = activeGroups.some(g => g.id === activeGroupId);
      if (!activeGroupExists) {
        setActiveGroupId(activeGroups[0]?.id || null);
      }
    } else if (activeGroups.length > 0) {
      setActiveGroupId(activeGroups[0].id);
    }
  }, [activeGroups, activeGroupId]);


  // Mark notifications as read when activity screen is viewed
  useEffect(() => {
    if (activeScreen === 'activity') {
        const hasUnread = notifications.some(n => !n.read);
        if (hasUnread) {
            setTimeout(() => {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }, 1000);
        }
    }
  }, [activeScreen, notifications]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');
  const [filterUser, setFilterUser] = useState<string | 'all'>('all');

  const activeGroupExpenses = useMemo(() => {
    if (!activeGroupId) return [];
    return expenses.filter(e => e.groupId === activeGroupId);
  }, [expenses, activeGroupId]);

  // Calculate user balance for minimal display
  const balances = useMemo(() => {
    if (!activeGroupMembers || !currentUser) return new Map();
    const memberBalances = new Map<string, number>();
    activeGroupMembers.forEach(member => {
      memberBalances.set(member.id, 0);
    });

    activeGroupExpenses.forEach(expense => {
      const payerInGroup = memberBalances.has(expense.paidBy);
      if (payerInGroup) {
        const payerBalance = memberBalances.get(expense.paidBy) || 0;
        memberBalances.set(expense.paidBy, payerBalance + expense.amount);
        expense.splits.forEach(split => {
          if (memberBalances.has(split.userId)) {
            const splitteeBalance = memberBalances.get(split.userId) || 0;
            memberBalances.set(split.userId, splitteeBalance - split.amount);
          }
        });
      }
    });
    return memberBalances;
  }, [activeGroupExpenses, activeGroupMembers, currentUser]);

  const currentUserBalance = balances.get(currentUser?.id) || 0;
  const balanceColor = useMemo(() => {
    if (currentUserBalance > 0.01) return 'text-primary';
    if (currentUserBalance < -0.01) return 'text-orange-500';
    return 'text-charcoal dark:text-text-primary-dark';
  }, [currentUserBalance]);

  const balanceDescription = useMemo(() => {
    if (currentUserBalance > 0.01) return 'Overall, you are owed';
    if (currentUserBalance < -0.01) return 'Overall, you owe';
    return 'You are all settled up.';
  }, [currentUserBalance]);

  const getCategorySuggestion = useCallback(async (description: string): Promise<Category | null> => {
    if (description.trim().length < 3) {
        return null;
    }
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Analyze this expense description and return ONLY the category name from this list: ${CATEGORIES.join(', ')}. Description: "${description}". Return just the category name, nothing else.`;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Try to find matching category
        const matchedCategory = CATEGORIES.find(cat => 
            text.toLowerCase().includes(cat.toLowerCase())
        );
        
        return matchedCategory || null;
    } catch (error) {
        console.error("Error fetching category suggestion:", error);
        return null;
    }
}, []);

  const handleSaveExpense = useCallback(async (expense: FinalExpense) => {
    const currentUserData = users.find(u => u.id === currentUser.id);
    if (!currentUserData || !activeGroupId) {
      console.error("Cannot save expense: missing currentUserData or activeGroupId", { currentUserData, activeGroupId });
      alert("Failed to save expense: Missing user or group information.");
      return;
    }

    let message = '';
    let type: NotificationType;
    const expenseWithGroupId = { ...expense, groupId: activeGroupId };

    try {
        if (editingExpense) {
            const expenseDocRef = doc(db, 'expenses', editingExpense.id);
            // Remove 'id' field before updating - Firestore doesn't allow updating document IDs
            const { id, ...expenseDataWithoutId } = expenseWithGroupId;
            console.log('Updating expense:', editingExpense.id, expenseDataWithoutId);
            console.log('Current user:', currentUser.id, 'Active group:', activeGroupId);
            
            try {
                // Try to update the expense
                await updateDoc(expenseDocRef, expenseDataWithoutId);
                const updatedExpense = { ...expenseWithGroupId, id: editingExpense.id };
                setExpenses(prevExpenses => prevExpenses.map(e => e.id === editingExpense.id ? updatedExpense : e));
                setEditingExpense(null);
                message = `${currentUserData.name.replace(' (You)', '')} edited the expense "${expense.description}".`;
                type = NotificationType.ExpenseEdited;
            } catch (updateError: any) {
                // If update fails with "not-found", create it as new
                if (updateError?.code === 'not-found') {
                    console.warn(`Expense document ${editingExpense.id} does not exist in Firestore. Creating as new expense instead.`);
                    const docRef = await addDoc(collection(db, 'expenses'), expenseDataWithoutId);
                    const newExpenseWithId = { ...expenseDataWithoutId, id: docRef.id };
                    setExpenses(prevExpenses => {
                        // Remove the old expense from local state if it exists
                        const filtered = prevExpenses.filter(e => e.id !== editingExpense.id);
                        return [newExpenseWithId, ...filtered];
                    });
                    setEditingExpense(null);
                    message = `${currentUserData.name.replace(' (You)', '')} added a new expense: "${expense.description}" for $${expense.amount.toFixed(2)}.`;
                    type = NotificationType.ExpenseAdded;
                } else {
                    // Re-throw other errors (like permission-denied)
                    throw updateError;
                }
            }
        } else {
            // Remove 'id' field before creating - Firestore will generate its own ID
            const { id, ...expenseDataWithoutId } = expenseWithGroupId;
            console.log('Creating expense:', expenseDataWithoutId);
            console.log('Current user:', currentUser.id, 'Active group:', activeGroupId);
            const docRef = await addDoc(collection(db, 'expenses'), expenseDataWithoutId);
            const newExpenseWithId = { ...expenseDataWithoutId, id: docRef.id };
            setExpenses(prevExpenses => [newExpenseWithId, ...prevExpenses]);
            message = `${currentUserData.name.replace(' (You)', '')} added a new expense: "${expense.description}" for $${expense.amount.toFixed(2)}.`;
            type = NotificationType.ExpenseAdded;
        }

        // Create notification (wrap in try-catch to not fail expense save if notification fails)
        try {
            const newNotification: Omit<Notification, 'id'> = {
                message,
                type,
                timestamp: new Date().toISOString(),
                read: false,
            };
            const notificationDocRef = await addDoc(collection(db, 'notifications'), newNotification);
            setNotifications(prev => [{ id: notificationDocRef.id, ...newNotification }, ...prev]);
        } catch (notificationError: any) {
            console.warn("Failed to create notification (expense was saved):", notificationError);
            // Don't throw - expense was saved successfully
        }
    } catch (error: any) {
        console.error("Error saving expense: ", error);
        const errorMessage = error?.message || error?.code || 'Unknown error';
        console.error("Error details:", {
            code: error?.code,
            message: error?.message,
            expense: expenseWithGroupId,
            editingExpense: editingExpense?.id,
            currentUserId: currentUser.id,
            activeGroupId: activeGroupId
        });
        alert(`Failed to save expense: ${errorMessage}. Please check the console for details.`);
        return; // Don't navigate away if there's an error
    }
    setActiveScreen('dashboard');
  }, [editingExpense, users, activeGroupId, currentUser]);

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense? This will affect group balances.')) {
        try {
            await deleteDoc(doc(db, 'expenses', expenseId));
            setExpenses(prevExpenses => prevExpenses.filter(e => e.id !== expenseId));
        } catch (error) {
            console.error("Error deleting expense: ", error);
            alert("Failed to delete expense. Please try again.");
        }
    }
  }, []);

  const handleStartEdit = useCallback((expense: FinalExpense) => {
    setEditingExpense(expense);
    setActiveScreen('add');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingExpense(null);
    setActiveScreen('dashboard');
  }, []);
  
  const handleViewExpense = useCallback((expense: FinalExpense) => {
    setViewingExpense(expense);
  }, []);

  const handleViewBalanceDetail = useCallback((user: User) => {
    setViewingBalanceForUser(user);
  }, []);
  
  const handleCloseBalanceDetail = useCallback(() => {
    setViewingBalanceForUser(null);
  }, []);

  const handleRecordPayment = useCallback(async (payment: SimplifiedDebt) => {
    if (!activeGroup) return;
    const fromUser = users.find(m => m.id === payment.from);
    const toUser = users.find(m => m.id === payment.to);

    if (!fromUser || !toUser) return;

    const paymentExpenseData: Omit<FinalExpense, 'id'> = {
      groupId: activeGroup.id,
      description: `Payment from ${fromUser.name.replace(' (You)', '')} to ${toUser.name.replace(' (You)', '')}`,
      amount: payment.amount,
      currency: activeGroup.currency,
      category: Category.Payment,
      paidBy: payment.from,
      expenseDate: new Date().toISOString(),
      splitMethod: SplitMethod.Unequal,
      splits: [{ userId: payment.to, amount: payment.amount }],
    };

    const newNotificationData: Omit<Notification, 'id'> = {
        message: `${fromUser.name.replace(' (You)', '')} paid ${toUser.name.replace(' (You)', '')} ${formatCurrency(payment.amount, activeGroup.currency)}.`,
        type: NotificationType.PaymentRecorded,
        timestamp: new Date().toISOString(),
        read: false,
    };

    try {
        const expenseDocRef = await addDoc(collection(db, 'expenses'), paymentExpenseData);
        setExpenses(prev => [{...paymentExpenseData, id: expenseDocRef.id}, ...prev]);

        const notificationDocRef = await addDoc(collection(db, 'notifications'), newNotificationData);
        setNotifications(prev => [{...newNotificationData, id: notificationDocRef.id}, ...prev]);
    } catch(error) {
        console.error("Error recording payment: ", error);
        alert("Failed to record payment. Please try again.");
    }
  }, [activeGroup, users]);
  
  const handleSaveGroupChanges = async (updatedGroup: Group) => {
    if (!updatedGroup.members.some(memberId => memberId === currentUser.id)) {
        alert("You cannot remove yourself from the group.");
        return;
    }
    try {
        const groupDocRef = doc(db, 'groups', updatedGroup.id);
        await updateDoc(groupDocRef, { name: updatedGroup.name, members: updatedGroup.members });
        setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
        setEditingGroupId(null);
    } catch (error) {
        console.error("Error saving group changes: ", error);
        alert("Failed to save group changes. Please try again.");
    }
  };

  const handleArchiveGroup = async (groupId: string) => {
    try {
      const groupDocRef = doc(db, 'groups', groupId);
      await updateDoc(groupDocRef, { 
        archived: true, 
        archivedAt: new Date() 
      });
      
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, archived: true, archivedAt: new Date() }
          : g
      ));
      
      // If archived group was active, switch to another group or dashboard
      if (activeGroupId === groupId) {
        const activeGroups = groups.filter(g => !g.archived && g.id !== groupId);
        if (activeGroups.length > 0) {
          setActiveGroupId(activeGroups[0].id);
        } else {
          setActiveGroupId(null);
        }
      }
      
      setEditingGroupId(null);
    } catch (error) {
      console.error("Error archiving group: ", error);
      alert("Failed to archive group. Please try again.");
    }
  };

  const handleUnarchiveGroup = async (groupId: string) => {
    try {
      const groupDocRef = doc(db, 'groups', groupId);
      await updateDoc(groupDocRef, { 
        archived: false,
        archivedAt: null
      });
      
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, archived: false, archivedAt: undefined }
          : g
      ));
    } catch (error) {
      console.error("Error unarchiving group: ", error);
      alert("Failed to unarchive group. Please try again.");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error("Error deleting notification: ", error);
      alert("Failed to delete notification. Please try again.");
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });
      await batch.commit();

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking notifications as read: ", error);
      alert("Failed to mark notifications as read. Please try again.");
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      if (notifications.length === 0) return;

      const batch = writeBatch(db);
      notifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.delete(notificationRef);
      });
      await batch.commit();

      setNotifications([]);
    } catch (error) {
      console.error("Error clearing notifications: ", error);
      alert("Failed to clear notifications. Please try again.");
    }
  };

  const handleDeleteGroup = async (groupIdToDelete: string) => {
    try {
        const batch = writeBatch(db);
        
        // Delete the group document
        const groupDocRef = doc(db, 'groups', groupIdToDelete);
        batch.delete(groupDocRef);
        
        // Find and delete all associated expenses
        const expensesQuery = query(collection(db, 'expenses'), where('groupId', '==', groupIdToDelete));
        const expensesSnapshot = await getDocs(expensesQuery);
        expensesSnapshot.forEach(doc => batch.delete(doc.ref));
        
        await batch.commit();

        setExpenses(prev => prev.filter(e => e.groupId !== groupIdToDelete));
        setGroups(prev => prev.filter(g => g.id !== groupIdToDelete));
        setEditingGroupId(null);
    } catch (error) {
        console.error("Error deleting group and its expenses: ", error);
        alert("Failed to delete group. Please try again.");
    }
  };
  
  const handleCreateGroup = async (newGroupData: Omit<Group, 'id'>) => {
    try {
        // Ensure currentUser exists
        if (!currentUser || !currentUser.id) {
            throw new Error('User not authenticated');
        }

        // Ensure the current user is in the members array (required by Firestore rules)
        const members = newGroupData.members || [];
        if (!members.includes(currentUser.id)) {
            members.push(currentUser.id);
        }

        // Convert createdAt to ISO string if it's a Date object
        const createdAt = newGroupData.createdAt 
            ? (newGroupData.createdAt instanceof Date 
                ? newGroupData.createdAt.toISOString() 
                : typeof newGroupData.createdAt === 'string' 
                    ? newGroupData.createdAt 
                    : new Date().toISOString())
            : new Date().toISOString();

        const groupDataWithCreator = {
            ...newGroupData,
            members: members,
            createdBy: currentUser.id,
            createdAt: createdAt,
            archived: newGroupData.archived || false,
        };
        
        console.log('Creating group with data:', groupDataWithCreator);
        const docRef = await addDoc(collection(db, 'groups'), groupDataWithCreator);
        const newGroup = { ...groupDataWithCreator, id: docRef.id };
        setGroups(prev => [...prev, newGroup]);
        setActiveGroupId(newGroup.id);
        setActiveScreen('groups'); // Navigate to groups screen after creation
        setIsCreateGroupModalOpen(false); // Close the modal after successful creation
    } catch (error: any) {
        console.error("Error creating group: ", error);
        const errorMessage = error?.message || error?.code || 'Unknown error';
        console.error("Error details:", {
            code: error?.code,
            message: error?.message,
            currentUser: currentUser?.id,
            groupData: newGroupData
        });
        alert(`Failed to create group: ${errorMessage}. Please check the console for details.`);
    }
  }

  const handleCreateUser = async (name: string) => {
    try {
        // Ensure currentUser exists
        if (!currentUser || !currentUser.id) {
            throw new Error('User not authenticated');
        }

        const newUserNoId = {
            name: name.trim(),
            avatarUrl: `https://i.pravatar.cc/150?u=${crypto.randomUUID()}`,
            authType: 'simulated' as const,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString()
        };

        console.log('Creating simulated user with data:', newUserNoId);
        const docRef = await addDoc(collection(db, 'users'), newUserNoId);
        const newUser = { id: docRef.id, ...newUserNoId };
        setUsers(prev => [...prev, newUser]);
        console.log('Successfully created simulated user:', newUser.id);
    } catch (error: any) {
        logError('Create User', error, { userName: name, currentUserId: currentUser?.id });
        console.error("Error creating user: ", error);
        const errorMessage = error?.message || error?.code || 'Unknown error';
        console.error("Error details:", {
            code: error?.code,
            message: error?.message,
            currentUser: currentUser?.id,
            userName: name
        });
        alert(`Failed to create user: ${errorMessage}. Please check the console for details.`);
    }
  };

  const handleUpdatePaymentInfo = useCallback(async (paymentInfo: { venmo?: string; zelle?: string; cashApp?: string }, userId?: string) => {
    const targetUserId = userId || currentUser?.id;
    if (!targetUserId) return;
    
    // If updating a guest user, verify ownership
    if (userId) {
      const targetUser = users.find(u => u.id === userId);
      if (targetUser?.authType === 'simulated' && targetUser.createdBy !== currentUser?.id) {
        alert('You can only update payment info for users you created.');
        return;
      }
    }
    
    try {
      const userDocRef = doc(db, 'users', targetUserId);
      await updateDoc(userDocRef, { paymentInfo });
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === targetUserId 
          ? { ...u, paymentInfo }
          : u
      ));
    } catch (error) {
      console.error("Error updating payment info: ", error);
      alert("Failed to update payment info. Please try again.");
    }
  }, [currentUser, users]);

  const handleDeleteGuestUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    
    if (!user || user.authType !== 'simulated') {
      alert('Can only delete guest users.');
      return;
    }

    // Check 1: Is user in any groups?
    const userGroups = groups.filter(g => g.members.includes(userId));
    if (userGroups.length > 0) {
      alert(
        `Cannot delete this user.\n\n` +
        `They are in ${userGroups.length} group(s):\n` +
        userGroups.map(g => `• ${g.name}`).join('\n') +
        `\n\nRemove them from all groups first.`
      );
      return;
    }

    // Check 2: Does user have any outstanding balance?
    let hasBalance = false;
    const userExpenses = expenses.filter(exp => 
      exp.paidBy === userId || exp.splits.some(s => s.userId === userId)
    );

    if (userExpenses.length > 0) {
      // Calculate balance
      let balance = 0;
      userExpenses.forEach(exp => {
        if (exp.paidBy === userId) {
          balance += exp.amount;
        }
        const userSplit = exp.splits.find(s => s.userId === userId);
        if (userSplit) {
          balance -= userSplit.amount;
        }
      });

      if (Math.abs(balance) > 0.01) {
        hasBalance = true;
        const balanceText = balance > 0 
          ? `is owed $${balance.toFixed(2)}` 
          : `owes $${Math.abs(balance).toFixed(2)}`;
        
        alert(
          `Cannot delete this user.\n\n` +
          `${user.name} ${balanceText}.\n\n` +
          `Settle up all debts first.`
        );
        return;
      }
    }

    // Final confirmation
    const confirmMessage = userExpenses.length > 0
      ? `Delete ${user.name}?\n\nThis will also delete their ${userExpenses.length} expense(s). This cannot be undone.`
      : `Delete ${user.name}?\n\nThis cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Delete user's expenses first
      const batch = writeBatch(db);
      userExpenses.forEach(exp => {
        batch.delete(doc(db, 'expenses', exp.id));
      });
      
      // Delete user document
      batch.delete(doc(db, 'users', userId));
      
      await batch.commit();

      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      setExpenses(prev => prev.filter(exp => 
        exp.paidBy !== userId && !exp.splits.some(s => s.userId === userId)
      ));

      alert('Guest user deleted successfully.');
    } catch (error) {
      console.error("Error deleting user: ", error);
      alert("Failed to delete user. Please try again.");
    }
  };

  const handleSendGroupInvite = async (groupId: string, email: string, isResend: boolean = false) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Check if email matches current user
    if (currentUser.email?.toLowerCase() === email.toLowerCase()) {
      throw new Error('You cannot invite yourself');
    }

    try {
      let inviteId: string;
      let inviteUrl: string;

      if (isResend) {
        // For resend, find the existing invite
        const existingInvite = groupInvites.find(
          inv => inv.groupId === groupId && 
                 inv.invitedEmail === email.toLowerCase() && 
                 inv.status === 'pending'
        );
        
        if (!existingInvite) {
          throw new Error('No pending invite found to resend');
        }

        inviteId = existingInvite.id;
        inviteUrl = `https://splitbi.app?invite=${inviteId}`;
      } else {
        // For new invite, check for existing invites
        const existingInvite = groupInvites.find(
          inv => inv.groupId === groupId && 
                 inv.invitedEmail === email.toLowerCase() && 
                 inv.status === 'pending'
        );
        
        if (existingInvite) {
          throw new Error('This person has already been invited to this group');
        }

        // Create new invite
        const newInvite: Omit<GroupInvite, 'id'> = {
          groupId: group.id,
          groupName: group.name,
          invitedEmail: email.toLowerCase(),
          invitedBy: currentUser.id,
          inviterName: currentUser.name,
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        };

        const docRef = await addDoc(collection(db, 'groupInvites'), newInvite);
        const savedInvite = { id: docRef.id, ...newInvite };
        setGroupInvites(prev => [...prev, savedInvite]);
        
        inviteId = docRef.id;
        inviteUrl = `https://splitbi.app?invite=${inviteId}`;

        // Create notification for the invited user (if they have an account)
        const invitedUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (invitedUser) {
          const notification: Omit<Notification, 'id'> = {
            message: `${currentUser.name} invited you to join "${group.name}"`,
            type: NotificationType.GroupInvite,
            timestamp: new Date().toISOString(),
            read: false,
            inviteId: inviteId,
          };
          await addDoc(collection(db, 'notifications'), notification);
        }
      }

      // Send email invitation (for both new and resend)
      const emailResult = await sendGroupInviteEmail({
        invitedEmail: email.toLowerCase(),
        inviterName: currentUser.name,
        groupName: group.name,
        inviteUrl: inviteUrl,
      });

      // Show appropriate success message
      const action = isResend ? 'resent' : 'sent';
      const successMessage = emailResult.messageId 
        ? `✅ Email ${action} successfully to ${email}!\n\n📧 Message ID: ${emailResult.messageId}\n🔗 Invite Link: ${inviteUrl}\n\nThey'll receive an email with a link to join the group.`
        : `✅ Email ${action} successfully to ${email}!\n\n🔗 Invite Link: ${inviteUrl}\n\nThey'll receive an email with a link to join the group.`;
      
      alert(successMessage);
    } catch (error: any) {
      console.error("Error sending invite: ", error);
      throw new Error(error.message || 'Failed to send invite');
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    const invite = groupInvites.find(inv => inv.id === inviteId);
    if (!invite) {
      alert('Invite not found');
      return;
    }

    if (invite.invitedEmail.toLowerCase() !== currentUser.email?.toLowerCase()) {
      alert('This invite was not sent to your email address');
      return;
    }

    try {
      // Update invite status
      await updateDoc(doc(db, 'groupInvites', inviteId), {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        invitedUserId: currentUser.id,
      });

      // Add user to group
      const groupRef = doc(db, 'groups', invite.groupId);
      const groupDocSnap = await getDoc(groupRef); // FIX: use getDoc() instead of invalid __name__ query
      if (groupDocSnap.exists()) {
        const groupData = groupDocSnap.data() as Group;
        const updatedMembers = [...groupData.members, currentUser.id];
        await updateDoc(groupRef, { members: updatedMembers });
        
        // Update local state
        setGroups(prev => prev.map(g => 
          g.id === invite.groupId ? { ...g, members: updatedMembers } : g
        ));
        setGroupInvites(prev => prev.map(inv => 
          inv.id === inviteId ? { ...inv, status: 'accepted' as const, acceptedAt: new Date().toISOString(), invitedUserId: currentUser.id } : inv
        ));

        // Mark related notification as read
        const relatedNotification = notifications.find(n => n.inviteId === inviteId);
        if (relatedNotification) {
          await updateDoc(doc(db, 'notifications', relatedNotification.id), { read: true });
          setNotifications(prev => prev.map(n => n.id === relatedNotification.id ? { ...n, read: true } : n));
        }

        alert(`You've joined "${invite.groupName}"!`);
        setActiveGroupId(invite.groupId);
        setActiveScreen('dashboard');
      }
    } catch (error) {
      console.error("Error accepting invite: ", error);
      alert("Failed to accept invite. Please try again.");
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      await updateDoc(doc(db, 'groupInvites', inviteId), {
        status: 'declined',
      });

      setGroupInvites(prev => prev.map(inv => 
        inv.id === inviteId ? { ...inv, status: 'declined' as const } : inv
      ));

      // Mark related notification as read
      const relatedNotification = notifications.find(n => n.inviteId === inviteId);
      if (relatedNotification) {
        await updateDoc(doc(db, 'notifications', relatedNotification.id), { read: true });
        setNotifications(prev => prev.map(n => n.id === relatedNotification.id ? { ...n, read: true } : n));
      }

      alert('Invite declined');
    } catch (error) {
      console.error("Error declining invite: ", error);
      alert("Failed to decline invite. Please try again.");
    }
  };
  
  const handleSetActiveGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    // Don't allow selecting archived groups as active
    if (group && !group.archived) {
      setActiveGroupId(groupId);
      setActiveScreen('dashboard');
    }
  }

  const handleSelectGroupFromGroupsScreen = (groupId: string) => {
    setActiveGroupId(groupId);
    setEditingGroupId(groupId);
    setIsGroupManagementModalOpen(true);
  }

  const handleOpenSettleUp = () => setIsSettleUpModalOpen(true);
  const handleOpenExport = () => setIsExportModalOpen(true);

  const calculateGroupDebt = useCallback((groupId: string): number => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return 0;

    const groupExpenses = expenses.filter(e => e.groupId === groupId);
    if (groupExpenses.length === 0) return 0;

    const memberBalances = new Map<string, number>();
    group.members.forEach(memberId => {
        memberBalances.set(memberId, 0);
    });

    groupExpenses.forEach(expense => {
        if (memberBalances.has(expense.paidBy)) {
            const payerBalance = memberBalances.get(expense.paidBy) || 0;
            memberBalances.set(expense.paidBy, payerBalance + expense.amount);
        }
        expense.splits.forEach(split => {
            if (memberBalances.has(split.userId)) {
                const splitteeBalance = memberBalances.get(split.userId) || 0;
                memberBalances.set(split.userId, splitteeBalance - split.amount);
            }
        });
    });
    
    return Array.from(memberBalances.values()).reduce((sum, balance) => {
        return sum + (balance < 0 ? Math.abs(balance) : 0);
    }, 0);
  }, [expenses, groups]);

  const handleOpenGroupManagement = () => {
    if (activeGroupId) {
      setEditingGroupDebt(calculateGroupDebt(activeGroupId));
      setEditingGroupId(activeGroupId);
    }
  };


  const filteredExpenses = useMemo(() => {
    return activeGroupExpenses.filter(expense => {
      const searchTermMatch = searchTerm === '' || expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = filterCategory === 'all' || expense.category === filterCategory;
      const userMatch = filterUser === 'all' || expense.paidBy === filterUser || expense.splits.some(s => s.userId === filterUser);
      
      return searchTermMatch && categoryMatch && userMatch;
    });
  }, [activeGroupExpenses, searchTerm, filterCategory, filterUser]);
  
  const simplifiedDebts = useMemo(() => {
    if (!activeGroupMembers || activeGroupMembers.length === 0) return [];
    
    const balances = new Map<string, number>();
    activeGroupMembers.forEach(member => balances.set(member.id, 0));

    activeGroupExpenses.forEach(expense => {
        const payerInGroup = balances.has(expense.paidBy);
        if (payerInGroup) {
            const payerBalance = balances.get(expense.paidBy) || 0;
            balances.set(expense.paidBy, payerBalance + expense.amount);
            expense.splits.forEach(split => {
                if (balances.has(split.userId)) {
                    const splitteeBalance = balances.get(split.userId) || 0;
                    balances.set(split.userId, splitteeBalance - split.amount);
                }
            });
        }
    });
    
    return simplifyDebts(balances);
  }, [activeGroupExpenses, activeGroupMembers]);

  // Calculate total debt for archive eligibility
  const totalDebt = useMemo(() => {
    return simplifiedDebts.reduce((sum, debt) => sum + Math.abs(debt.amount), 0);
  }, [simplifiedDebts]);

  const hasActiveFilters = searchTerm !== '' || filterCategory !== 'all' || filterUser !== 'all';

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);
  
  if (authLoading || loading) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-cream">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-teal-primary"></div>
        </div>
    );
  }

  if (!currentUser) {
      return <LoginScreen />;
  }

  const renderContent = () => {
    switch(activeScreen) {
      case 'dashboard':
        if (!activeGroup) {
          return (
            <motion.main 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-stone-100 dark:border-gray-700 overflow-hidden"
            >
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                    {/* Welcome Title - Similar size to balance amount */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-center mb-6"
                    >
                        <h1 className="text-4xl sm:text-5xl font-sans font-extrabold tracking-tight text-charcoal dark:text-gray-100 mb-2">
                          Welcome to Split<span className="text-primary">Bi</span>
                        </h1>
                        <p className="text-sm font-medium text-charcoal/80 dark:text-gray-300 mt-1.5">
                          Let's create your first group to start tracking shared expenses
                        </p>
                    </motion.div>
                    
                    {/* Groups Info Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-primary/10 dark:bg-primary/10 rounded-xl p-4 sm:p-5 mb-6"
                    >
                        <p className="text-base sm:text-lg font-sans font-extrabold text-charcoal dark:text-gray-100 tracking-tight mb-3">
                            💡 What are groups?
                        </p>
                        <p className="text-sm text-sage dark:text-text-secondary-dark mb-3">
                            Groups help you organize expenses for different situations:
                        </p>
                        <ul className="space-y-2 text-sm text-sage dark:text-text-secondary-dark">
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Roommates</strong> - Track rent, utilities, groceries</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Trip with Friends</strong> - Hotels, meals, activities</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Family Expenses</strong> - Shared household costs</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Events</strong> - Weddings, parties, celebrations</span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* Create Group Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveScreen('groups');
                        setIsCreateGroupModalOpen(true);
                      }}
                      className="w-full px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-sm hover:bg-primary-700 transition-colors"
                    >
                        + Create Your First Group
                    </motion.button>
                </div>
            </motion.main>
          )
        }

        return null; // Dashboard content is rendered inline in the unified container
      case 'add':
        if (!activeGroup || !activeGroupId) {
             return (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="overflow-hidden"
                 >
                    <div className="p-6 sm:p-8 text-center">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal dark:text-gray-100 tracking-tight">Choose a Group</h2>
                        <p className="mt-2 text-sage dark:text-gray-400">Select a group to add your expense.</p>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActiveScreen('groups')}
                          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-700 text-white rounded-full font-bold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
                        >
                          Go to Groups
                        </motion.button>
                    </div>
                 </motion.div>
             )
        }
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-6">
              <div className="mb-4 sm:mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-charcoal dark:text-gray-100 tracking-tight">
                    {editingExpense ? 'Edit Expense' : 'Add Expense'}
                  </h2>
                  <span className="hidden sm:inline text-primary">→</span>
                  <span className="hidden sm:inline text-sm px-3 py-1 rounded-full border border-primary/20 bg-primary-100 dark:bg-primary/20 text-primary font-semibold">
                    {activeGroup?.name}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveScreen('dashboard')}
                  className="p-2 text-sage hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-stone-100 dark:hover:bg-gray-800"
                  aria-label="Close and return to dashboard"
                  title="Close"
                >
                  ×
                </motion.button>
              </div>
              <AddExpenseForm 
                members={activeGroupMembers}
                currentUserId={currentUser.id} 
                onSaveExpense={handleSaveExpense} 
                expenseToEdit={editingExpense}
                onCancelEdit={handleCancelEdit}
                group={activeGroup!}
                getCategorySuggestion={getCategorySuggestion}
                onBack={() => setActiveScreen('dashboard')}
              />
            </div>
          </motion.div>
        );
      case 'groups':
        return (
          <GroupsScreen 
              groups={groups}
              users={users}
              expenses={expenses}
              activeGroupId={activeGroupId}
              currentUserId={currentUser.id}
              onSelectGroup={handleSelectGroupFromGroupsScreen}
              onCreateGroup={handleCreateGroup}
              onManageGroupMembers={(groupId) => {
                setEditingGroupId(groupId);
                setIsGroupManagementModalOpen(true);
              }}
              onArchiveGroup={handleArchiveGroup}
              onUnarchiveGroup={handleUnarchiveGroup}
              balanceHeader={activeGroup ? (
                <BalanceHeader
                  balance={currentUserBalance}
                  currency={activeGroup.currency}
                  balanceColor={balanceColor}
                  balanceDescription={balanceDescription}
                  onAddClick={() => setActiveScreen('add')}
                  onSettleClick={handleOpenSettleUp}
                  onUsersClick={() => setActiveScreen('profile')}
                />
              ) : undefined}
            />
        );
      case 'activity':
          return (
              <ActivityScreen 
                notifications={notifications} 
                groupInvites={groupInvites.filter(invite => invite.invitedEmail === currentUser.email?.toLowerCase())}
                onAcceptInvite={handleAcceptInvite}
                onDeclineInvite={handleDeclineInvite}
                onDeleteNotification={handleDeleteNotification}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                onClearAll={handleClearAllNotifications}
                balanceHeader={activeGroup ? (
                  <BalanceHeader
                    balance={currentUserBalance}
                    currency={activeGroup.currency}
                    balanceColor={balanceColor}
                    balanceDescription={balanceDescription}
                    onAddClick={() => setActiveScreen('add')}
                    onSettleClick={handleOpenSettleUp}
                    onUsersClick={() => setActiveScreen('profile')}
                  />
                ) : undefined}
              />
          );
      case 'profile':
        return (
              <ProfileScreen
                users={users}
                onCreateUser={handleCreateUser}
                onDeleteGuestUser={handleDeleteGuestUser}
                onUpdatePaymentInfo={handleUpdatePaymentInfo}
                onOpenInviteModal={() => {
                  if (activeGroups.length === 0) {
                    alert('Please create a group first before sending invites.');
                    setActiveScreen('groups');
                  } else if (activeGroups.length === 1) {
                    // If only one active group, use it directly
                    setInviteGroupId(activeGroups[0].id);
                    setIsInviteModalOpen(true);
                  } else {
                    // Multiple groups - show group selector
                    alert('Please select a group first. Go to Groups screen to select the group you want to invite someone to.');
                    setActiveScreen('groups');
                  }
                }}
                onOpenGroupManagement={() => {
                  if (activeGroupId) {
                    setEditingGroupId(activeGroupId);
                    setIsGroupManagementModalOpen(true);
                  }
                }}
                onOpenGroupSelector={() => setActiveScreen('groups')}
                groupInvites={groupInvites.filter(invite => invite.invitedBy === currentUser.id)}
                onResendInvite={async (inviteId) => {
                  const invite = groupInvites.find(inv => inv.id === inviteId);
                  if (invite) {
                    try {
                      await handleSendGroupInvite(invite.groupId, invite.invitedEmail, true);
                      // Success message is already shown by handleSendGroupInvite
                    } catch (error: any) {
                      alert(error.message || 'Failed to resend invite');
                    }
                  }
                }}
              />
        );
      default:
        return null;
    }
  }

  return (
    <div className="bg-cream dark:bg-surface-dark font-sans text-charcoal dark:text-text-primary-dark transition-colors duration-300 min-h-screen flex items-center justify-center pb-32" style={{ backgroundColor: '#FDFCF9' }}>
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl mx-auto relative flex flex-col min-h-screen">
        {/* Unified Container - Content and Nav as One Unit */}
        <div className="bg-gradient-to-b from-white via-stone-50/30 to-stone-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-t-3xl overflow-hidden shadow-lg border-x border-t border-stone-200 dark:border-gray-700 flex flex-col flex-grow mb-0">
          {/* Integrated Header - Compact & Modern */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-primary/15 via-primary/8 to-white dark:from-primary/20 dark:via-primary/12 dark:to-gray-800 px-4 pt-3 pb-3 border-b-2 border-primary/20 dark:border-primary/30"
          >
              {/* Header Content */}
              <div className="flex items-center justify-between">
                {/* Logo - Compact */}
                <div className="flex items-center gap-2.5">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-white to-primary/5 dark:from-gray-900 dark:to-primary/10 rounded-xl p-2 shadow-md ring-1 ring-primary/20 dark:ring-primary/30"
                  >
                    <img 
                      src="/splitBi-logo-notext-svg.svg" 
                      alt="SplitBi" 
                      className="h-10 w-10 sm:h-12 sm:w-12"
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-extrabold text-charcoal dark:text-gray-100 tracking-tight">
                      Split<span className="text-primary">Bi</span>
                    </h1>
                    <p className="text-xs text-primary dark:text-primary-300 font-semibold tracking-wide uppercase hidden sm:block">
                      Splitting expenses, made easy
                    </p>
                  </div>
                </div>
                
                {/* Right side: User Menu + Theme Toggle */}
                <div className="flex flex-col items-end gap-1.5">
                  <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                  <motion.button
                    ref={userMenuButtonRef}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-gray-800 backdrop-blur-sm text-xs text-sage dark:text-gray-300 hover:text-charcoal dark:hover:text-gray-200 transition-all border border-primary/20 dark:border-primary/30 shadow-sm"
                  >
                    <span className="font-semibold text-charcoal dark:text-gray-200 hidden sm:inline">{currentUser.name}</span>
                    <span className="font-semibold text-charcoal dark:text-gray-200 sm:hidden">{currentUser.name.split(' ')[0]}</span>
                    <svg className={`w-3 h-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </motion.button>
                </div>
              </div>
              
              {/* User Menu Dropdown */}
              {showUserMenu && userMenuButtonRef.current && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed z-[60] w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-stone-200 dark:border-gray-700 overflow-hidden"
                    style={{
                      top: `${userMenuButtonRef.current.getBoundingClientRect().bottom + 8}px`,
                      right: `${window.innerWidth - userMenuButtonRef.current.getBoundingClientRect().right}px`
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 border-b border-stone-200 dark:border-stone-700 bg-surface dark:bg-gray-900/50">
                      <p className="text-xs text-sage dark:text-text-secondary-dark">Signed in as</p>
                      <p className="text-sm font-semibold text-charcoal dark:text-text-primary-dark truncate">{currentUser.email}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </motion.button>
                  </motion.div>
                </>
              )}

              {/* One-time hint over + button area (bottom center) */}
              {showAddHint && (
                <div className="pointer-events-none">
                  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs px-3 py-2 rounded-full shadow-lg border border-border-light dark:border-border-dark">
                    Tip: Tap the + button below to add an expense to your current group
                  </div>
                  <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 text-primary">
                    ▼
                  </div>
                  <button
                    onClick={() => {
                      localStorage.setItem('add-hint-dismissed', 'true');
                      setShowAddHint(false);
                    }}
                    className="fixed bottom-28 right-6 z-40 px-2 py-1 bg-gray-900/80 text-white text-[10px] rounded pointer-events-auto"
                    aria-label="Dismiss hint"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </motion.header>
            
            {/* Utility Bar - Positioned below header */}
            <UtilityBar
              onFeedbackClick={() => setIsFeedbackModalOpen(true)}
              onCurrencyConverterClick={() => setIsCurrencyConverterOpen(true)}
              onHelpClick={() => setIsHelpModalOpen(true)}
            />
            
            {/* Dashboard Content - Part of Same Container */}
            {activeScreen === 'dashboard' && activeGroup && (
              <>
                {/* Balance & Quick Actions Section - Split Layout */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-primary/8 via-white to-primary/5 dark:from-primary/15 dark:via-gray-700 dark:to-primary/10 px-4 py-4 sm:px-6 sm:py-4 rounded-t-2xl border-b-2 border-primary/20 dark:border-primary/30"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Left Half - Balance */}
                    <div className="flex flex-col justify-center">
                      <div className="text-center md:text-left">
                        <div className="relative inline-block">
                          <p className={`text-4xl sm:text-5xl font-sans font-extrabold mb-1.5 tracking-tight ${balanceColor}`}>
                            {formatCurrency(Math.abs(currentUserBalance), activeGroup?.currency || 'USD')}
                          </p>
                          {currentUserBalance > 0.01 && (
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-charcoal/80 dark:text-gray-300 mt-1.5">{balanceDescription}</p>
                      </div>
                    </div>

                    {/* Right Half - Quick Actions */}
                    <div className="flex flex-col justify-center">
                      <div className="grid grid-cols-3 gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setActiveScreen('add')}
                          className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-gradient-to-br from-primary to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
                          title="Add Expense"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-xs font-bold">Add</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                          onClick={handleOpenSettleUp}
                          className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-white dark:bg-gray-700 border-2 border-stone-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 hover:bg-primary/10 dark:hover:bg-primary/20 text-charcoal dark:text-gray-200 rounded-xl transition-all shadow-md hover:shadow-lg"
                          title="Settle Up"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-bold">Settle</span>
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setActiveScreen('profile')}
                          className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 bg-white dark:bg-gray-700 border-2 border-stone-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 hover:bg-primary/10 dark:hover:bg-primary/20 text-charcoal dark:text-gray-200 rounded-xl transition-all shadow-md hover:shadow-lg"
                          title="Manage Users"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="text-xs font-bold">Users</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Groups Section - Compact & Slick */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white dark:bg-gray-700 border-t-2 border-stone-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base sm:text-lg font-sans font-extrabold text-charcoal dark:text-gray-100 tracking-tight">Groups</h3>
                    <div className="flex items-center gap-3">
                      <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreateGroupModalOpen(true);
                        }}
                        className="text-xs sm:text-sm text-primary dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-400 transition-colors font-semibold"
                      >
                        Create
                      </motion.button>
                      {activeGroupId && activeGroup && !activeGroup.archived && totalDebt < 0.01 && (
                        <motion.button 
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Archive this group? You can unarchive it later from the Archived Groups section.')) {
                              handleArchiveGroup(activeGroupId);
                            }
                          }}
                          className="text-xs sm:text-sm text-[#1E3450] dark:text-[#1E3450] hover:opacity-80 transition-colors font-semibold"
                        >
                          Archive
                        </motion.button>
                      )}
                      <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveScreen('groups');
                        }}
                        className="text-xs sm:text-sm text-[#1E3450] dark:text-[#1E3450] hover:opacity-80 transition-colors font-semibold"
                      >
                        Manage →
                      </motion.button>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {activeGroups.map((group, index) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                        onClick={() => {
                          setActiveGroupId(group.id);
                          setActiveScreen('groups');
                        }}
                        className={`flex items-center gap-2 py-1.5 px-2 rounded transition-all cursor-pointer group ${
                          activeGroupId === group.id 
                            ? 'bg-primary/10 dark:bg-primary/20' 
                            : 'hover:bg-primary/5 dark:hover:bg-gray-600/50'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          activeGroupId === group.id 
                            ? 'bg-primary dark:bg-primary-400' 
                            : 'bg-stone-200 dark:bg-gray-600 group-hover:bg-primary/20 dark:group-hover:bg-primary/30'
                        }`}>
                          <GroupIcon 
                            groupName={group.name} 
                            className={`w-3 h-3 ${
                              activeGroupId === group.id 
                                ? 'text-white dark:text-gray-900' 
                                : 'text-charcoal dark:text-gray-300'
                            }`}
                          />
                        </div>
                        <div className="flex-grow min-w-0 flex items-center justify-between gap-2">
                          <p className={`text-sm font-sans font-extrabold truncate ${
                            activeGroupId === group.id 
                              ? 'text-primary dark:text-primary-300' 
                              : 'text-charcoal dark:text-gray-100'
                          }`}>
                            {group.name}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className="text-xs text-sage dark:text-gray-400">
                              {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                            </span>
                            {activeGroupId === group.id && (
                              <span className="w-1.5 h-1.5 bg-primary dark:bg-primary-300 rounded-full"></span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Recent Expenses Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
              className="px-4 py-3 sm:px-6 sm:py-4 bg-white dark:bg-gray-700 border-t-2 border-stone-200 dark:border-gray-600"
            >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-sans font-extrabold text-charcoal dark:text-gray-100 tracking-tight">
                      Recent Expenses
                    </h3>
                    <span className="text-xs text-sage dark:text-gray-400">(last 3)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveScreen('add');
                      }}
                      className="text-xs sm:text-sm text-primary dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-400 transition-colors font-semibold"
                    >
                      Add Expense
                    </motion.button>
                    <span className="text-xs font-bold text-primary dark:text-primary-300 bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-full border-2 border-primary/30 dark:border-primary/40">
                      {activeGroupExpenses.length} total
                    </span>
                  </div>
                </div>
                  <div>
                  <div className="space-y-1.5">
                    {activeGroupExpenses.slice(0, 3).map((expense, index) => {
                      const payer = activeGroupMembers.find(m => m.id === expense.paidBy);
                      return (
                        <motion.div 
                          key={expense.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          onClick={() => handleViewExpense(expense)}
                          className="flex items-center gap-3 py-2.5 hover:bg-primary/10 dark:hover:bg-primary/30 rounded-xl transition-all -mx-2 px-3 border border-transparent hover:border-primary/20 dark:hover:border-primary/30 cursor-pointer"
                        >
                          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary/40 dark:to-primary/30 flex items-center justify-center border-2 border-primary/30 dark:border-primary/40 shadow-sm">
                            <span className="text-primary dark:text-primary-200 text-base">
                              {expense.category === 'Food' ? '🍕' :
                               expense.category === 'Transport' ? '🚗' :
                               expense.category === 'Entertainment' ? '🎬' :
                               expense.category === 'Shopping' ? '🛍️' :
                               '💰'}
                            </span>
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-base font-sans font-extrabold truncate text-charcoal dark:text-gray-100">{expense.description}</p>
                            <p className="text-xs font-medium text-sage dark:text-gray-400 mt-0.5">
                              {payer?.name?.replace(' (You)', '')}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <p className="text-lg font-sans font-extrabold text-charcoal dark:text-gray-100">
                              {formatCurrency(expense.amount, activeGroup?.currency || 'USD')}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    </div>
                    {activeGroupExpenses.length === 0 && (
                      <div className="text-center py-6">
                        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-primary-50 dark:bg-primary/20 flex items-center justify-center border border-primary/20 dark:border-primary/30">
                          <span className="text-primary dark:text-primary-300 text-lg">💰</span>
                        </div>
                        <p className="text-sm text-sage dark:text-gray-400">No expenses yet</p>
                        <p className="text-xs text-sage dark:text-gray-500 mt-1">Add your first expense to get started</p>
                      </div>
                    )}
                    {activeGroupExpenses.length > 3 && (
                      <div className="pt-3">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            // Scroll to expenses section or ensure we're viewing expenses
                            // The expenses are already shown below, but we can scroll to them
                            const expensesSection = document.getElementById('expenses-section');
                            if (expensesSection) {
                              expensesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="w-full text-sm text-primary hover:text-primary-700 transition-colors font-medium py-2"
                        >
                          View All Expenses →
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Full Expenses List Section */}
                {activeGroupExpenses.length > 0 && (
                  <motion.div 
                    id="expenses-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="px-4 py-3 sm:px-6 sm:py-4 bg-white dark:bg-gray-700 border-t-2 border-stone-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-sans font-extrabold text-charcoal dark:text-gray-100 tracking-tight">
                          All Expenses
                        </h3>
                        <span className="text-xs font-bold text-primary dark:text-primary-300 bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-full border-2 border-primary/30 dark:border-primary/40">
                          {searchTerm !== '' || filterCategory !== 'all' || filterUser !== 'all' 
                            ? `${filteredExpenses.length} of ${activeGroupExpenses.length}`
                            : `${activeGroupExpenses.length} total`}
                        </span>
                      </div>
                      <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveScreen('add');
                        }}
                        className="text-xs sm:text-sm text-primary dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-400 transition-colors font-semibold"
                      >
                        Add Expense
                      </motion.button>
                    </div>
                    
                    {/* Expense Filter */}
                    <ExpenseFilter
                      searchTerm={searchTerm}
                      onSearchChange={setSearchTerm}
                      filterCategory={filterCategory}
                      onCategoryChange={setFilterCategory}
                      filterUser={filterUser}
                      onUserChange={setFilterUser}
                      members={activeGroupMembers}
                      categories={CATEGORIES}
                    />
                    
                    {/* Expense List */}
                    <div className="mt-4">
                      <ExpenseList
                        expenses={filteredExpenses}
                        members={activeGroupMembers}
                        onDeleteExpense={handleDeleteExpense}
                        onEditExpense={(expense) => {
                          setEditingExpense(expense);
                          setActiveScreen('add');
                        }}
                        onViewExpense={handleViewExpense}
                        hasActiveFilters={searchTerm !== '' || filterCategory !== 'all' || filterUser !== 'all'}
                        originalExpenseCount={activeGroupExpenses.length}
                        currentUserId={currentUser?.id || ''}
                      />
                    </div>
                  </motion.div>
                )}

              </>
            )}
            
            {/* Install Banner - Show to new users - Auto-dismisses after 10 seconds if ignored */}
            {showInstallBanner && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                onMouseEnter={() => setIsBannerHovered(true)}
                onMouseLeave={() => setIsBannerHovered(false)}
                className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-teal-light to-teal-light/50 dark:from-primary/20 dark:to-primary/10 border-t-2 border-teal-primary/20 dark:border-primary/30"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-2xl">📱</div>
                  <div className="flex-1">
                    <h3 className="font-sans font-bold text-charcoal dark:text-text-primary-dark mb-2">
                      Install Split<span className="text-primary">Bi</span> on your device!
                    </h3>
                    <p className="text-sm text-sage dark:text-text-secondary-dark mb-4">
                      Get instant access from your home screen. Works offline too!
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <motion.a 
                        href="/install.html"
                        target="_blank"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsBannerHovered(true)} // Pause timer on click
                        className="inline-flex items-center px-6 py-3 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors"
                      >
                        📖 See How to Install
                      </motion.a>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowInstallBanner(false);
                          sessionStorage.setItem('install-banner-dismissed', 'true');
                          if (bannerDismissTimeoutRef.current) {
                            clearTimeout(bannerDismissTimeoutRef.current);
                          }
                        }}
                        className="inline-flex items-center px-6 py-3 bg-white dark:bg-gray-700 border border-stone-200 dark:border-stone-600 text-charcoal dark:text-text-primary-dark text-sm font-medium rounded-full hover:bg-surface dark:hover:bg-gray-600 transition-colors"
                      >
                        Maybe Later
                      </motion.button>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowInstallBanner(false);
                      sessionStorage.setItem('install-banner-dismissed', 'true');
                      if (bannerDismissTimeoutRef.current) {
                        clearTimeout(bannerDismissTimeoutRef.current);
                      }
                    }}
                    className="flex-shrink-0 text-sage hover:text-charcoal dark:hover:text-gray-300 text-xl leading-none transition-colors"
                    aria-label="Close"
                  >
                    ×
                  </motion.button>
                </div>
              </motion.div>
            )}
            
            {/* Other Screens - Integrated into same container */}
            {(activeScreen !== 'dashboard' || !activeGroup) && renderContent()}
        </div>
      </div>

      <BottomNav 
        activeScreen={activeScreen} 
        onNavigate={setActiveScreen} 
        notificationCount={unreadNotificationCount} 
      />
      
      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onRestartTour={() => {
          localStorage.removeItem('onboarding-completed');
          setShowOnboarding(true);
        }}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      {/* Currency Converter Modal */}
      <CurrencyConverterModal
        isOpen={isCurrencyConverterOpen}
        onClose={() => setIsCurrencyConverterOpen(false)}
      />

      {/* Onboarding Tour - Only for first-time users */}
      <OnboardingTour 
        run={showOnboarding}
        onFinish={handleFinishOnboarding}
      />

      {isSettleUpModalOpen && activeGroup && (
        <SettleUpModal
          isOpen={isSettleUpModalOpen}
          onClose={() => setIsSettleUpModalOpen(false)}
          expenses={activeGroupExpenses}
          members={activeGroupMembers}
          currency={activeGroup.currency}
          onRecordPayment={handleRecordPayment}
        />
      )}
      
      {isExportModalOpen && activeGroup && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          expenses={activeGroupExpenses}
          members={activeGroupMembers}
          simplifiedDebts={simplifiedDebts}
          group={activeGroup}
        />
      )}

      {isGroupManagementModalOpen && groupForEditing && (
          <GroupManagementModal
              isOpen={isGroupManagementModalOpen}
              onClose={() => {
                setEditingGroupId(null);
                setIsGroupManagementModalOpen(false);
              }}
              group={groupForEditing}
              allUsers={users}
              currentUserId={currentUser.id}
              onSave={handleSaveGroupChanges}
              onDelete={handleDeleteGroup}
              onArchive={handleArchiveGroup}
              onUnarchive={handleUnarchiveGroup}
              totalDebt={editingGroupDebt}
              onCreateUser={handleCreateUser}
              groupInvites={groupInvites}
              onInviteMember={() => {
                setInviteGroupId(groupForEditing.id);
                setIsInviteModalOpen(true);
              }}
          />
      )}

      {inviteGroupId && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => {
            setIsInviteModalOpen(false);
            setInviteGroupId(null);
          }}
          group={groups.find(g => g.id === inviteGroupId)!}
          onSendInvite={async (email) => {
            await handleSendGroupInvite(inviteGroupId, email);
          }}
          />
      )}

      {viewingExpense && activeGroup && (
          <ExpenseDetailModal
              isOpen={!!viewingExpense}
              onClose={() => setViewingExpense(null)}
              expense={viewingExpense}
              members={activeGroupMembers}
          />
      )}

      {viewingBalanceForUser && activeGroup && (
          <BalanceDetailModal
              isOpen={!!viewingBalanceForUser}
              onClose={handleCloseBalanceDetail}
              currentUser={users.find(m => m.id === currentUser.id)!}
              targetUser={viewingBalanceForUser}
              allExpenses={activeGroupExpenses}
          />
      )}

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onCreate={handleCreateGroup}
      />
    </div>
  );
};

export default App;