import type { SimplifiedDebt } from '../types';

const PRECISION = 0.01;

export function simplifyDebts(balances: Map<string, number>): SimplifiedDebt[] {
  const transactions: SimplifiedDebt[] = [];
  const debtors: { id: string; balance: number }[] = [];
  const creditors: { id: string; balance: number }[] = [];

  balances.forEach((balance, id) => {
    if (balance < -PRECISION) {
      debtors.push({ id, balance: -balance });
    } else if (balance > PRECISION) {
      creditors.push({ id, balance });
    }
  });

  // Sort by largest amounts first
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountToTransfer = Math.min(debtor.balance, creditor.balance);

    if (amountToTransfer > PRECISION) {
        transactions.push({
            from: debtor.id,
            to: creditor.id,
            amount: amountToTransfer,
        });

        debtor.balance -= amountToTransfer;
        creditor.balance -= amountToTransfer;
    }

    if (debtor.balance < PRECISION) {
      debtorIndex++;
    }
    if (creditor.balance < PRECISION) {
      creditorIndex++;
    }
  }

  return transactions;
}
