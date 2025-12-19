
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import AddExpenseForm from './components/AddExpenseForm';
import ExpenseList from './components/ExpenseList';
import BalanceSummary from './components/BalanceSummary';
import SettleUpModal from './components/SettleUpModal';
import ExpenseDetailModal from './components/ExpenseDetailModal';
import ExpenseFilter from './components/ExpenseFilter';
import BalanceDetailModal from './components/BalanceDetailModal';
import BottomNav from './components/BottomNav';
import GroupManagementModal from './components/GroupManagementModal';
import GroupsScreen from './components/GroupsScreen';
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
import { collection, getDocs, doc, writeBatch, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import FeedbackButton from './components/FeedbackButton';
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
  const [isGroupManagementModalOpen, setIsGroupManagementModalOpen] = useState(false);
  const [inviteGroupId, setInviteGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupDebt, setEditingGroupDebt] = useState(0);

  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddHint, setShowAddHint] = useState(() => !localStorage.getItem('add-hint-dismissed'));
  
  const [editingExpense, setEditingExpense] = useState<FinalExpense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<FinalExpense | null>(null);
  const [viewingBalanceForUser, setViewingBalanceForUser] = useState<User | null>(null);

  // Fetch initial data from Firestore
  useEffect(() => {
    const fetchData = async () => {
        if (!currentUser) {
          setLoading(false);
          return;
        }
        try {
            console.log("Fetching data from Firestore...");
            
            // PRIVACY & SECURITY: Only fetch users relevant to current user
            // Previously fetched ALL users (privacy issue at scale)
            // Now only fetch:
            // 1. Current user themselves (for profile display)
            // 2. Simulated/guest users created by current user (for group management)
            // This ensures users can't see or add other real users without permission
            const usersQuery = query(
                collection(db, 'users'),
                where('createdBy', '==', currentUser.id)
            );
            const simulatedUsersSnapshot = await getDocs(usersQuery);
            
            // Get current user's document
            const currentUserDoc = await getDocs(
                query(collection(db, 'users'), where('__name__', '==', currentUser.id))
            );
            
            // Combine current user + their simulated users
            const allUserDocs = [...currentUserDoc.docs, ...simulatedUsersSnapshot.docs];
            const usersSnapshot = { docs: allUserDocs };
            
            console.log(`Loaded ${allUserDocs.length} users (1 real + ${simulatedUsersSnapshot.docs.length} guest)`);
            
            // Fetch only groups where current user is a member
            const groupsQuery = query(
                collection(db, 'groups'), 
                where('members', 'array-contains', currentUser.id)
            );
            const groupsSnapshot = await getDocs(groupsQuery);
            
            // Get group IDs for fetching expenses
            const groupIds = groupsSnapshot.docs.map(doc => doc.id);
            
            // Fetch expenses only for user's groups
            let expensesData: FinalExpense[] = [];
            if (groupIds.length > 0) {
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
            }
            
            // Fetch notifications
            const notificationsSnapshot = await getDocs(collection(db, 'notifications'));

            // Fetch group invites (sent by or to current user)
            const sentInvitesQuery = query(
                collection(db, 'groupInvites'),
                where('invitedBy', '==', currentUser.id)
            );
            const receivedInvitesQuery = query(
                collection(db, 'groupInvites'),
                where('invitedEmail', '==', currentUser.email?.toLowerCase())
            );
            
            const [sentInvitesSnapshot, receivedInvitesSnapshot] = await Promise.all([
                getDocs(sentInvitesQuery),
                getDocs(receivedInvitesQuery)
            ]);

            // Process all the data
            const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            const groupsData = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
            const notificationsData = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
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

            // Sort expenses by date
            expensesData.sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

            setUsers(usersData);
            setGroups(groupsData);
            setExpenses(expensesData);
            setNotifications(notificationsData);
            setGroupInvites(invitesData);

            // Only set activeGroupId if not already set
            setActiveGroupId(prev => {
                if (prev) return prev;
                return groupsData.length > 0 ? groupsData[0].id : null;
            });
            console.log("Data fetched successfully.");
        } catch (error) {
            console.error("Error fetching data from Firestore:", error);
            alert("Could not fetch data from the database. Please check your Firebase connection and configuration.");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [currentUser]);

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

  const handleFinishOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboarding-completed', 'true');
  };

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

  const activeGroup = useMemo(() => groups.find(g => g.id === activeGroupId), [groups, activeGroupId]);
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
  
  // This effect ensures the active group ID is always valid.
  useEffect(() => {
    if (activeGroupId) {
      const activeGroupExists = groups.some(g => g.id === activeGroupId);
      if (!activeGroupExists) {
        setActiveGroupId(groups[0]?.id || null);
      }
    } else if (groups.length > 0) {
      setActiveGroupId(groups[0].id);
    }
  }, [groups, activeGroupId]);


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
    if (!currentUserData || !activeGroupId) return;

    let message = '';
    let type: NotificationType;
    const expenseWithGroupId = { ...expense, groupId: activeGroupId };

    try {
        if (editingExpense) {
            const expenseDocRef = doc(db, 'expenses', editingExpense.id);
            await updateDoc(expenseDocRef, expenseWithGroupId);
            setExpenses(prevExpenses => prevExpenses.map(e => e.id === editingExpense.id ? expenseWithGroupId : e));
            setEditingExpense(null);
            message = `${currentUserData.name.replace(' (You)', '')} edited the expense "${expense.description}".`;
            type = NotificationType.ExpenseEdited;
        } else {
            const docRef = await addDoc(collection(db, 'expenses'), expenseWithGroupId);
            const newExpenseWithId = { ...expenseWithGroupId, id: docRef.id };
            setExpenses(prevExpenses => [newExpenseWithId, ...prevExpenses]);
            message = `${currentUserData.name.replace(' (You)', '')} added a new expense: "${expense.description}" for $${expense.amount.toFixed(2)}.`;
            type = NotificationType.ExpenseAdded;
        }

        const newNotification: Omit<Notification, 'id'> = {
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false,
        };
        const notificationDocRef = await addDoc(collection(db, 'notifications'), newNotification);
        setNotifications(prev => [{ id: notificationDocRef.id, ...newNotification }, ...prev]);
    } catch (error) {
        console.error("Error saving expense: ", error);
        alert("Failed to save expense. Please try again.");
    }
    setActiveScreen('dashboard');
  }, [editingExpense, users, activeGroupId]);

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
        const groupDataWithCreator = {
            ...newGroupData,
            createdBy: currentUser.id,
        };
        const docRef = await addDoc(collection(db, 'groups'), groupDataWithCreator);
        const newGroup = { ...groupDataWithCreator, id: docRef.id };
        setGroups(prev => [...prev, newGroup]);
        setActiveGroupId(newGroup.id);
        setActiveScreen('dashboard');
    } catch (error) {
        console.error("Error creating group: ", error);
        alert("Failed to create group. Please try again.");
    }
  }

  const handleCreateUser = async (name: string) => {
    const newUserNoId = {
        name: name,
        avatarUrl: `https://i.pravatar.cc/150?u=${crypto.randomUUID()}`,
        authType: 'simulated' as const,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString()
    };
    try {
        const docRef = await addDoc(collection(db, 'users'), newUserNoId);
        setUsers(prev => [...prev, { id: docRef.id, ...newUserNoId }]);
    } catch (error) {
        logError('Create User', error, { userName: name, currentUserId: currentUser.id });
        console.error("Error creating user: ", error);
        alert("Failed to create user. Please try again.");
    }
  };

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
      const groupDoc = await getDocs(query(collection(db, 'groups'), where('__name__', '==', invite.groupId)));
      if (!groupDoc.empty) {
        const groupData = groupDoc.docs[0].data() as Group;
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
    setActiveGroupId(groupId);
    setActiveScreen('dashboard');
  }

  const handleSelectGroupFromGroupsScreen = (groupId: string) => {
    setActiveGroupId(groupId);
    setEditingGroupId(groupId);
    setIsGroupManagementModalOpen(true);
    // Go to group management - this is what user actually wants
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
                <div className="p-6 text-center max-w-sm mx-auto">
                    {/* Compact Welcome Header */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-surface dark:bg-gray-800 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 mb-6"
                    >
                      <div className="p-6 text-center">
                        <div className="flex justify-center mb-2">
                          <div className="bg-white dark:bg-gray-900 rounded-2xl p-3 shadow-sm">
                            <img 
                              src="/splitBi-logo-main-svg.svg" 
                              alt="SplitBi Logo" 
                              className="h-24 sm:h-28 w-auto"
                            />
                          </div>
                        </div>
                        <h2 className="text-base font-sans font-bold text-charcoal dark:text-gray-300">
                          Welcome to Split<span className="text-primary">Bi</span>!
                        </h2>
                      </div>
                    </motion.div>
                    
                    <p className="text-sm text-sage dark:text-text-secondary-dark mb-4">
                        Let's create your first group to start tracking shared expenses.
                    </p>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-primary/10 dark:bg-primary/10 rounded-2xl p-6 mb-6 text-left"
                    >
                        <p className="font-sans font-bold text-charcoal dark:text-text-primary-dark mb-3">
                            💡 What are groups?
                        </p>
                        <p className="text-sm text-sage dark:text-text-secondary-dark mb-4">
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

                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveScreen('groups')}
                      className="w-full px-6 py-3 bg-primary text-white font-medium rounded-full shadow-sm hover:bg-primary-700 transition-colors"
                    >
                        + Create Your First Group
                    </motion.button>
                    
                    <p className="mt-4 text-xs text-sage dark:text-text-secondary-dark">
                        Click the <strong>Groups</strong> tab at the bottom to get started
                    </p>
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
              activeGroupId={activeGroupId}
              currentUserId={currentUser.id}
              onSelectGroup={handleSelectGroupFromGroupsScreen}
              onCreateGroup={handleCreateGroup}
              onManageGroupMembers={(groupId) => {
                setEditingGroupId(groupId);
                setIsGroupManagementModalOpen(true);
              }}
            />
        );
      case 'activity':
          return (
              <ActivityScreen 
                notifications={notifications} 
                groupInvites={groupInvites.filter(invite => invite.invitedEmail === currentUser.email?.toLowerCase())}
                onAcceptInvite={handleAcceptInvite}
                onDeclineInvite={handleDeclineInvite}
              />
          );
      case 'profile':
        return (
              <ProfileScreen
                users={users}
                onCreateUser={handleCreateUser}
                onDeleteGuestUser={handleDeleteGuestUser}
                onOpenInviteModal={() => {
                  if (groups.length === 0) {
                    alert('Please create a group first before sending invites.');
                    setActiveScreen('groups');
                  } else if (groups.length === 1) {
                    // If only one group, use it directly
                    setInviteGroupId(groups[0].id);
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
        {/* Unified Container - Everything as One */}
        <div className="bg-gradient-to-b from-white via-stone-50/30 to-stone-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-t-3xl overflow-hidden shadow-lg border-x border-t border-stone-200 dark:border-gray-700 flex flex-col flex-grow mb-28">
          {/* Integrated Header - Compact & Modern */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/15 via-primary/8 to-white dark:from-primary/20 dark:via-primary/12 dark:to-gray-800 px-4 pt-3 pb-3 border-b-2 border-primary/20 dark:border-primary/30"
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
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowUserMenu(!showUserMenu)}
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
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-stone-200 dark:border-gray-700 overflow-hidden"
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
            
            {/* Dashboard Content - Part of Same Container */}
            {activeScreen === 'dashboard' && activeGroup && (
              <>
                {/* Balance Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-primary/8 via-white to-primary/5 dark:from-primary/15 dark:via-gray-700 dark:to-primary/10 px-4 py-4 sm:px-6 sm:py-5 rounded-t-2xl border-b-2 border-primary/20 dark:border-primary/30"
                >
                  <div className="text-center">
                    <p className="text-xs font-bold text-primary dark:text-primary-300 uppercase tracking-widest mb-3">
                      Your Balance
                    </p>
                    <div className="relative inline-block">
                      <p className={`text-5xl sm:text-6xl font-sans font-extrabold mb-2 tracking-tight ${balanceColor}`}>
                        {formatCurrency(Math.abs(currentUserBalance), activeGroup?.currency || 'USD')}
                      </p>
                      {currentUserBalance > 0.01 && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></div>
                      )}
                    </div>
                    <p className="text-base font-semibold text-charcoal dark:text-gray-200 mt-2">
                      {balanceDescription}
                    </p>
                  </div>
                </motion.div>

                {/* Groups Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
              className="px-4 py-3 sm:px-6 sm:py-4 bg-white dark:bg-gray-700 border-t-2 border-stone-200 dark:border-gray-600"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg sm:text-xl font-sans font-extrabold text-charcoal dark:text-gray-100 tracking-tight">Groups</h3>
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (activeGroupId) {
                          setEditingGroupDebt(calculateGroupDebt(activeGroupId));
                          setEditingGroupId(activeGroupId);
                          setIsGroupManagementModalOpen(true);
                        }
                      }}
                      className="text-sm text-primary dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-400 transition-colors font-bold"
                    >
                      Manage →
                    </motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {groups.map((group, index) => (
                      <motion.button
                        key={group.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSetActiveGroup(group.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl transition-all text-left border-2 ${
                          activeGroupId === group.id 
                            ? 'bg-gradient-to-br from-primary-100 via-primary-50 to-white dark:from-primary/40 dark:via-primary/30 dark:to-gray-700 border-primary dark:border-primary-400 text-primary dark:text-primary-200 shadow-xl ring-2 ring-primary/30 dark:ring-primary/40' 
                            : 'bg-white dark:bg-gray-700 hover:bg-primary/5 dark:hover:bg-gray-600 border-stone-300 dark:border-gray-600 hover:border-primary/60 dark:hover:border-primary/50 shadow-lg hover:shadow-xl'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                          activeGroupId === group.id 
                            ? 'bg-white dark:bg-primary/20 border-primary dark:border-primary-400' 
                            : 'bg-white dark:bg-gray-600 border-stone-200 dark:border-gray-500'
                        }`}>
                          <GroupIcon 
                            groupName={group.name} 
                            className={`w-5 h-5 ${
                              activeGroupId === group.id 
                                ? 'text-primary dark:text-primary-300' 
                                : 'text-charcoal dark:text-gray-300'
                            }`}
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className={`text-base font-sans font-extrabold truncate ${
                            activeGroupId === group.id 
                              ? 'text-primary dark:text-primary-200' 
                              : 'text-charcoal dark:text-gray-100'
                          }`}>{group.name}</p>
                          <p className={`text-sm font-medium mt-0.5 ${
                            activeGroupId === group.id 
                              ? 'text-primary/70 dark:text-primary-300' 
                              : 'text-sage dark:text-gray-400'
                          }`}>
                            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {activeGroupId === group.id && (
                          <div className="flex-shrink-0 w-2 h-2 bg-primary dark:bg-primary-300 rounded-full animate-pulse shadow-lg"></div>
                        )}
                      </motion.button>
                    ))}
                    
                    {/* Create New Group - Full Width */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + groups.length * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveScreen('groups')}
                      className="col-span-2 flex items-center justify-center gap-2.5 p-3.5 rounded-xl bg-gradient-to-r from-stone-50 to-white dark:from-gray-700 dark:to-gray-700 hover:from-primary/10 hover:to-primary/5 dark:hover:from-primary/20 dark:hover:to-primary/10 transition-all border-2 border-dashed border-stone-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 shadow-sm hover:shadow-md"
                    >
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center">
                        <span className="text-sage text-xs">+</span>
                      </div>
                      <span className="text-sm font-medium text-sage dark:text-slate-400">Create New Group</span>
                    </motion.button>
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
                  <h3 className="text-lg sm:text-xl font-sans font-extrabold text-charcoal dark:text-gray-100 tracking-tight">
                    Recent Expenses
                  </h3>
                    <span className="text-xs font-bold text-primary dark:text-primary-300 bg-primary/10 dark:bg-primary/20 px-3 py-1.5 rounded-full border-2 border-primary/30 dark:border-primary/40">
                      {activeGroupExpenses.length} total
                    </span>
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
                          className="flex items-center gap-3 py-2.5 hover:bg-primary/10 dark:hover:bg-primary/30 rounded-xl transition-all -mx-2 px-3 border border-transparent hover:border-primary/20 dark:hover:border-primary/30"
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
                          onClick={() => {/* TODO: Implement view all */}}
                          className="w-full text-sm text-primary hover:text-primary-700 transition-colors font-medium py-2"
                        >
                          View All Expenses →
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Quick Actions Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-br from-white via-primary/5 to-white dark:from-gray-700 dark:via-primary/10 dark:to-gray-700 border-t-2 border-stone-200 dark:border-gray-600"
              >
                  <h3 className="text-base sm:text-lg font-sans font-extrabold text-charcoal dark:text-gray-100 mb-3 tracking-tight">Quick Actions</h3>
                  <div className="flex gap-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveScreen('add')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-primary to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all text-sm font-bold"
                    >
                      <span className="text-base">+</span>
                      <span>Add</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleOpenSettleUp}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-gray-700 border-2 border-stone-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 hover:bg-primary/10 dark:hover:bg-primary/20 text-charcoal dark:text-gray-200 rounded-xl transition-all text-sm font-bold shadow-md hover:shadow-lg"
                    >
                      <span className="text-base">$</span>
                      <span>Settle</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveScreen('profile')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-gray-700 border-2 border-stone-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary-400 hover:bg-primary/10 dark:hover:bg-primary/20 text-charcoal dark:text-gray-200 rounded-xl transition-all text-sm font-bold shadow-md hover:shadow-lg"
                    >
                      <span className="text-base">⚙</span>
                      <span>Users</span>
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
            
            {/* Install Banner - Show to new users - Last element on dashboard, so rounded bottom */}
            {activeScreen === 'dashboard' && !sessionStorage.getItem('install-banner-dismissed') && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                          className="inline-flex items-center px-6 py-3 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary-700 transition-colors"
                        >
                        📖 See How to Install
                      </motion.a>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          sessionStorage.setItem('install-banner-dismissed', 'true');
                          window.location.reload();
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
                      sessionStorage.setItem('install-banner-dismissed', 'true');
                      window.location.reload();
                    }}
                    className="flex-shrink-0 text-sage hover:text-charcoal dark:hover:text-gray-300 text-xl leading-none"
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
        onHelpClick={() => setIsHelpModalOpen(true)}
      />
      
      {/* Floating Feedback Button - Always accessible */}
      <FeedbackButton />
      
      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onRestartTour={() => {
          localStorage.removeItem('onboarding-completed');
          setShowOnboarding(true);
        }}
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
    </div>
  );
};

export default App;