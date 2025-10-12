
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
import type { FinalExpense, SimplifiedDebt, User, Group, Notification } from './types';
import { SplitMethod, Category, NotificationType } from './types';
import { MoonIcon, SunIcon, UsersIcon } from './components/icons';
import { simplifyDebts } from './utils/debtSimplification';
import { db } from './firebase';
import { collection, getDocs, doc, writeBatch, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import FeedbackButton from './components/FeedbackButton';
import InfoTooltip from './components/InfoTooltip';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

type Theme = 'light' | 'dark';
type Screen = 'dashboard' | 'add' | 'groups' | 'profile' | 'activity';

const ThemeToggle: React.FC<{ theme: Theme, toggleTheme: () => void }> = ({ theme, toggleTheme }) => (
    <button
      onClick={toggleTheme}
      className="absolute top-8 right-4 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
    </button>
);

const App: React.FC = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<FinalExpense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [isSettleUpModalOpen, setIsSettleUpModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupDebt, setEditingGroupDebt] = useState(0);

  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  
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
            
            // Fetch all users (needed for group member selection)
            const usersSnapshot = await getDocs(collection(db, 'users'));
            
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

            // Process all the data
            const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            const groupsData = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
            const notificationsData = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            // Sort expenses by date
            expensesData.sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());

            setUsers(usersData);
            setGroups(groupsData);
            setExpenses(expensesData);
            setNotifications(notificationsData);

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
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
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
      category: Category.Payment,
      paidBy: payment.from,
      expenseDate: new Date().toISOString(),
      splitMethod: SplitMethod.Unequal,
      splits: [{ userId: payment.to, amount: payment.amount }],
    };

    const newNotificationData: Omit<Notification, 'id'> = {
        message: `${fromUser.name.replace(' (You)', '')} paid ${toUser.name.replace(' (You)', '')} $${payment.amount.toFixed(2)}.`,
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
        const docRef = await addDoc(collection(db, 'groups'), newGroupData);
        const newGroup = { ...newGroupData, id: docRef.id };
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
        avatarUrl: `https://i.pravatar.cc/150?u=${crypto.randomUUID()}`
    };
    try {
        const docRef = await addDoc(collection(db, 'users'), newUserNoId);
        setUsers(prev => [...prev, { id: docRef.id, ...newUserNoId }]);
    } catch (error) {
        console.error("Error creating user: ", error);
        alert("Failed to create user. Please try again.");
    }
  };
  
  const handleSetActiveGroup = (groupId: string) => {
    setActiveGroupId(groupId);
    setActiveScreen('dashboard');
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
            <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
                <div className="p-10 text-center max-w-lg mx-auto">
                    <div className="text-6xl mb-4">👥</div>
                    <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-3">
                        Welcome to Splitly!
                    </h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
                        Let's create your first group to start tracking shared expenses.
                    </p>
                    
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-6 mb-6 text-left">
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
          <>
            <section className="mb-8">
              <BalanceSummary 
                expenses={activeGroupExpenses} 
                group={activeGroup}
                members={activeGroupMembers}
                currentUserId={currentUser.id} 
                onSettleUpClick={handleOpenSettleUp}
                onViewDetail={handleViewBalanceDetail}
                onManageGroupClick={handleOpenGroupManagement}
                onExportClick={handleOpenExport}
              />
            </section>
            <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark flex items-center">
                  Recent Expenses
                  <InfoTooltip text="All expenses in this group, sorted by date. Use filters below to find specific expenses." />
                </h2>
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
                <ExpenseList 
                  expenses={filteredExpenses} 
                  members={activeGroupMembers}
                  onDeleteExpense={handleDeleteExpense}
                  onEditExpense={handleStartEdit}
                  onViewExpense={handleViewExpense}
                  hasActiveFilters={hasActiveFilters}
                  originalExpenseCount={activeGroupExpenses.length}
                  currentUserId={currentUser.id}
                />
              </div>
            </main>
          </>
        );
      case 'add':
        if (!activeGroup || !activeGroupId) {
             return (
                 <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
                    <div className="p-10 text-center">
                        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Select a Group First</h2>
                        <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">You need to select an active group before you can add an expense.</p>
                    </div>
                 </main>
             )
        }
        return (
          <main className="bg-content-light dark:bg-content-dark rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
              </h2>
              <AddExpenseForm 
                members={activeGroupMembers}
                currentUserId={currentUser.id} 
                onSaveExpense={handleSaveExpense} 
                expenseToEdit={editingExpense}
                onCancelEdit={handleCancelEdit}
                groupId={activeGroupId}
                groupName={activeGroup?.name || 'Unknown Group'}
                getCategorySuggestion={getCategorySuggestion}
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
            onSelectGroup={handleSetActiveGroup}
            onCreateGroup={handleCreateGroup}
          />
        );
      case 'activity':
          return <ActivityScreen notifications={notifications} />;
      case 'profile':
        return (
            <ProfileScreen
                users={users}
                onCreateUser={handleCreateUser}
            />
        );
      default:
        return null;
    }
  }

  return (
    <div className="bg-surface-light dark:bg-surface-dark font-sans text-text-primary-light dark:text-text-primary-dark transition-colors duration-300">
      <div className="container mx-auto max-w-3xl px-4 relative min-h-screen flex flex-col pt-8">
        <main className="flex-grow">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            
            <header className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <h1 className="text-5xl font-extrabold text-primary tracking-tight">Splitly</h1>
              </div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Welcome back, <span className="font-semibold text-primary">{currentUser.name}</span>
              </p>
              <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">Splitting expenses, made easy.</p>
            </header>
            {/* Install Banner - Show to new users */}
            {!sessionStorage.getItem('install-banner-dismissed') && (
              <div className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-2xl">📱</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">
                      Install Splitly on your device!
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
              className="text-primary hover:underline font-medium flex items-center gap-1"
            >
              📱 Install App
            </a>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <a 
              href="https://forms.gle/1w3Vk6FhrQDppagw5"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium flex items-center gap-1"
            >
              💬 Send Feedback
            </a>
          </div>
          <p>Simplifying shared expenses | Built by Sujit Gangadharan</p>
          <p className="text-xs">© 2025</p>
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
        />
      )}

      {groupForEditing && (
          <GroupManagementModal
              isOpen={!!groupForEditing}
              onClose={() => setEditingGroupId(null)}
              group={groupForEditing}
              allUsers={users}
              currentUserId={currentUser.id}
              onSave={handleSaveGroupChanges}
              onDelete={handleDeleteGroup}
              totalDebt={editingGroupDebt}
              onCreateUser={handleCreateUser}
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
