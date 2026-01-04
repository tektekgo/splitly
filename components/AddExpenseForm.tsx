
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
import CurrencySelector from './CurrencySelector';
import { getCachedExchangeRate } from '../utils/exchangeRate';

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
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(SplitMethod.Equal);
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [splitComponentKey, setSplitComponentKey] = useState(0);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  
  // Multi-currency support
  const [originalCurrency, setOriginalCurrency] = useState<string>(group.currency);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [exchangeRateManual, setExchangeRateManual] = useState<string>('');
  const [isRateManual, setIsRateManual] = useState(false);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [rateDate, setRateDate] = useState<string>('');
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  const numericAmount = parseFloat(amount) || 0;
  const isEditing = !!expenseToEdit;

  const resetForm = useCallback(() => {
    setDescription('');
    setAmount('');
    setCategory(Category.FoodAndDrink);
    setCategoryManuallySet(false);
    setPaidBy(currentUserId);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setSplitMethod(SplitMethod.Equal);
    setSplits([]);
    setError(null);
    setSplitComponentKey(prevKey => prevKey + 1);
    // Reset multi-currency fields
    setOriginalCurrency(group.currency);
    setExchangeRate(1);
    setExchangeRateManual('');
    setIsRateManual(false);
    setRateDate('');
    setConvertedAmount(0);
  }, [currentUserId, group.currency]);
  
  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      // If expense has original currency, show original amount; otherwise show converted amount
      if (expenseToEdit.originalAmount && expenseToEdit.originalCurrency) {
        setAmount(String(expenseToEdit.originalAmount));
        setOriginalCurrency(expenseToEdit.originalCurrency);
        setExchangeRate(expenseToEdit.exchangeRate || 1);
        setRateDate(expenseToEdit.rateDate || '');
        setIsRateManual(expenseToEdit.rateSource === 'manual');
        if (expenseToEdit.rateSource === 'manual') {
          setExchangeRateManual(String(expenseToEdit.exchangeRate || 1));
        }
      } else {
        setAmount(String(expenseToEdit.amount));
        setOriginalCurrency(expenseToEdit.currency);
        setExchangeRate(1);
        setRateDate('');
        setIsRateManual(false);
        setExchangeRateManual('');
      }
      setCategory(expenseToEdit.category);
      setCategoryManuallySet(true);
      setPaidBy(expenseToEdit.paidBy);
      setExpenseDate(expenseToEdit.expenseDate.split('T')[0]); // Convert ISO string to YYYY-MM-DD
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

  // Fetch exchange rate when currency changes
  useEffect(() => {
    const fetchRate = async () => {
      if (originalCurrency === group.currency) {
        // Same currency - no conversion needed
        setExchangeRate(1);
        setConvertedAmount(numericAmount);
        setRateDate(new Date().toISOString().split('T')[0]);
        return;
      }

      if (!isRateManual && numericAmount > 0) {
        setIsLoadingRate(true);
        try {
          const result = await getCachedExchangeRate(originalCurrency, group.currency);
          setExchangeRate(result.rate);
          setRateDate(result.date);
          setConvertedAmount(numericAmount * result.rate);
        } catch (err) {
          console.error('Failed to fetch exchange rate:', err);
          setError('Failed to fetch exchange rate. Please enter manually.');
          setIsRateManual(true);
        } finally {
          setIsLoadingRate(false);
        }
      } else if (isRateManual && exchangeRateManual) {
        // Use manual rate
        const manualRate = parseFloat(exchangeRateManual) || 1;
        setExchangeRate(manualRate);
        setConvertedAmount(numericAmount * manualRate);
      } else {
        setConvertedAmount(numericAmount);
      }
    };

    fetchRate();
  }, [originalCurrency, group.currency, numericAmount, isRateManual, exchangeRateManual]);

  // Update converted amount when amount or rate changes
  useEffect(() => {
    if (originalCurrency === group.currency) {
      setConvertedAmount(numericAmount);
    } else {
      const rate = isRateManual ? (parseFloat(exchangeRateManual) || 1) : exchangeRate;
      setConvertedAmount(numericAmount * rate);
    }
  }, [numericAmount, exchangeRate, originalCurrency, group.currency, isRateManual, exchangeRateManual]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let errorMsg = error;
    if (!errorMsg) {
        if (numericAmount <= 0) errorMsg = 'Amount must be greater than 0.';
    }

    if (errorMsg) {
      alert(`Please fix the errors before saving:\n- ${errorMsg}`);
      return;
    }

    // If no splits are selected, save as personal expense (empty splits array)
    // Personal expenses don't affect group balances - they're just for record-keeping
    const finalSplits = splits.length > 0 ? splits : [];

    // Determine final amount (converted to group currency)
    const finalAmount = originalCurrency === group.currency 
      ? numericAmount 
      : convertedAmount;

    // Build expense object with multi-currency support
    const finalExpense: FinalExpense = {
      id: expenseToEdit?.id || crypto.randomUUID(),
      groupId: group.id,
      description,
      amount: finalAmount, // Always in group currency (base currency)
      currency: group.currency, // Group currency (base currency)
      category,
      paidBy,
      expenseDate: new Date(expenseDate).toISOString(),
      splitMethod,
      splits: finalSplits,
      // Multi-currency fields (only if different from group currency)
      ...(originalCurrency !== group.currency && {
        originalAmount: numericAmount,
        originalCurrency: originalCurrency,
        exchangeRate: exchangeRate,
        rateDate: rateDate || new Date().toISOString().split('T')[0],
        rateSource: isRateManual ? 'manual' as const : 'auto' as const,
      }),
    };
    onSaveExpense(finalExpense);
    if (!isEditing) {
        resetForm();
    }
  };

  const renderSplitMethod = () => {
    // Use converted amount for splits (always in group currency)
    const amountForSplits = originalCurrency === group.currency ? numericAmount : convertedAmount;
    const props = {
      totalAmount: amountForSplits,
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <SparklesIcon className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
          {isEditing ? 'Edit Expense' : 'Add New Expense'}
        </h2>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Description</label>
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="expenseDate" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Date</label>
          <input
            id="expenseDate"
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
            Amount
          </label>
          <div className="mt-1 space-y-2">
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <span className="text-gray-500 dark:text-gray-400 sm:text-sm">{getCurrencySymbol(originalCurrency)}</span>
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
            <CurrencySelector
              value={originalCurrency}
              onChange={setOriginalCurrency}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* Currency Conversion Section */}
      {originalCurrency !== group.currency && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                Exchange Rate ({originalCurrency} → {group.currency})
              </label>
              <button
                type="button"
                onClick={() => setIsRateManual(!isRateManual)}
                className="text-xs text-primary hover:text-primary-700 dark:hover:text-primary-300"
              >
                {isRateManual ? 'Use Auto Rate' : 'Enter Manually'}
              </button>
            </div>
            
            {isLoadingRate && !isRateManual ? (
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Loading exchange rate...
              </div>
            ) : isRateManual ? (
              <input
                type="number"
                value={exchangeRateManual}
                onChange={(e) => {
                  setExchangeRateManual(e.target.value);
                  const manualRate = parseFloat(e.target.value) || 1;
                  setExchangeRate(manualRate);
                }}
                placeholder="Enter exchange rate"
                step="0.0001"
                min="0.0001"
                className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            ) : (
              <div className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                1 {originalCurrency} = {exchangeRate.toFixed(4)} {group.currency}
                {rateDate && (
                  <span className="block text-xs font-normal text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    Rate date: {rateDate}
                  </span>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Converted Amount ({group.currency}):
                </span>
                <span className="text-lg font-bold text-primary dark:text-primary-300">
                  {formatCurrency(convertedAmount, group.currency)}
                </span>
              </div>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                This amount will be used for balance calculations
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category);
              setCategoryManuallySet(true);
            }}
            className="mt-1 block w-full pl-3 pr-10 py-2 border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
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
      </div>

      <div>
        <SplitMethodTabs activeMethod={splitMethod} onSelectMethod={setSplitMethod} />
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-stone-200 dark:border-gray-600">
          {renderSplitMethod()}
        </div>
        <p className="mt-2 text-xs text-text-secondary-light dark:text-text-secondary-dark">
          Split amounts are calculated in {group.currency} (group currency)
        </p>
      </div>

      <div className="pt-2 flex items-center space-x-4">
        {isEditing && (
            <button
            type="button"
            onClick={onCancelEdit}
            className="w-1/3 flex justify-center py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
            Cancel
            </button>
        )}
        <button
          type="submit"
          disabled={!!error || !description || numericAmount <= 0}
          className="w-full flex justify-center py-2 px-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
        >
          {isEditing ? 'Update Expense' : 'Save Expense'}
        </button>
      </div>
       {error && <p className="mt-2 text-sm text-center text-error">{error}</p>}
    </form>
  );
};

export default AddExpenseForm;
