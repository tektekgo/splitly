import React, { useState, useMemo } from 'react';
import type { FinalExpense, SimplifiedDebt, User, Group } from '../types';
import { exportExpenseLogToCSV, exportSettlementToCSV } from '../utils/export';
import { simplifyDebts } from '../utils/debtSimplification';
import { ExportIcon } from './icons';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: FinalExpense[];
  members: User[];
  simplifiedDebts: SimplifiedDebt[];
  group: Group;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, expenses, members, simplifiedDebts, group }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { filteredExpenses, filteredDebts } = useMemo(() => {
    if (!startDate && !endDate) {
      // No filter applied, use props directly
      return { filteredExpenses: expenses, filteredDebts: simplifiedDebts };
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start) start.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone issues
    if (end) end.setUTCHours(23, 59, 59, 999);

    const filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.expenseDate);
      if (start && expenseDate < start) return false;
      if (end && expenseDate > end) return false;
      return true;
    });

    // Recalculate debts for the filtered expenses
    const balances = new Map<string, number>();
    members.forEach(member => balances.set(member.id, 0));

    filtered.forEach(expense => {
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

    const recalculatedDebts = simplifyDebts(balances);

    return { filteredExpenses: filtered, filteredDebts: recalculatedDebts };
  }, [expenses, members, simplifiedDebts, startDate, endDate]);

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  if (!isOpen) return null;

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const dateRangeText = startDate && endDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : startDate ? `From ${formatDate(startDate)}` : endDate ? `Until ${formatDate(endDate)}` : "All time";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-stone-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border-light dark:border-border-dark flex justify-between items-center">
          <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">Export Group Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-stone-100 dark:border-gray-600">
                <p className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">Filter by Date (Optional)</p>
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        min={startDate}
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                </div>
                {(startDate || endDate) && (
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-primary font-medium">{dateRangeText}</p>
                        <button onClick={handleClearDates} className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Clear</button>
                    </div>
                )}
            </div>

            <button
                onClick={() => exportExpenseLogToCSV(filteredExpenses, members)}
                disabled={filteredExpenses.length === 0}
                className="w-full flex items-center justify-start gap-3 text-left p-4 rounded-xl border-2 border-transparent bg-gray-50 dark:bg-gray-700 hover:border-primary dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent transition-all"
            >
                <ExportIcon className="w-8 h-8 text-primary flex-shrink-0"/>
                <div>
                    <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">Full Expense Log</h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Exporting {filteredExpenses.length} transaction(s).
                    </p>
                </div>
            </button>

            <button
                onClick={() => exportSettlementToCSV(filteredDebts, members, group.currency)}
                disabled={filteredDebts.length === 0}
                className="w-full flex items-center justify-start gap-3 text-left p-4 rounded-xl border-2 border-transparent bg-gray-50 dark:bg-gray-700 hover:border-primary dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent transition-all"
            >
                <ExportIcon className="w-8 h-8 text-primary flex-shrink-0"/>
                <div>
                    <h3 className="font-bold text-lg text-text-primary-light dark:text-text-primary-dark">Settlement Plan</h3>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Exporting {filteredDebts.length} payment(s).
                    </p>
                </div>
            </button>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-stone-200 dark:border-gray-600 text-right rounded-b-2xl">
            <button
                onClick={onClose}
                className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;