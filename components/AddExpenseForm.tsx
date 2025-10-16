
import React, { useState, useCallback, useEffect } from 'react';
import type { User, FinalExpense, ExpenseSplit, Group } from '../types';
import { SplitMethod, Category } from '../types';
import { CATEGORIES } from '../constants';
import SplitMethodTabs from './SplitMethodTabs';
import SplitEqually from './split_methods/SplitEqually';
import SplitUnequally from './split_methods/SplitUnequally';
import SplitByPercentage from './split_methods/SplitByPercentage';
import SplitByShares from './split_methods/SplitByShares';
import { SparklesIcon } from './icons';
import { formatCurrency, getCurrencySymbol } from '../utils/currencyFormatter';

interface AddExpenseFormProps {
  members: User[];
  currentUserId: string;
  onSaveExpense: (expense: FinalExpense) => void;
  expenseToEdit?: FinalExpense | null;
  onCancelEdit?: () => void;
  group: Group;
  getCategorySuggestion: (description: string) => Promise<Category | null>;
  onBack?: () => void;
}

const AddExpenseForm: React.FC<AddExpenseFormProps> = ({ members, currentUserId, onSaveExpense, expenseToEdit, onCancelEdit, group, getCategorySuggestion, onBack }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(Category.FoodAndDrink);
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(SplitMethod.Equal);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [splitComponentKey, setSplitComponentKey] = useState(0);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const isEditing = !!expenseToEdit;

  const resetForm = useCallback(() => {
    setDescription('');
    setAmount('');
    setCategory(Category.FoodAndDrink);
    setCategoryManuallySet(false);
    setPaidBy(currentUserId);
    setSplitMethod(SplitMethod.Equal);
    setSplits([]);
    setError(null);
    setSplitComponentKey(prevKey => prevKey + 1);
  }, [currentUserId]);
  
  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setAmount(String(expenseToEdit.amount));
      setCategory(expenseToEdit.category);
      setCategoryManuallySet(true);
      setPaidBy(expenseToEdit.paidBy);
      setSplitMethod(expenseToEdit.splitMethod);
      setSplits(expenseToEdit.splits); // this will be passed down
      setSplitComponentKey(prevKey => prevKey + 1); // Force re-render of split component
    } else {
        resetForm();
    }
  }, [expenseToEdit, resetForm]);

  useEffect(() => {
    let isCancelled = false;

    const suggest = async () => {
        setIsSuggesting(true);
        const suggestedCategory = await getCategorySuggestion(description);
        if (!isCancelled && suggestedCategory) {
            setCategory(suggestedCategory);
        }
        if (!isCancelled) {
            setIsSuggesting(false);
        }
    };

    if (description.trim().length > 3 && !isEditing && !categoryManuallySet) {
        const handler = setTimeout(suggest, 1000);
        return () => {
            clearTimeout(handler);
            isCancelled = true;
            setIsSuggesting(false);
        };
    }
  }, [description, isEditing, categoryManuallySet, getCategorySuggestion]);


  const handleSplitsUpdate = useCallback((newSplits: ExpenseSplit[], error?: string | null) => {
    setSplits(newSplits);
    setError(error || null);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let errorMsg = error;
    if (!errorMsg) {
        if (numericAmount <= 0) errorMsg = 'Amount must be greater than 0.';
        else if (splits.length === 0) errorMsg = 'Expense must be split with at least one person.';
    }

    if (errorMsg) {
      alert(`Please fix the errors before saving:\n- ${errorMsg}`);
      return;
    }

    const finalExpense: FinalExpense = {
      id: expenseToEdit?.id || crypto.randomUUID(),
      groupId: group.id,
      description,
      amount: numericAmount,
      currency: group.currency,
      category,
      paidBy,
      expenseDate: expenseToEdit?.expenseDate || new Date().toISOString(),
      splitMethod,
      splits,
    };
    onSaveExpense(finalExpense);
    if (!isEditing) {
        resetForm();
    }
  };

  const renderSplitMethod = () => {
    const props = {
      totalAmount: numericAmount,
      members: members,
      payerId: paidBy,
      currency: group.currency,
      onUpdateSplits: handleSplitsUpdate,
      initialSplits: expenseToEdit?.splitMethod === splitMethod ? expenseToEdit.splits : undefined,
    };
    switch (splitMethod) {
      case SplitMethod.Equal:
        return <SplitEqually {...props} key={splitComponentKey} />;
      case SplitMethod.Unequal:
        return <SplitUnequally {...props} key={splitComponentKey} />;
      case SplitMethod.Percentage:
        return <SplitByPercentage {...props} key={splitComponentKey} />;
      case SplitMethod.Shares:
        return <SplitByShares {...props} key={splitComponentKey} />;
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Group context pill removed per UX feedback - title area remains minimal */}
      <div>
        <label htmlFor="description" className="block text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">Description</label>
        <input
          id="description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Dinner at restaurant"
          required
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary text-sm"
        />
      </div>

      <div className="flex space-x-4">
        <div className="w-1/3">
          <label htmlFor="amount" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Amount</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{getCurrencySymbol(group.currency)}</span>
            </div>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              step="0.01"
              min="0.01"
              className="block w-full pl-7 pr-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Currency: {group.currency}
          </p>
        </div>
        <div className="w-2/3">
            <label htmlFor="category" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                Category
            </label>
            <div className="mt-1 relative">
                <select
                    id="category"
                    value={category}
                    onChange={(e) => {
                        setCategory(e.target.value as Category);
                        setCategoryManuallySet(true);
                    }}
                    className="block w-full pl-3 pr-10 py-2 border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    >
                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="paidBy" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Paid by</label>
        <select
          id="paidBy"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          {members.map(member => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
      </div>

      <div>
        <SplitMethodTabs activeMethod={splitMethod} onSelectMethod={setSplitMethod} />
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-border-light dark:border-border-dark">
          {renderSplitMethod()}
        </div>
      </div>

      <div className="pt-2 flex items-center space-x-4">
        {isEditing && (
            <button
            type="button"
            onClick={onCancelEdit}
            className="w-1/3 flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
            Cancel
            </button>
        )}
        <button
          type="submit"
          disabled={!!error || !description || numericAmount <= 0 || splits.length === 0}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
        >
          {isEditing ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
       {error && <p className="mt-2 text-sm text-center text-error">{error}</p>}
    </form>
  );
};

export default AddExpenseForm;
