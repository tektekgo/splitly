import React from 'react';
import { motion } from 'framer-motion';
import { FinalExpense, User } from '../types';
import { CategoryIcon, EditIcon, DeleteIcon } from './icons';

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

    return (
        <motion.li 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="flex items-center justify-between p-4 bg-white dark:bg-content-dark hover:bg-surface dark:hover:bg-gray-800 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 transition-all cursor-pointer group"
            onClick={() => onView(expense)}
        >
            <div className="flex items-center gap-4 flex-grow min-w-0">
                <div className="flex-shrink-0 p-3 bg-teal-light rounded-full">
                     <CategoryIcon category={expense.category} className="w-5 h-5 text-teal-primary" />
                </div>
                <div className="min-w-0">
                    <p className="text-base font-serif font-bold text-charcoal dark:text-text-primary-dark truncate">{expense.description}</p>
                    <p className="text-sm text-sage dark:text-text-secondary-dark">
                        Paid by {payerName}
                    </p>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4 flex items-center gap-2">
                <div>
                    <p className="text-lg font-serif font-bold text-charcoal dark:text-text-primary-dark">
                        ${expense.amount.toFixed(2)}
                    </p>
                    { Math.abs(netEffect) < 0.01 ?
                    <p className="text-sm text-sage dark:text-text-secondary-dark font-medium">No cost to you</p>
                    : netEffect > 0 ?
                    <p className="text-sm text-teal-primary font-medium">You get back ${netEffect.toFixed(2)}</p>
                    :
                    <p className="text-sm text-orange-500 font-medium">You owe ${(-netEffect).toFixed(2)}</p>
                    }
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleActionClick(e, () => onEdit(expense))} 
                      className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-gray-700 text-sage hover:text-charcoal dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <EditIcon className="w-5 h-5"/>
                    </motion.button>
                     <motion.button 
                       whileTap={{ scale: 0.95 }}
                       onClick={(e) => handleActionClick(e, () => onDelete(expense.id))} 
                       className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-sage hover:text-red-500"
                    >
                        <DeleteIcon className="w-5 h-5"/>
                    </motion.button>
                </div>
            </div>
        </motion.li>
    );
};

export default ExpenseItem;