import type { FinalExpense, SimplifiedDebt, User } from '../types';

function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

function escapeCsvCell(cell: string | number): string {
    const cellStr = String(cell);
    // If the cell contains a comma, double quote, or newline, wrap it in double quotes
    // and escape any existing double quotes by doubling them.
    if (/[",\n]/.test(cellStr)) {
        return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
}

export function exportExpenseLogToCSV(expenses: FinalExpense[], users: User[]): void {
  const userMap = new Map(users.map(u => [u.id, u.name]));
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Paid By', 'Split Details'];
  
  const rows = expenses.map(expense => {
    const expenseDate = new Date(expense.expenseDate).toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const paidBy = userMap.get(expense.paidBy)?.replace(' (You)', '') || 'Unknown';
    const splitDetails = expense.splits.map(split => {
        const userName = userMap.get(split.userId)?.replace(' (You)', '') || 'Unknown';
        return `${userName} owes $${split.amount.toFixed(2)}`;
    }).join('; ');

    return [
      expenseDate,
      expense.description,
      expense.category,
      expense.amount.toFixed(2),
      paidBy,
      splitDetails,
    ].map(escapeCsvCell).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadCSV(csvContent, 'splitly-expense-log.csv');
}

export function exportSettlementToCSV(debts: SimplifiedDebt[], users: User[]): void {
    const userMap = new Map(users.map(u => [u.id, u.name]));
    const headers = ['From', 'To', 'Amount'];

    const rows = debts.map(debt => {
        const fromUser = userMap.get(debt.from)?.replace(' (You)', '') || 'Unknown';
        const toUser = userMap.get(debt.to)?.replace(' (You)', '') || 'Unknown';
        return [
            fromUser,
            toUser,
            debt.amount.toFixed(2)
        ].map(escapeCsvCell).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, 'splitly-settlement-plan.csv');
}
