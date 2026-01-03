
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import AddExpenseForm from './components/AddExpenseForm';
import ExpenseList from './components/ExpenseList';
import BalanceSummary from './components/BalanceSummary';
import BalanceHeader from './components/BalanceHeader';
import SettleUpModal from './components/SettleUpModal';
import GroupFinancialSummary from './components/GroupFinancialSummary';
import ExpenseDetailModal from './components/ExpenseDetailModal';
import ExpenseFilter from './components/ExpenseFilter';
import BalanceDetailModal from './components/BalanceDetailModal';
import BottomNav from './components/BottomNav';
import VersionFooter from './components/VersionFooter';
import GroupManagementModal from './components/GroupManagementModal';
import GroupsScreen from './components/GroupsScreen';
import CreateGroupModal from './components/CreateGroupModal';
import ProfileScreen from './components/ProfileScreen';
import ActivityScreen from './components/ActivityScreen';
import ExportModal from './components/ExportModal';
import { CATEGORIES, createNewUser } from './constants';
import type { FinalExpense, SimplifiedDebt, User, Group, Notification, GroupInvite } from './types';
import { SplitMethod, Category, NotificationType } from './types';
import { MoonIcon, SunIcon, UsersIcon, EditIcon, DeleteIcon } from './components/icons';
import { simplifyDebts } from './utils/debtSimplification';
import { formatCurrency } from './utils/currencyFormatter';
import { logError } from './utils/errorLogger';
import { sendGroupInviteEmail } from './utils/emailService';
import { logAdminAction } from './utils/adminLogger';
import { db } from './firebase';
import { collection, getDocs, getDoc, doc, writeBatch, addDoc, updateDoc, deleteDoc, query, where, arrayUnion, runTransaction } from 'firebase/firestore';
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
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      className="relative p-2.5 rounded-xl bg-white dark:bg-gray-700 shadow-md hover:shadow-lg border border-stone-200 dark:border-gray-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 cursor-pointer group overflow-hidden"
      aria-label="Toggle theme"
    >
      {/* Background gradient effect */}
      <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${
        isDark
          ? 'from-indigo-500/10 to-purple-500/10 opacity-100'
          : 'from-amber-400/10 to-orange-400/10 opacity-100'
      }`} />

      {/* Icon container with smooth rotation */}
      <motion.div
        className="relative z-10"
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {isDark ? (
          <MoonIcon className="h-5 w-5 text-indigo-400 dark:text-indigo-300 drop-shadow-sm" />
        ) : (
          <SunIcon className="h-5 w-5 text-amber-500 drop-shadow-sm" />
        )}
      </motion.div>

      {/* Subtle glow effect on hover */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        isDark
          ? 'bg-indigo-400/5'
          : 'bg-amber-400/5'
      }`} />

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
  const [dataRefreshTrigger, setDataRefreshTrigger] = useState(0);
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
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);

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

            // Deduplicate expenses by ID (in case of duplicates from multiple queries)
            const uniqueExpenses = new Map<string, FinalExpense>();
            expensesData.forEach(expense => {
                if (!uniqueExpenses.has(expense.id)) {
                    uniqueExpenses.set(expense.id, expense);
                } else {
                    console.warn(`Duplicate expense ID detected during fetch: ${expense.id} - "${expense.description}"`);
                }
            });
            const deduplicatedExpenses = Array.from(uniqueExpenses.values());
            
            // Sort expenses by date
            deduplicatedExpenses.sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

            setUsers(usersData);
            setGroups(groupsData);
            setExpenses(deduplicatedExpenses);
            setNotifications(notificationsData);
            setGroupInvites(invitesData);

            // Only set activeGroupId if not already set (only from active groups)
            const activeGroupsData = groupsData.filter(g => !g.archived);
            setActiveGroupId(prev => {
                if (prev) return prev;
                return activeGroupsData.length > 0 ? activeGroupsData[0].id : null;
            });
            console.log("Data fetched successfully.");
            
            // Auto-accept invite if there's a pending invite ID from URL
            const inviteIdFromStorage = sessionStorage.getItem('pendingInviteId') || pendingInviteId;
            if (inviteIdFromStorage && invitesData.length > 0) {
                const inviteToAccept = invitesData.find(inv => 
                    inv.id === inviteIdFromStorage && 
                    inv.status === 'pending' &&
                    inv.invitedEmail.toLowerCase() === currentUser.email?.toLowerCase()
                );
                if (inviteToAccept) {
                    console.log('Auto-accepting invite from URL:', inviteIdFromStorage);
                    // Small delay to ensure UI is ready
                    setTimeout(() => {
                        handleAcceptInvite(inviteIdFromStorage, invitesData);
                        sessionStorage.removeItem('pendingInviteId');
                        setPendingInviteId(null);
                    }, 500);
                } else {
                    // Invite not found or already processed, clear storage
                    sessionStorage.removeItem('pendingInviteId');
                    setPendingInviteId(null);
                }
            }
            
            // If there are pending invites (but no URL invite), navigate to Activity screen
            // This helps new users discover their invites
            const pendingInvites = invitesData.filter(inv => 
                inv.status === 'pending' && 
                inv.invitedEmail.toLowerCase() === currentUser.email?.toLowerCase()
            );
            if (pendingInvites.length > 0 && !inviteIdFromStorage) {
                // User with pending invites - show Activity screen after a short delay
                // This applies to both new users and existing users with new invites
                console.log(`User has ${pendingInvites.length} pending invite(s), navigating to Activity screen`);
                setTimeout(() => {
                    // Only navigate if user hasn't manually navigated away
                    // Check if still on dashboard (default screen)
                    setActiveScreen(prev => {
                        // If user is still on dashboard (or hasn't changed screens), go to activity
                        if (prev === 'dashboard' || prev === 'activity') {
                            return 'activity';
                        }
                        return prev; // User has navigated elsewhere, don't force navigation
                    });
                }, 1000);
            }
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
  }, [currentUser, dataRefreshTrigger]);

  // Handle password reset link and invite links from email
  useEffect(() => {
    const handleURLParams = async () => {
      // Check if URL contains password reset code
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const actionCode = urlParams.get('oobCode');
      const inviteId = urlParams.get('invite');
      
      if (mode === 'resetPassword' && actionCode) {
        // Show password reset form
        // We'll handle this in LoginScreen component
        console.log('Password reset link detected');
        // Store the action code in sessionStorage for LoginScreen to use
        sessionStorage.setItem('passwordResetCode', actionCode);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (inviteId) {
        // Store invite ID for processing after signup/login
        console.log('Invite link detected:', inviteId);
        setPendingInviteId(inviteId);
        // Store in sessionStorage as backup
        sessionStorage.setItem('pendingInviteId', inviteId);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    handleURLParams();
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
    // Filter by group and deduplicate by ID to ensure each expense appears only once
    const groupExpenses = expenses.filter(e => e.groupId === activeGroupId);
    const uniqueExpenses = new Map<string, FinalExpense>();
    const seenDescriptions = new Map<string, FinalExpense>(); // Track by description+amount+date for duplicate detection
    
    groupExpenses.forEach(expense => {
      // Primary deduplication by ID
      if (!uniqueExpenses.has(expense.id)) {
        uniqueExpenses.set(expense.id, expense);
        
        // Secondary check: detect potential duplicates by description+amount+date
        const duplicateKey = `${expense.description}|${expense.amount}|${expense.expenseDate}`;
        if (seenDescriptions.has(duplicateKey)) {
          console.warn(`Potential duplicate expense detected: "${expense.description}" (ID: ${expense.id})`);
        } else {
          seenDescriptions.set(duplicateKey, expense);
        }
      } else {
        console.warn(`Duplicate expense ID detected: ${expense.id} - "${expense.description}"`);
      }
    });
    
    // Sort by date (most recent first)
    return Array.from(uniqueExpenses.values()).sort((a, b) => 
      new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
    );
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
      const isPayment = expense.category === 'Payment';
      // Regular expenses need 2+ people in splits. Payment expenses need 1 (payer is paidBy, recipient is in splits)
      if (payerInGroup && expense.splits && (isPayment ? expense.splits.length >= 1 : expense.splits.length >= 2)) {
        if (isPayment) {
          // Backward compatibility: Detect old payment structure (paidBy = recipient, payer in splits)
          // Old structure: expenseDate before 2025-12-21 (when we fixed the semantic inconsistency)
          const expenseDate = new Date(expense.expenseDate);
          const fixDate = new Date('2025-12-21T00:00:00Z');
          const isOldStructure = expenseDate < fixDate;
          
          if (isOldStructure) {
            // Old structure: paidBy = recipient, payer is in splits
            // Recipient (paidBy) balance INCREASES, payer (in splits) balance DECREASES
            const recipientBalance = memberBalances.get(expense.paidBy) || 0;
            memberBalances.set(expense.paidBy, recipientBalance + expense.amount);
            expense.splits.forEach(split => {
              if (memberBalances.has(split.userId)) {
                const payerBalance = memberBalances.get(split.userId) || 0;
                memberBalances.set(split.userId, payerBalance - split.amount);
              }
            });
          } else {
            // New structure: paidBy = payer, recipient is in splits
            // Payer (paidBy) balance DECREASES, recipient (in splits) balance INCREASES
            const payerBalance = memberBalances.get(expense.paidBy) || 0;
            memberBalances.set(expense.paidBy, payerBalance - expense.amount);
            expense.splits.forEach(split => {
              if (memberBalances.has(split.userId)) {
                const recipientBalance = memberBalances.get(split.userId) || 0;
                memberBalances.set(split.userId, recipientBalance + split.amount);
              }
            });
          }
        } else {
          // Regular expense: payer (paidBy) balance INCREASES, split participants balance DECREASES
          const payerBalance = memberBalances.get(expense.paidBy) || 0;
          memberBalances.set(expense.paidBy, payerBalance + expense.amount);
          expense.splits.forEach(split => {
            if (memberBalances.has(split.userId)) {
              const splitteeBalance = memberBalances.get(split.userId) || 0;
              memberBalances.set(split.userId, splitteeBalance - split.amount);
            }
          });
        }
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
                // Update expense and ensure no duplicates (remove any duplicates with same ID first)
                setExpenses(prevExpenses => {
                    // First remove any duplicates with the same ID
                    const withoutDuplicates = prevExpenses.filter(e => e.id !== editingExpense.id);
                    // Then add the updated expense at the beginning (most recent first)
                    return [updatedExpense, ...withoutDuplicates];
                });
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
            // Ensure no duplicates when adding new expense
            setExpenses(prevExpenses => {
                // Check if expense with this ID already exists (shouldn't happen, but safety check)
                const exists = prevExpenses.some(e => e.id === newExpenseWithId.id);
                if (exists) {
                    console.warn('Expense with ID already exists, updating instead of adding:', newExpenseWithId.id);
                    return prevExpenses.map(e => e.id === newExpenseWithId.id ? newExpenseWithId : e);
                }
                return [newExpenseWithId, ...prevExpenses];
            });
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

    // Payment expenses: When User A pays User B $50:
    // - User A's balance should DECREASE (they paid money out)
    // - User B's balance should INCREASE (they received money)
    // paidBy always represents the payer (consistent with regular expenses)
    const paymentExpenseData: Omit<FinalExpense, 'id'> = {
      groupId: activeGroup.id,
      description: `Payment from ${fromUser.name.replace(' (You)', '')} to ${toUser.name.replace(' (You)', '')}`,
      amount: payment.amount,
      currency: activeGroup.currency,
      category: Category.Payment,
      paidBy: payment.from, // Payer (consistent with regular expenses)
      expenseDate: new Date().toISOString(),
      splitMethod: SplitMethod.Unequal,
      splits: [
        { userId: payment.to, amount: payment.amount } // Recipient receives this amount
      ],
    };

    const newNotificationData: Omit<Notification, 'id'> = {
        message: `${fromUser.name.replace(' (You)', '')} paid ${toUser.name.replace(' (You)', '')} ${formatCurrency(payment.amount, activeGroup.currency)}.`,
        type: NotificationType.PaymentRecorded,
        timestamp: new Date().toISOString(),
        read: false,
    };

    try {
        const expenseDocRef = await addDoc(collection(db, 'expenses'), paymentExpenseData);
        const newPaymentExpense = {...paymentExpenseData, id: expenseDocRef.id};
        // Ensure no duplicates when adding payment expense
        setExpenses(prev => {
            const exists = prev.some(e => e.id === newPaymentExpense.id);
            if (exists) {
                return prev.map(e => e.id === newPaymentExpense.id ? newPaymentExpense : e);
            }
            return [newPaymentExpense, ...prev];
        });

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
    
    // Remove any duplicate member IDs (defense in depth)
    const uniqueMembers = Array.from(new Set(updatedGroup.members));
    if (uniqueMembers.length !== updatedGroup.members.length) {
        console.warn('Duplicate members detected in group update, removing duplicates');
        updatedGroup = { ...updatedGroup, members: uniqueMembers };
    }
    
    try {
        const groupDocRef = doc(db, 'groups', updatedGroup.id);
        await updateDoc(groupDocRef, { name: updatedGroup.name, members: updatedGroup.members });
        setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
        setEditingGroupId(null);
        
        // Show success message if members were removed
        const originalGroup = groups.find(g => g.id === updatedGroup.id);
        if (originalGroup && updatedGroup.members.length < originalGroup.members.length) {
          const removedCount = originalGroup.members.length - updatedGroup.members.length;
          alert(`Successfully removed ${removedCount} member(s) from the group.`);
        }
    } catch (error: any) {
        console.error("Error saving group changes: ", error);
        const errorMessage = error?.message || error?.code || 'Unknown error';
        alert(`Failed to save group changes: ${errorMessage}. Please try again.`);
    }
  };

  const handleArchiveGroup = async (groupId: string) => {
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      const groupDocRef = doc(db, 'groups', groupId);
      await updateDoc(groupDocRef, {
        archived: true,
        archivedAt: new Date()
      });

      // Log admin action if admin is archiving someone else's group
      const isAdmin = currentUser?.role === 'admin';
      const isCreator = group.createdBy === currentUser.id;
      if (isAdmin && !isCreator) {
        const creator = users.find(u => u.id === group.createdBy);
        await logAdminAction({
          action: 'archive_group',
          admin: currentUser,
          targetType: 'group',
          targetId: groupId,
          targetName: group.name,
          originalCreator: creator,
          metadata: {
            memberCount: group.members.length,
            currency: group.currency
          }
        });
      }

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

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) {
        alert("Group not found.");
        return;
      }

      // Check if user has any outstanding balances in this group
      const groupExpenses = expenses.filter(e => e.groupId === groupId);
      const userBalance = calculateUserBalance(currentUser.id, groupExpenses, group.members);

      if (Math.abs(userBalance) > 0.01) {
        alert(`You have an outstanding balance of ${formatCurrency(Math.abs(userBalance), group.currency)}. Please settle all debts before leaving the group.`);
        return;
      }

      const confirmMessage = `Are you sure you want to leave "${group.name}"?\n\nYou will no longer have access to this group's expenses and cannot rejoin unless invited again.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      // Remove current user from group members
      const updatedMembers = group.members.filter(id => id !== currentUser.id);

      if (updatedMembers.length === 0) {
        alert("Cannot leave group: You are the last member. Please delete the group instead.");
        return;
      }

      const groupDocRef = doc(db, 'groups', groupId);
      await updateDoc(groupDocRef, {
        members: updatedMembers
      });

      // Remove group from local state
      setGroups(prev => prev.filter(g => g.id !== groupId));

      // If this was the active group, switch to another or null
      if (activeGroupId === groupId) {
        const remainingGroups = groups.filter(g => g.id !== groupId && !g.archived);
        if (remainingGroups.length > 0) {
          setActiveGroupId(remainingGroups[0].id);
        } else {
          setActiveGroupId(null);
        }
      }

      setEditingGroupId(null);
    } catch (error) {
      console.error("Error leaving group: ", error);
      alert("Failed to leave group. Please try again.");
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
        const group = groups.find(g => g.id === groupIdToDelete);
        if (!group) return;

        // Get expense count before deletion
        const groupExpenses = expenses.filter(e => e.groupId === groupIdToDelete);
        const expenseCount = groupExpenses.length;

        // Log admin action if admin is deleting someone else's group
        const isAdmin = currentUser?.role === 'admin';
        const isCreator = group.createdBy === currentUser.id;
        if (isAdmin && !isCreator) {
          const creator = users.find(u => u.id === group.createdBy);
          await logAdminAction({
            action: 'delete_group',
            admin: currentUser,
            targetType: 'group',
            targetId: groupIdToDelete,
            targetName: group.name,
            originalCreator: creator,
            metadata: {
              memberCount: group.members.length,
              expenseCount: expenseCount,
              currency: group.currency,
              wasArchived: group.archived || false
            }
          });
        }

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
             setActiveScreen('dashboard'); // Navigate to dashboard after creation
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

        const trimmedName = name.trim();
        
        // Check if a guest user with the same name already exists (created by current user)
        const existingGuestUser = users.find(
            u => u.name.toLowerCase() === trimmedName.toLowerCase() && 
                 u.authType === 'simulated' && 
                 u.createdBy === currentUser.id
        );
        
        if (existingGuestUser) {
            const confirmMessage = `A guest user named "${trimmedName}" already exists.\n\n` +
                `Would you like to create another guest user with the same name?\n\n` +
                `(You can add the existing "${trimmedName}" to groups via "Add Existing Member")`;
            
            if (!window.confirm(confirmMessage)) {
                return; // User cancelled, don't create duplicate
            }
        }

        const newUserNoId = {
            name: trimmedName,
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

  const handleAcceptInvite = async (inviteId: string, invitesArray?: GroupInvite[]) => {
    const invitesToSearch = invitesArray || groupInvites;
    const invite = invitesToSearch.find(inv => inv.id === inviteId);
    if (!invite) {
      alert('Invite not found');
      return;
    }

    if (invite.invitedEmail.toLowerCase() !== currentUser.email?.toLowerCase()) {
      alert('This invite was not sent to your email address');
      return;
    }

    if (invite.status === 'accepted') {
      alert('This invite has already been accepted');
      return;
    }

    // Ensure user document exists before proceeding
    if (!currentUser.id) {
      alert('User account not properly initialized. Please try logging out and back in.');
      return;
    }

    try {
      const groupRef = doc(db, 'groups', invite.groupId);
      const inviteRef = doc(db, 'groupInvites', inviteId);
      
      // First, try to read the group to check if user is already a member
      // This may fail for new users, which is okay - we'll handle it
      let groupData: Group | null = null;
      let userAlreadyMember = false;
      try {
        const groupDocSnap = await getDoc(groupRef);
        if (groupDocSnap.exists()) {
          groupData = { id: groupDocSnap.id, ...groupDocSnap.data() } as Group;
          userAlreadyMember = groupData.members && groupData.members.includes(currentUser.id);
        } else {
          throw new Error('The group for this invite no longer exists');
        }
      } catch (readError: any) {
        // If we can't read the group (permission denied), that's expected for new users
        // We'll proceed with updating the invite and adding user to group
        // The security rules will allow the update if user is not already a member
        console.log('Could not read group before update (expected for new users):', readError);
        if (readError?.code === 'permission-denied' || readError?.message?.includes('permission')) {
          // This is expected - user is not a member yet, so they can't read the group
          // We'll proceed with the update
        } else {
          // Other error (e.g., group doesn't exist) - rethrow
          throw readError;
        }
      }

      // If user is already a member, just update the invite status
      if (userAlreadyMember && groupData) {
        await updateDoc(inviteRef, {
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
          invitedUserId: currentUser.id,
        });
        
        setGroupInvites(prev => prev.map(inv => 
          inv.id === inviteId ? { ...inv, status: 'accepted' as const, acceptedAt: new Date().toISOString(), invitedUserId: currentUser.id } : inv
        ));
        
        // Ensure group is in local state
        setGroups(prev => {
          const exists = prev.some(g => g.id === invite.groupId);
          if (exists) {
            return prev;
          } else {
            return [...prev, groupData!];
          }
        });
        
        alert(`You're already a member of "${invite.groupName}"!`);

        // Trigger data refetch to ensure latest data is loaded
        setDataRefreshTrigger(prev => prev + 1);

        setActiveGroupId(invite.groupId);
        setActiveScreen('dashboard');
        return;
      }

      // Use transaction to atomically update invite and group
      // This ensures both operations succeed or fail together
      await runTransaction(db, async (transaction) => {
        // Verify invite still exists and is valid
        const inviteDoc = await transaction.get(inviteRef);
        if (!inviteDoc.exists()) {
          throw new Error('Invite no longer exists');
        }
        
        const inviteData = inviteDoc.data();
        if (inviteData.status !== 'pending') {
          throw new Error('Invite has already been processed');
        }
        
        if (inviteData.invitedEmail.toLowerCase() !== currentUser.email?.toLowerCase()) {
          throw new Error('This invite was not sent to your email address');
        }

        // Update invite status
        transaction.update(inviteRef, {
          status: 'accepted',
          acceptedAt: new Date().toISOString(),
          invitedUserId: currentUser.id,
        });

        // Add user to group using arrayUnion
        // This will add the user only if they're not already in the array
        // Security rules allow this update if user is not already a member
        transaction.update(groupRef, {
          members: arrayUnion(currentUser.id)
        });
      });

      // After successful transaction, fetch the group to update local state
      // Now that user is a member, they should be able to read it
      // Reuse groupData variable (may be null if we couldn't read it earlier)
      if (!groupData) {
        try {
          const groupDocSnap = await getDoc(groupRef);
          if (groupDocSnap.exists()) {
            groupData = { id: groupDocSnap.id, ...groupDocSnap.data() } as Group;
          }
        } catch (fetchError) {
          console.warn('Could not fetch group after accepting invite:', fetchError);
          // Use invite data to create a minimal group object for local state
          groupData = {
            id: invite.groupId,
            name: invite.groupName,
            members: [currentUser.id],
            currency: 'USD', // Default, will be updated when group is properly fetched
            createdAt: new Date().toISOString(),
            archived: false
          } as Group;
        }
      }

      // Update local state
      if (groupData) {
        setGroups(prev => {
          const existingGroupIndex = prev.findIndex(g => g.id === invite.groupId);
          if (existingGroupIndex >= 0) {
            return prev.map(g => g.id === invite.groupId ? groupData! : g);
          } else {
            return [...prev, groupData!];
          }
        });
      }
      
      setGroupInvites(prev => prev.map(inv => 
        inv.id === inviteId ? { ...inv, status: 'accepted' as const, acceptedAt: new Date().toISOString(), invitedUserId: currentUser.id } : inv
      ));

      // Mark related notification as read
      const relatedNotification = notifications.find(n => n.inviteId === inviteId);
      if (relatedNotification) {
        try {
          await updateDoc(doc(db, 'notifications', relatedNotification.id), { read: true });
          setNotifications(prev => prev.map(n => n.id === relatedNotification.id ? { ...n, read: true } : n));
        } catch (notifError) {
          console.warn("Failed to mark notification as read:", notifError);
          // Don't fail the whole operation if notification update fails
        }
      }

      alert(`You've joined "${invite.groupName}"!`);

      // Trigger data refetch to ensure all group members and data are loaded
      setDataRefreshTrigger(prev => prev + 1);

      setActiveGroupId(invite.groupId);
      setActiveScreen('dashboard');
    } catch (error: any) {
      console.error("Error accepting invite: ", error);
      const errorMessage = error?.message || error?.code || 'Unknown error';
      
      // Provide more helpful error messages
      if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
        alert(`Failed to accept invite: Permission denied. Please ensure you're logged in with the email address that received the invite (${invite.invitedEmail}).`);
      } else if (errorMessage.includes('no longer exists')) {
        alert(`Failed to accept invite: ${errorMessage}`);
      } else {
        alert(`Failed to accept invite: ${errorMessage}. Please try again.`);
      }
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

  const handleDeleteInvite = async (inviteId: string) => {
    const invite = groupInvites.find(inv => inv.id === inviteId);
    if (!invite) {
      alert('Invite not found');
      return;
    }

    // Confirm deletion with appropriate message based on status
    const isPending = invite.status === 'pending';
    const isExpired = isPending && new Date(invite.expiresAt) < new Date();
    const statusText = isPending 
      ? (isExpired ? 'expired' : 'pending')
      : invite.status;
    
    let confirmMessage: string;
    if (isPending && !isExpired) {
      confirmMessage = `Delete this pending invite to ${invite.invitedEmail}?\n\nThey will no longer be able to accept this invite. You can send a new invite if needed.`;
    } else {
      confirmMessage = `Delete this ${statusText} invite to ${invite.invitedEmail}?\n\nThis will permanently remove it from your invite history.`;
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Delete the invite document
      await deleteDoc(doc(db, 'groupInvites', inviteId));

      // Remove from local state
      setGroupInvites(prev => prev.filter(inv => inv.id !== inviteId));

      // Mark related notification as read (if exists)
      const relatedNotification = notifications.find(n => n.inviteId === inviteId);
      if (relatedNotification) {
        await updateDoc(doc(db, 'notifications', relatedNotification.id), { read: true });
        setNotifications(prev => prev.map(n => n.id === relatedNotification.id ? { ...n, read: true } : n));
      }

      if (isPending && !isExpired) {
        alert(`Invite to ${invite.invitedEmail} has been deleted. You can now send a new invite if needed.`);
      } else {
        alert(`Invite to ${invite.invitedEmail} has been deleted.`);
      }
    } catch (error: any) {
      console.error("Error deleting invite: ", error);
      const errorMessage = error?.message || error?.code || 'Unknown error';
      alert(`Failed to delete invite: ${errorMessage}. Please try again.`);
    }
  };

  const handleClearCompletedInvites = async () => {
    const completedInvites = groupInvites.filter(inv => {
      if (inv.status === 'pending') {
        return new Date(inv.expiresAt) < new Date(); // Expired
      }
      return inv.status === 'accepted' || inv.status === 'declined';
    });

    if (completedInvites.length === 0) {
      alert('No completed invites to clear.');
      return;
    }

    if (!window.confirm(`Clear all ${completedInvites.length} completed invite(s) (accepted, declined, expired)?\n\nThis will permanently remove them from your invite history.`)) {
      return;
    }

    try {
      const batch = writeBatch(db);
      const inviteIdsToDelete: string[] = [];

      // Delete all completed invites in a batch
      completedInvites.forEach(invite => {
        batch.delete(doc(db, 'groupInvites', invite.id));
        inviteIdsToDelete.push(invite.id);
      });

      await batch.commit();

      // Remove from local state
      setGroupInvites(prev => prev.filter(inv => !inviteIdsToDelete.includes(inv.id)));

      // Mark related notifications as read
      const relatedNotifications = notifications.filter(n => n.inviteId && inviteIdsToDelete.includes(n.inviteId));
      if (relatedNotifications.length > 0) {
        const notificationBatch = writeBatch(db);
        relatedNotifications.forEach(notif => {
          notificationBatch.update(doc(db, 'notifications', notif.id), { read: true });
        });
        await notificationBatch.commit();
        setNotifications(prev => prev.map(n => 
          inviteIdsToDelete.includes(n.inviteId || '') ? { ...n, read: true } : n
        ));
      }

      alert(`Successfully cleared ${completedInvites.length} completed invite(s).`);
    } catch (error: any) {
      console.error("Error clearing completed invites: ", error);
      const errorMessage = error?.message || error?.code || 'Unknown error';
      alert(`Failed to clear completed invites: ${errorMessage}. Please try again.`);
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
    setActiveScreen('dashboard'); // Navigate to dashboard to view group expenses
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

    // Deduplicate expenses by ID first
    const uniqueExpenses = new Map<string, FinalExpense>();
    groupExpenses.forEach(expense => {
      if (!uniqueExpenses.has(expense.id)) {
        uniqueExpenses.set(expense.id, expense);
      }
    });
    const deduplicatedExpenses = Array.from(uniqueExpenses.values());

    deduplicatedExpenses.forEach(expense => {
        // Regular expenses need 2+ people in splits. Payment expenses need 1 (payer is paidBy, recipient is in splits)
        const isPayment = expense.category === 'Payment';
        if (memberBalances.has(expense.paidBy) && expense.splits && (isPayment ? expense.splits.length >= 1 : expense.splits.length >= 2)) {
            if (isPayment) {
                // Backward compatibility: Detect old payment structure (paidBy = recipient, payer in splits)
                // Old structure: expenseDate before 2025-12-21 (when we fixed the semantic inconsistency)
                const expenseDate = new Date(expense.expenseDate);
                const fixDate = new Date('2025-12-21T00:00:00Z');
                const isOldStructure = expenseDate < fixDate;
                
                if (isOldStructure) {
                    // Old structure: paidBy = recipient, payer is in splits
                    // Recipient (paidBy) balance INCREASES, payer (in splits) balance DECREASES
                    const recipientBalance = memberBalances.get(expense.paidBy) || 0;
                    memberBalances.set(expense.paidBy, recipientBalance + expense.amount);
                    expense.splits.forEach(split => {
                        if (memberBalances.has(split.userId)) {
                            const payerBalance = memberBalances.get(split.userId) || 0;
                            memberBalances.set(split.userId, payerBalance - split.amount);
                        }
                    });
                } else {
                    // New structure: paidBy = payer, recipient is in splits
                    // Payer (paidBy) balance DECREASES, recipient (in splits) balance INCREASES
                    const payerBalance = memberBalances.get(expense.paidBy) || 0;
                    memberBalances.set(expense.paidBy, payerBalance - expense.amount);
                    expense.splits.forEach(split => {
                        if (memberBalances.has(split.userId)) {
                            const recipientBalance = memberBalances.get(split.userId) || 0;
                            memberBalances.set(split.userId, recipientBalance + split.amount);
                        }
                    });
                }
            } else {
                // Regular expense: payer (paidBy) balance INCREASES, split participants balance DECREASES
                const payerBalance = memberBalances.get(expense.paidBy) || 0;
                memberBalances.set(expense.paidBy, payerBalance + expense.amount);
                expense.splits.forEach(split => {
                    if (memberBalances.has(split.userId)) {
                        const splitteeBalance = memberBalances.get(split.userId) || 0;
                        memberBalances.set(split.userId, splitteeBalance - split.amount);
                    }
                });
            }
        }
    });
    
    return Array.from(memberBalances.values()).reduce((sum, balance) => {
        return sum + (balance < 0 ? Math.abs(balance) : 0);
    }, 0);
  }, [expenses, groups]);

  const handleOpenGroupManagement = () => {
    if (activeGroupId) {
      setEditingGroupDebt(calculateGroupDebt(activeGroupId));
      setEditingGroupId(activeGroupId);
      setIsGroupManagementModalOpen(true);
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
        // Regular expenses need 2+ people in splits. Payment expenses need 1 (payer is paidBy, recipient is in splits)
        const isPayment = expense.category === 'Payment';
        if (payerInGroup && expense.splits && (isPayment ? expense.splits.length >= 1 : expense.splits.length >= 2)) {
            if (isPayment) {
                // Backward compatibility: Detect old payment structure (paidBy = recipient, payer in splits)
                // Old structure: expenseDate before 2025-12-21 (when we fixed the semantic inconsistency)
                const expenseDate = new Date(expense.expenseDate);
                const fixDate = new Date('2025-12-21T00:00:00Z');
                const isOldStructure = expenseDate < fixDate;
                
                if (isOldStructure) {
                    // Old structure: paidBy = recipient, payer is in splits
                    // Recipient (paidBy) balance INCREASES, payer (in splits) balance DECREASES
                    const recipientBalance = balances.get(expense.paidBy) || 0;
                    balances.set(expense.paidBy, recipientBalance + expense.amount);
                    expense.splits.forEach(split => {
                        if (balances.has(split.userId)) {
                            const payerBalance = balances.get(split.userId) || 0;
                            balances.set(split.userId, payerBalance - split.amount);
                        }
                    });
                } else {
                    // New structure: paidBy = payer, recipient is in splits
                    // Payer (paidBy) balance DECREASES, recipient (in splits) balance INCREASES
                    const payerBalance = balances.get(expense.paidBy) || 0;
                    balances.set(expense.paidBy, payerBalance - expense.amount);
                    expense.splits.forEach(split => {
                        if (balances.has(split.userId)) {
                            const recipientBalance = balances.get(split.userId) || 0;
                            balances.set(split.userId, recipientBalance + split.amount);
                        }
                    });
                }
            } else {
                // Regular expense: payer (paidBy) balance INCREASES, split participants balance DECREASES
                const payerBalance = balances.get(expense.paidBy) || 0;
                balances.set(expense.paidBy, payerBalance + expense.amount);
                expense.splits.forEach(split => {
                    if (balances.has(split.userId)) {
                        const splitteeBalance = balances.get(split.userId) || 0;
                        balances.set(split.userId, splitteeBalance - split.amount);
                    }
                });
            }
        }
    });
    
    return simplifyDebts(balances);
  }, [activeGroupExpenses, activeGroupMembers]);

  // Calculate total debt for archive eligibility
  const totalDebt = useMemo(() => {
    return simplifiedDebts.reduce((sum, debt) => sum + Math.abs(debt.amount), 0);
  }, [simplifiedDebts]);

  const hasActiveFilters = searchTerm !== '' || filterCategory !== 'all' || filterUser !== 'all';

  // Calculate unread notifications + pending invites for Activity badge
  const unreadNotificationCount = useMemo(() => {
    const unreadNotifications = notifications.filter(n => !n.read).length;
    const pendingInvitesCount = groupInvites.filter(inv => 
      inv.status === 'pending' && 
      inv.invitedEmail.toLowerCase() === currentUser?.email?.toLowerCase()
    ).length;
    return unreadNotifications + pendingInvitesCount;
  }, [notifications, groupInvites, currentUser]);
  
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
                        setActiveScreen('dashboard');
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
                          onClick={() => setActiveScreen('dashboard')}
                          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-700 text-white rounded-full font-bold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg"
                        >
                          Go to Dashboard
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
                  onAddMemberClick={handleOpenGroupManagement}
                  onSettleClick={handleOpenSettleUp}
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
                    onAddMemberClick={handleOpenGroupManagement}
                    onSettleClick={handleOpenSettleUp}
                  />
                ) : undefined}
              />
          );
      case 'profile':
        return (
              <ProfileScreen
                users={users}
                groups={groups}
                currentUserId={currentUser.id}
                onCreateUser={handleCreateUser}
                onDeleteGuestUser={handleDeleteGuestUser}
                onUpdatePaymentInfo={handleUpdatePaymentInfo}
                onOpenInviteModal={() => {
                  if (activeGroups.length === 0) {
                    alert('Please create a group first before sending invites.');
                    setActiveScreen('dashboard');
                  } else if (activeGroups.length === 1) {
                    // If only one active group, use it directly
                    setInviteGroupId(activeGroups[0].id);
                    setIsInviteModalOpen(true);
                  } else {
                    // Multiple groups - show group selector
                    alert('Please select a group first. Go to Dashboard to select the group you want to invite someone to.');
                    setActiveScreen('dashboard');
                  }
                }}
                onOpenGroupManagement={() => {
                  if (activeGroupId) {
                    setEditingGroupId(activeGroupId);
                    setIsGroupManagementModalOpen(true);
                  }
                }}
                onOpenGroupSelector={() => setActiveScreen('dashboard')}
                groupInvites={groupInvites.filter(invite => invite.invitedBy === currentUser.id)}
                onDeleteInvite={handleDeleteInvite}
                onClearCompletedInvites={handleClearCompletedInvites}
                onUnarchiveGroup={handleUnarchiveGroup}
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
          {/* Integrated Header - Clean Two-Row Layout */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-primary/15 via-primary/8 to-white dark:from-primary/20 dark:via-primary/12 dark:to-gray-800 px-4 pt-4 pb-3 border-b-2 border-primary/20 dark:border-primary/30"
          >
              {/* Row 1: Branding & Controls */}
              <div className="flex items-center justify-between mb-3">
                {/* Logo & App Name */}
                <div className="flex items-center gap-2.5">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-gradient-to-br from-white to-primary/5 dark:from-gray-900 dark:to-primary/10 rounded-xl p-2 shadow-md ring-1 ring-primary/20 dark:ring-primary/30"
                  >
                    <img
                      src="/splitBi-logo-notext-svg.svg"
                      alt="SplitBi"
                      className="h-10 w-10"
                    />
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-extrabold text-charcoal dark:text-gray-100 tracking-tight leading-none">
                      Split<span className="text-primary">Bi</span>
                    </h1>
                    <p className="text-[10px] text-sage dark:text-gray-400 font-medium tracking-wide">Split expenses smartly</p>
                  </div>
                </div>

                {/* Controls: User Menu + Theme Toggle */}
                <div className="flex items-center gap-3">
                  <motion.button
                    ref={userMenuButtonRef}
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="relative flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl bg-white dark:bg-gray-700 hover:bg-gradient-to-br hover:from-white hover:to-stone-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200 border border-stone-200 dark:border-gray-600 shadow-md hover:shadow-lg group"
                  >
                    {/* Avatar with status indicator */}
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-primary-600 to-primary-700 flex items-center justify-center text-white text-sm font-bold shadow-inner ring-2 ring-white dark:ring-gray-700">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Online status indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-700 shadow-sm" />
                    </div>

                    {/* Name and chevron */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-charcoal dark:text-gray-100 hidden sm:inline max-w-[100px] truncate">
                        {currentUser.name.split(' ')[0]}
                      </span>
                      <motion.svg
                        className="w-3.5 h-3.5 text-sage dark:text-gray-400 group-hover:text-charcoal dark:group-hover:text-gray-200 transition-colors"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        animate={{ rotate: showUserMenu ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </motion.svg>
                    </div>

                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </motion.button>

                  <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                </div>
              </div>

              {/* Row 2: Group Selector (if groups exist) */}
              {activeGroups.length > 0 && (
                <div className="relative">
                  <label className="block text-[10px] font-semibold text-primary dark:text-primary-300 uppercase tracking-wider mb-1.5">
                    Active Group
                  </label>
                  <select
                    value={activeGroupId || ''}
                    onChange={(e) => setActiveGroupId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-bold bg-white dark:bg-gray-700 border-2 border-primary/30 dark:border-primary/40 rounded-lg text-charcoal dark:text-gray-100 shadow-sm hover:border-primary/50 dark:hover:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                  >
                    {activeGroups.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* User Menu Dropdown */}
              {showUserMenu && userMenuButtonRef.current && (
                <>
                  {/* Backdrop with blur */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 backdrop-blur-[2px]"
                    onClick={() => setShowUserMenu(false)}
                  />

                  {/* Dropdown Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="fixed z-[60] w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-stone-200/50 dark:border-gray-700/50 overflow-hidden ring-1 ring-black/5 dark:ring-white/5"
                    style={{
                      top: `${userMenuButtonRef.current.getBoundingClientRect().bottom + 12}px`,
                      right: `${window.innerWidth - userMenuButtonRef.current.getBoundingClientRect().right}px`
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* User Info Header */}
                    <div className="p-4 border-b border-stone-200/70 dark:border-gray-700/70 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary-600 to-primary-700 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white/50 dark:ring-gray-700/50">
                            {currentUser.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-charcoal dark:text-gray-100 truncate">{currentUser.name}</p>
                          <p className="text-xs text-sage dark:text-gray-400 truncate">{currentUser.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          setShowUserMenu(false);
                          setIsHelpModalOpen(true);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-charcoal dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent dark:hover:from-primary/10 transition-all flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span>Help & Guide</span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          setShowUserMenu(false);
                          setIsFeedbackModalOpen(true);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-charcoal dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent dark:hover:from-primary/10 transition-all flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                        <span>Send Feedback</span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          setShowUserMenu(false);
                          setIsCurrencyConverterOpen(true);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-charcoal dark:text-gray-200 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent dark:hover:from-primary/10 transition-all flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span>Currency Converter</span>
                      </motion.button>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-stone-200/70 dark:border-gray-700/70 pt-1 pb-2">
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ x: 4 }}
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent dark:hover:from-red-900/20 transition-all flex items-center gap-3 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 flex items-center justify-center group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-colors">
                          <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span>Logout</span>
                      </motion.button>
                    </div>
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

            {/* Dashboard Content - Part of Same Container */}
            {activeScreen === 'dashboard' && activeGroup && (
              <>
                {/* Balance & Quick Actions Section */}
                <BalanceHeader
                  balance={currentUserBalance}
                  currency={activeGroup?.currency || 'USD'}
                  balanceColor={balanceColor}
                  balanceDescription={balanceDescription}
                  onAddMemberClick={handleOpenGroupManagement}
                  onSettleClick={handleOpenSettleUp}
                />

                {/* Group Financial Summary Section */}
                <GroupFinancialSummary
                  expenses={expenses}
                  group={activeGroup}
                  balances={balances}
                />

                {/* Contextual Suggestions */}
                {activeGroup && activeGroupMembers.length === 1 && activeGroupExpenses.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mx-4 sm:mx-6 my-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-charcoal dark:text-gray-100 mb-1">Invite members to start splitting expenses</h4>
                        <p className="text-xs text-sage dark:text-gray-400 mb-2">Add roommates, friends, or travel buddies to track shared costs together</p>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={handleOpenGroupManagement}
                          className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                        >
                          Invite Members →
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
                {activeGroup && currentUserBalance > 0.01 && activeGroupExpenses.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mx-4 sm:mx-6 my-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-charcoal dark:text-gray-100 mb-1">You're owed {formatCurrency(currentUserBalance, activeGroup?.currency || 'USD')}</h4>
                        <p className="text-xs text-sage dark:text-gray-400 mb-2">Settle up to see who owes what and simplify your balances</p>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={handleOpenSettleUp}
                          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                        >
                          View Balances →
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

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
                      const handleActionClick = (e: React.MouseEvent, action: () => void) => {
                        e.stopPropagation();
                        action();
                      };
                      return (
                        <motion.div 
                          key={expense.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          onClick={() => handleViewExpense(expense)}
                          className="flex items-center gap-3 py-2.5 hover:bg-primary/10 dark:hover:bg-primary/30 rounded-xl transition-all -mx-2 px-3 border border-transparent hover:border-primary/20 dark:hover:border-primary/30 cursor-pointer group"
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
                          <div className="flex-shrink-0 flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-lg font-sans font-extrabold text-charcoal dark:text-gray-100">
                                {formatCurrency(expense.amount, activeGroup?.currency || 'USD')}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button 
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.1 }}
                                onClick={(e) => handleActionClick(e, () => handleStartEdit(expense))} 
                                className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-gray-600 text-sage hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                title="Edit expense"
                              >
                                <EditIcon className="w-5 h-5"/>
                              </motion.button>
                              <motion.button 
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.1 }}
                                onClick={(e) => handleActionClick(e, () => handleDeleteExpense(expense.id))} 
                                className="p-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 text-sage hover:text-red-500 transition-colors"
                                title="Delete expense"
                              >
                                <DeleteIcon className="w-5 h-5"/>
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    </div>
                    {activeGroupExpenses.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center py-8"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 flex items-center justify-center border-2 border-primary/20 dark:border-primary/30 shadow-sm">
                          <svg className="w-8 h-8 text-primary dark:text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="text-base font-bold text-charcoal dark:text-gray-100 mb-2">No expenses yet</h4>
                        <p className="text-sm text-sage dark:text-gray-400 mb-4 max-w-xs mx-auto">Track your first shared expense by tapping the green <span className="font-semibold text-primary">+</span> button below</p>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setActiveScreen('add')}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                          Add Your First Expense
                        </motion.button>
                      </motion.div>
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
        isAdmin={currentUser?.role === 'admin'}
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

      {isSettleUpModalOpen && activeGroup && currentUser && (
        <SettleUpModal
          isOpen={isSettleUpModalOpen}
          onClose={() => setIsSettleUpModalOpen(false)}
          expenses={activeGroupExpenses}
          members={activeGroupMembers}
          currency={activeGroup.currency}
          currentUserId={currentUser.id}
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
              currentUser={currentUser}
              onSave={handleSaveGroupChanges}
              onDelete={handleDeleteGroup}
              onArchive={handleArchiveGroup}
              onUnarchive={handleUnarchiveGroup}
              onLeaveGroup={handleLeaveGroup}
              totalDebt={editingGroupDebt}
              onCreateUser={handleCreateUser}
              groupInvites={groupInvites}
              onInviteMember={() => {
                setInviteGroupId(groupForEditing.id);
                setIsInviteModalOpen(true);
              }}
              onDeleteInvite={handleDeleteInvite}
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