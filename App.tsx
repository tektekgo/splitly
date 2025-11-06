
import React, { useState, useCallback, useMemo, useEffect } from 'react';
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

type Theme = 'light' | 'dark';
type Screen = 'dashboard' | 'add' | 'groups' | 'profile' | 'activity';

const ThemeToggle: React.FC<{ theme: Theme, toggleTheme: () => void }> = ({ theme, toggleTheme }) => (
    <button
      onClick={toggleTheme}
      className="absolute top-8 right-4 p-3 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary z-50 cursor-pointer shadow-sm border border-gray-200 dark:border-gray-600"
      aria-label="Toggle theme"
      style={{ pointerEvents: 'auto' }}
    >
      {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
    </button>
);

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
    if (currentUserBalance > 0.01) return 'text-green-600 dark:text-green-400';
    if (currentUserBalance < -0.01) return 'text-red-600 dark:text-red-400';
    return 'text-text-primary-light dark:text-text-primary-dark';
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
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
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
            <main className="bg-content-light dark:bg-content-dark rounded-lg shadow-md overflow-hidden">
                <div className="p-4 text-center max-w-sm mx-auto">
                    {/* Compact Welcome Header */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                      <div className="p-4 text-center">
                        <div className="flex justify-center mb-2">
                          <div className="bg-white dark:bg-gray-900 rounded-lg p-2 shadow-sm">
                            <img 
                              src="/splitbi-logo.png" 
                              alt="Splitbi Logo" 
                              className="h-24 sm:h-28 w-auto"
                            />
                          </div>
                        </div>
                        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Welcome to Splitbi!
                        </h2>
                      </div>
                    </div>
                    
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3">
                        Let's create your first group to start tracking shared expenses.
                    </p>
                    
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 mb-4 text-left">
                        <p className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                            💡 What are groups?
                        </p>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                            Groups help you organize expenses for different situations:
                        </p>
                        <ul className="space-y-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
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
                    </div>

                    <button
                        onClick={() => setActiveScreen('groups')}
                        className="w-full px-6 py-4 bg-primary text-white font-semibold rounded-lg shadow-lg hover:bg-primary-600 transition-all hover:scale-105"
                    >
                        + Create Your First Group
                    </button>
                    
                    <p className="mt-4 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        Click the <strong>Groups</strong> tab at the bottom to get started
                    </p>
                </div>
            </main>
          )
        }

        return (
          <div className="space-y-3">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg shadow-sm border border-slate-200 dark:border-gray-600 p-4">
              <div className="text-center">
                <p className="text-base font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                  Your Balance
                </p>
                <p className={`text-3xl font-bold mb-1 ${balanceColor}`}>
                  {formatCurrency(Math.abs(currentUserBalance), activeGroup?.currency || 'USD')}
                </p>
                <p className="text-base font-medium text-slate-600 dark:text-slate-300">
                  {balanceDescription}
                </p>
              </div>
            </div>

            {/* Groups Card */}
            <div className="bg-slate-50 dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Groups</h3>
                <button 
                  onClick={() => {
                    if (activeGroupId) {
                      setEditingGroupDebt(calculateGroupDebt(activeGroupId));
                      setEditingGroupId(activeGroupId);
                      setIsGroupManagementModalOpen(true);
                    }
                  }}
                  className="text-sm text-primary hover:text-primary-600 transition-colors font-medium"
                >
                  Manage →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleSetActiveGroup(group.id)}
                    className={`flex items-center gap-2 p-2 rounded-md transition-all text-left border ${
                      activeGroupId === group.id 
                        ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' 
                        : 'hover:bg-white dark:hover:bg-gray-700 border-slate-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-white dark:bg-gray-600 flex items-center justify-center shadow-sm">
                      <span className="text-xs">
                        {group.name.toLowerCase().includes('room') ? '🏠' :
                         group.name.toLowerCase().includes('trip') || group.name.toLowerCase().includes('travel') ? '✈️' :
                         group.name.toLowerCase().includes('family') ? '👨‍👩‍👧‍👦' :
                         group.name.toLowerCase().includes('work') || group.name.toLowerCase().includes('office') ? '💼' :
                         '👥'}
                      </span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-base font-bold truncate text-slate-800 dark:text-slate-100">{group.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ({group.members.length})
                      </p>
                    </div>
                    {activeGroupId === group.id && (
                      <div className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full"></div>
                    )}
                  </button>
                ))}
                
                {/* Create New Group - Full Width */}
                <button
                  onClick={() => setActiveScreen('groups')}
                  className="col-span-2 flex items-center justify-center gap-2 p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors border-2 border-dashed border-slate-300 dark:border-gray-600"
                >
                  <div className="w-6 h-6 rounded bg-white dark:bg-gray-600 flex items-center justify-center shadow-sm">
                    <span className="text-slate-400 text-xs">+</span>
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Create New Group</span>
                </button>
              </div>
            </div>

            {/* Recent Expenses Card */}
            <div className="bg-slate-50 dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700">
              <div className="p-3 border-b border-slate-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Recent Expenses
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full border border-slate-200 dark:border-gray-600">
                    {activeGroupExpenses.length} total
                  </span>
                </div>
              </div>
              <div className="p-3">
                {activeGroupExpenses.slice(0, 3).map(expense => {
                  const payer = activeGroupMembers.find(m => m.id === expense.paidBy);
                  return (
                    <div key={expense.id} className="flex items-center gap-2 py-2 border-b border-slate-100 dark:border-gray-700 last:border-b-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-white dark:bg-gray-600 flex items-center justify-center shadow-sm">
                        <span className="text-slate-600 dark:text-slate-300 text-sm">
                          {expense.category === 'Food' ? '🍕' :
                           expense.category === 'Transport' ? '🚗' :
                           expense.category === 'Entertainment' ? '🎬' :
                           expense.category === 'Shopping' ? '🛍️' :
                           '💰'}
                        </span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-base font-bold truncate text-slate-800 dark:text-slate-100">{expense.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Paid by {payer?.name?.replace(' (You)', '')}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                          {formatCurrency(expense.amount, activeGroup?.currency || 'USD')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {activeGroupExpenses.length === 0 && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm border border-slate-200 dark:border-gray-600">
                      <span className="text-slate-400 text-lg">💰</span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">No expenses yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add your first expense to get started</p>
                  </div>
                )}
                {activeGroupExpenses.length > 3 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-gray-700">
                    <button
                      onClick={() => {/* TODO: Implement view all */}}
                      className="w-full text-sm text-primary hover:text-primary-600 transition-colors font-medium py-1"
                    >
                      View All Expenses →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">Quick Actions</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveScreen('add')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm transition-all text-sm font-medium"
                >
                  <span className="text-sm">+</span>
                  <span>Add Expense</span>
                </button>
                <button
                  onClick={handleOpenSettleUp}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md shadow-sm transition-all text-sm font-medium"
                >
                  <span className="text-sm">$</span>
                  <span>Settle Up</span>
                </button>
                <button
                  onClick={() => setActiveScreen('profile')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all text-sm font-medium"
                >
                  <span className="text-sm">⚙</span>
                  <span>Users</span>
                </button>
              </div>
            </div>
          </div>
        );
      case 'add':
        if (!activeGroup || !activeGroupId) {
             return (
                 <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-10 text-center">
                        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Choose a Group</h2>
                        <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">Select a group to add your expense.</p>
                        <button
                          onClick={() => setActiveScreen('groups')}
                          className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                        >
                          Go to Groups
                        </button>
                    </div>
                 </main>
             )
        }
        return (
          <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
                  <span className="hidden sm:inline text-primary">→</span>
                  <span className="hidden sm:inline text-sm px-2 py-1 rounded-full border border-primary/20 bg-primary/10 dark:bg-primary/20 text-primary font-semibold">
                    {activeGroup?.name}
                  </span>
                </div>
                <button
                  onClick={() => setActiveScreen('dashboard')}
                  className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close and return to dashboard"
                  title="Close"
                >
                  ×
                </button>
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
          </main>
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
          return <ActivityScreen 
            notifications={notifications} 
            groupInvites={groupInvites.filter(invite => invite.invitedEmail === currentUser.email?.toLowerCase())}
            onAcceptInvite={handleAcceptInvite}
            onDeclineInvite={handleDeclineInvite}
          />;
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
    <div className="bg-surface-light dark:bg-surface-dark font-sans text-text-primary-light dark:text-text-primary-dark transition-colors duration-300">
      <div className="container mx-auto max-w-md sm:max-w-lg lg:max-w-xl px-3 relative min-h-screen flex flex-col pt-4">
        <main className="flex-grow">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            
            {/* Clean Professional Header */}
            <header className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 mb-4 relative">
              {/* Header Content */}
              <div className="p-4 text-center">
                {/* Logo */}
                <div className="flex justify-center mb-2">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                    <img 
                      src="/splitbi-logo.png" 
                      alt="Splitbi" 
                      className="h-28 sm:h-32 w-auto"
                    />
                  </div>
                </div>
                
                {/* Tagline */}
                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-3">
                  Splitting expenses, made easy
                </p>
                
                {/* User Welcome */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center gap-1 mx-auto"
                >
                  Welcome back, <span className="font-semibold text-gray-800 dark:text-gray-200">{currentUser.name}</span>
                  <svg className={`w-3 h-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                
              </div>
              
              {/* User Menu Dropdown */}
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute z-50 left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-border-light dark:border-border-dark overflow-hidden">
                    <div className="p-3 border-b border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-900/50">
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Signed in as</p>
                      <p className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark truncate">{currentUser.email}</p>
                    </div>
                    <button
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
                    </button>
                  </div>
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
            </header>
            {/* Install Banner - Show to new users */}
            {!sessionStorage.getItem('install-banner-dismissed') && (
              <div className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-2xl">📱</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
                      Install Splitbi on your device!
                    </h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-3">
                      Get instant access from your home screen. Works offline too!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      
                        <a href="/install.html"
                        target="_blank"
                        className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors">
                        📖 See How to Install
                      </a>
                      <button
                        onClick={() => {
                          sessionStorage.setItem('install-banner-dismissed', 'true');
                          window.location.reload();
                        }}
                        className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-text-primary-light dark:text-text-primary-dark text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Maybe Later
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('install-banner-dismissed', 'true');
                      window.location.reload();
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            {renderContent()}
            
        </main>

        <footer className="text-center pt-8 pb-4 text-gray-500 dark:text-gray-400 text-sm space-y-3">
          <div className="flex items-center justify-center gap-4 text-xs">
            <a 
              href="/install.html" 
              target="_blank"
              className="text-primary hover:underline font-bold flex items-center gap-1"
            >
              📱 Install App
            </a>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <a 
              href="https://forms.gle/1w3Vk6FhrQDppagw5"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-bold flex items-center gap-1"
            >
              💬 Send Feedback
            </a>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="text-primary hover:underline font-bold flex items-center gap-1"
            >
              ❓ Help & FAQ
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="font-bold">© 2025</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span className="font-bold">Built with <span className="text-red-500 animate-pulse">❤️</span> by</span>
            <span className="font-bold text-primary">Sujit Gangadharan</span>
          </div>
        </footer>
        <div className="h-20" />
      </div>

      <BottomNav 
        activeScreen={activeScreen} 
        onNavigate={setActiveScreen} 
        notificationCount={unreadNotificationCount} 
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
