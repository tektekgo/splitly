# SplitBi Calculation Logic Documentation

## Overview
This document explains how expenses, balances, and payments are calculated in SplitBi.

## Core Principles

### 1. Expense Types

#### Regular Expenses
- **Structure**: One person pays, multiple people split the cost
- **Example**: User A pays $100 for dinner, split between A, B, C ($33.33 each)
- **Balance Effect**:
  - Payer (A) balance: **+$100** (they paid for the expense)
  - Split participants (B, C) balance: **-$33.33 each** (they owe their share)

#### Payment Expenses
- **Structure**: One person pays another person directly
- **Example**: User A pays User B $50 to settle a debt
- **Balance Effect**:
  - Payer (A) balance: **-$50** (they paid money out)
  - Recipient (B) balance: **+$50** (they received money)
- **Data Structure**:
  - `paidBy`: Recipient (the one receiving the payment)
  - `splits`: `[{ userId: payer, amount: paymentAmount }]` (the one paying)

### 2. Balance Calculation Rules

#### Regular Expenses
- **Requirement**: Must have `splits.length >= 2` (at least 2 people involved)
- **Logic**:
  ```typescript
  payerBalance += expense.amount  // Payer gets credit for paying
  splitParticipantBalance -= split.amount  // Each participant owes their share
  ```

#### Payment Expenses
- **Requirement**: Must have `splits.length >= 1` (payer in splits, recipient is paidBy)
- **Logic**:
  ```typescript
  recipientBalance += expense.amount  // Recipient receives money
  payerBalance -= split.amount  // Payer pays money out
  ```

### 3. Deduplication
- All expenses are deduplicated by `expense.id` before calculations
- This ensures each expense is counted only once, even if it appears multiple times in the data

### 4. User Experience Flow

#### Creating a Group
1. User creates a group
2. Group is stored with creator as a member
3. Creator can immediately add expenses

#### Adding Members
- **Invited Users**: Real users with SplitBi accounts
  - Receive email invite
  - Sign up/log in with invited email
  - Invite auto-accepts (if from URL) or appears in Activity tab
  - User is added to group's `members` array
- **Guest Users**: Simulated users without accounts
  - Created by group creator
  - Only exist within the app (no email/auth)
  - Can be added to multiple groups

#### Creating Expenses
1. User selects group
2. User creates expense with:
   - Description
   - Amount
   - Payer (who paid)
   - Split method (Equal, Unequal, By %, By Shares)
   - Participants (must be 2+ people)
3. Expense is saved with `splits` array containing all participants
4. Balance calculations update automatically

#### Viewing Balances
- **Dashboard**: Shows current user's balance for active group
- **Balance Summary**: Shows all members' balances
- **Settle Up Modal**: Shows simplified debts (who owes whom)
  - "You Owe" section: Debts where current user is the debtor
  - "You Are Owed" section: Debts where current user is the creditor

#### Recording Payments
1. User clicks "Settle Up" button
2. Sees list of debts (simplified)
3. For each debt:
   - **"Pay" button**: Opens payment modal if recipient has payment info (Venmo/Zelle/Cash App)
   - **"Mark As Paid" button**: Records payment without external payment
4. Payment is recorded as a Payment expense
5. Balances update automatically

### 5. Financial Summary

#### Total Group Expense
- Sum of ALL unique expenses (including payments)
- Represents total money that has flowed through the group

#### Total Shared Expense
- Sum of unique expenses with `splits.length >= 2`
- Represents expenses that were split between multiple people
- Excludes payments and single-person expenses

#### Total Settled
- Sum of all Payment expenses
- Represents money that has been transferred between members

#### Balance to Settle
- Sum of all negative balances (what people owe)
- Represents outstanding debts that need to be paid

### 6. Invited Users Experience

#### After Accepting Invite
1. User is added to group's `members` array
2. Group appears in their Groups screen
3. User can:
   - View all expenses in the group
   - See their balance (what they owe/are owed)
   - Create new expenses
   - Record payments
   - View financial summary

#### Group Visibility
- Groups are fetched using: `where('members', 'array-contains', currentUser.id)`
- This ensures users only see groups they're members of
- All group data (expenses, balances) is filtered by group membership

### 7. Payment Methods

#### Venmo, Zelle, Cash App
- Users can add payment info in Profile
- When paying, "Pay" button opens payment modal with:
  - Deep links to payment apps (if available)
  - Copy payment details option
  - "Mark As Paid" button

#### Mark As Paid
- Records payment without external payment app
- Creates Payment expense
- Updates balances immediately
- Can be used for cash payments or other methods

## Calculation Locations

All balance calculations are performed in:
1. `App.tsx` - Main balances calculation (line ~676)
2. `App.tsx` - `calculateGroupDebt` function (line ~1660)
3. `App.tsx` - `simplifiedDebts` calculation (line ~1725)
4. `components/BalanceSummary.tsx` - Balance display (line ~68)
5. `components/SettleUpModal.tsx` - Debt simplification (line ~22)
6. `components/GroupsScreen.tsx` - Group stats (line ~117)
7. `components/GroupFinancialSummary.tsx` - Financial summary (uses balances prop)

All locations now handle payment expenses correctly with the special case:
```typescript
const isPayment = expense.category === 'Payment';
if (payerInGroup && expense.splits && (isPayment ? expense.splits.length >= 1 : expense.splits.length >= 2)) {
  // Process expense
}
```

## Testing Checklist

- [ ] Create group with multiple members
- [ ] Add expense split between 2+ people
- [ ] Verify balances calculate correctly
- [ ] Record payment between two members
- [ ] Verify payment affects balances correctly
- [ ] Invite user via email
- [ ] Verify invited user can see group after signup
- [ ] Verify invited user can see their balance
- [ ] Verify invited user can record payments
- [ ] Verify financial summary shows correct totals
- [ ] Verify "Mark As Paid" works without payment info
- [ ] Verify "Pay" button works with payment info

