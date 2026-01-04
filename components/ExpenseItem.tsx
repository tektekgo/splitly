import React from 'react';
import { motion } from 'framer-motion';
import { FinalExpense, User } from '../types';
import { CategoryIcon, EditIcon, DeleteIcon } from './icons';
import { formatExpenseAmount, formatCurrency } from '../utils/currencyFormatter';

interface ExpenseItemProps {
  expense: FinalExpense;
  members: User[];
  onDelete: (id: string) => void;
  onEdit: (expense: FinalExpense) => void;
  onView: (expense: FinalExpense) => void;
  currentUserId: string; 
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({ expense, members, onDelete, onEdit, onView, currentUserId }) => {
    //const payer = members.find(m => m.id === expense.paidBy);
    const payer = members.find(m => m.id === expense.paidBy);
    const payerName = payer?.name?.replace(' (You)', '') || 'Unknown';
    const userShareSplit = expense.splits.find(s => s.userId === currentUserId);
    const userShare = userShareSplit ? userShareSplit.amount : 0;
    const userIsPayer = expense.paidBy === currentUserId;

    // Calculate the net effect on the current user for this single transaction
    const netEffect = userIsPayer ? (expense.amount - userShare) : -userShare;
    
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    }

    // Format net effect with currency (use expense currency which is group currency)
    const formatNetEffect = (amount: number) => {
      return formatCurrency(amount, expense.currency || 'USD');
    };

    const statusBadge = Math.abs(netEffect) < 0.01 
        ? { text: 'No cost to you', color: 'text-sage bg-stone-100 dark:bg-gray-700' }
        : netEffect > 0 
        ? { text: `You get back ${formatNetEffect(netEffect)}`, color: 'text-primary bg-teal-light dark:bg-primary/20' }
        : { text: `You owe ${formatNetEffect(-netEffect)}`, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' };

    return (
        <motion.li 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 hover:bg-primary/5 dark:hover:bg-gray-600 rounded-xl transition-all cursor-pointer group border-2 border-stone-200 dark:border-gray-600 shadow-sm hover:shadow-md"
            onClick={() => onView(expense)}
        >
            <div className="flex items-center gap-3 flex-grow min-w-0">
                <div className="flex-shrink-0 p-3 bg-gradient-to-br from-primary-100 via-primary-50 to-white dark:from-primary/40 dark:via-primary/30 dark:to-gray-700 rounded-xl ring-2 ring-primary/20 dark:ring-primary/30 shadow-sm">
                     <CategoryIcon category={expense.category} className="w-5 h-5 text-primary dark:text-primary-300" />
                </div>
                <div className="min-w-0 flex-grow">
                    <p className="text-base font-sans font-extrabold text-charcoal dark:text-gray-100 truncate mb-0.5">{expense.description}</p>
                    <div className="flex items-center gap-1.5">
                        <p className="text-xs text-sage dark:text-text-secondary-dark">
                            {payerName}
                        </p>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${statusBadge.color}`}>
                            {statusBadge.text}
                        </span>
                    </div>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3 flex items-center gap-2">
                <div className="text-right">
                    <p className="text-lg font-sans font-extrabold text-charcoal dark:text-gray-100">
                        {formatExpenseAmount(expense)}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={(e) => handleActionClick(e, () => onEdit(expense))} 
                      className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-gray-600 text-sage hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        <EditIcon className="w-5 h-5"/>
                    </motion.button>
                     <motion.button 
                       whileTap={{ scale: 0.9 }}
                       whileHover={{ scale: 1.1 }}
                       onClick={(e) => handleActionClick(e, () => onDelete(expense.id))} 
                       className="p-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 text-sage hover:text-red-500 transition-colors"
                    >
                        <DeleteIcon className="w-5 h-5"/>
                    </motion.button>
                </div>
            </div>
        </motion.li>
    );
};

export default ExpenseItem;