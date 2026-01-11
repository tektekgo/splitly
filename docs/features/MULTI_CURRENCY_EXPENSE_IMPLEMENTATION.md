# Multi-Currency Expense Implementation

**Date:** January 4, 2026  
**Status:** ✅ Complete  
**Feature:** Multi-Currency Expense Support

## Overview

Users can now enter expenses in different currencies within the same group. The system automatically converts expenses to the group's base currency for balance calculations, while preserving the original currency information for transparency.

---

## Implementation Summary

### 1. Data Model Updates

**Updated `FinalExpense` Interface (`types.ts`):**
```typescript
export interface FinalExpense {
  // Existing fields...
  amount: number;              // Converted to group currency (base currency)
  currency: string;            // Group currency (base currency)
  
  // New multi-currency fields (optional)
  originalAmount?: number;      // Amount entered by user in original currency
  originalCurrency?: string;    // Currency in which expense was entered
  exchangeRate?: number;        // Exchange rate used for conversion
  rateDate?: string;           // Date when exchange rate was fetched/used
  rateSource?: 'auto' | 'manual'; // How the exchange rate was obtained
}
```

**Key Points:**
- `amount` is always in group currency (for balance calculations)
- `originalAmount` and `originalCurrency` only present if different from group currency
- Exchange rate stored for historical accuracy
- Backward compatible (existing expenses work without changes)

---

### 2. Exchange Rate API Integration

**New File: `utils/exchangeRate.ts`**

**Features:**
- Fetches rates from `exchangerate-api.com` (free tier, no API key needed)
- Automatic caching (24-hour cache to avoid repeated API calls)
- Manual override support
- Error handling with fallback

**Functions:**
- `fetchExchangeRate(fromCurrency, toCurrency)` - Fetches current rate
- `getCachedExchangeRate(fromCurrency, toCurrency)` - Uses cache when possible
- `convertAmount(amount, fromCurrency, toCurrency, rate)` - Converts amount

---

### 3. Expense Form Updates

**Updated: `components/AddExpenseForm.tsx`**

**New Features:**
1. **Currency Selection:**
   - Defaults to group currency
   - User can select any ISO 4217 currency
   - Currency selector dropdown

2. **Exchange Rate Display:**
   - Auto-fetches rate when currency changes
   - Shows: "1 CRC = 0.0018 USD"
   - Displays rate date
   - Loading state while fetching

3. **Manual Rate Override:**
   - Toggle: "Enter Manually" / "Use Auto Rate"
   - Allows user to enter custom exchange rate
   - Useful for historical rates or specific rates

4. **Converted Amount Preview:**
   - Shows converted amount in group currency
   - Updates in real-time as user types
   - Clear indication: "This amount will be used for balance calculations"

5. **Split Amount Calculation:**
   - Splits calculated using converted amount (group currency)
   - All split participants see amounts in group currency

**UI Flow:**
```
┌─────────────────────────────────────────────┐
│ Amount: [50000] [CRC ▼]                     │
│                                             │
│ Exchange Rate (CRC → USD)                   │
│ 1 CRC = 0.0018 USD                          │
│ Rate date: Jan 4, 2025                      │
│ [Use Auto Rate] [Enter Manually]            │
│                                             │
│ Converted Amount (USD):                     │
│ $90.00 USD                                  │
│ This amount will be used for balance calc   │
└─────────────────────────────────────────────┘
```

---

### 4. Expense Display Updates

**Updated Components:**
- `components/ExpenseItem.tsx` - Expense list items
- `components/ExpenseDetailModal.tsx` - Expense detail view
- `components/BalanceDetailModal.tsx` - Balance breakdown
- `App.tsx` - Dashboard expense preview

**Display Format:**
- **Base currency first:** `$90.00 USD`
- **Original currency in brackets:** `(₡50,000 CRC)`
- **Full format:** `$90.00 USD (₡50,000 CRC)`

**Example:**
```
Dinner at restaurant
$90.00 USD (₡50,000 CRC) • Jan 4
Paid by: You • Split: Equal
```

**Expense Detail Modal:**
- Shows both amounts prominently
- Displays exchange rate information
- Shows rate date and source (auto/manual)

---

### 5. Balance Calculations

**No Changes Required:**
- Balances already calculated using `expense.amount`
- `expense.amount` is always in group currency
- All calculations work correctly with converted amounts

**Key Points:**
- All expenses converted to group currency before calculation
- Balances always displayed in group currency
- Original currency preserved for transparency
- Historical exchange rates maintained (don't change with current rates)

---

### 6. Currency Formatter Updates

**New Function: `formatExpenseAmount()`**

**Location:** `utils/currencyFormatter.ts`

**Purpose:** Formats expense amounts with original currency in brackets

**Usage:**
```typescript
formatExpenseAmount(expense)
// Returns: "$90.00 USD (₡50,000 CRC)" or "$90.00 USD"
```

**Logic:**
- If `originalCurrency` exists and differs from `currency`, show both
- Otherwise, show only base currency amount

---

## User Experience

### Creating Multi-Currency Expense

1. **User enters amount:** `50000`
2. **User selects currency:** `CRC` (Costa Rican Colón)
3. **System auto-fetches rate:** `1 CRC = 0.0018 USD`
4. **System calculates:** `50000 CRC = 90 USD`
5. **User can:**
   - Accept auto-conversion
   - Manually edit exchange rate
   - See both amounts displayed
6. **User saves expense**
7. **Expense stored with:**
   - `amount: 90` (USD - group currency)
   - `currency: "USD"` (group currency)
   - `originalAmount: 50000` (CRC)
   - `originalCurrency: "CRC"`
   - `exchangeRate: 0.0018`
   - `rateDate: "2026-01-04"`
   - `rateSource: "auto"`

### Viewing Multi-Currency Expense

- **Expense List:** Shows `$90.00 USD (₡50,000 CRC)`
- **Expense Detail:** Shows both amounts with exchange rate info
- **Balance Calculations:** Uses `$90.00 USD` (converted amount)

---

## Technical Details

### Exchange Rate API

**Provider:** `exchangerate-api.com`
- Free tier (no API key required)
- Rate limits: 1500 requests/month (free)
- Updates: Daily
- Caching: 24 hours (to avoid repeated calls)

**Fallback:** Manual entry if API fails

### Data Storage

**Firestore Structure:**
```javascript
{
  amount: 90,                    // Always in group currency
  currency: "USD",               // Group currency
  originalAmount: 50000,         // Only if different currency
  originalCurrency: "CRC",       // Only if different currency
  exchangeRate: 0.0018,          // Only if different currency
  rateDate: "2026-01-04",        // Only if different currency
  rateSource: "auto"             // "auto" or "manual"
}
```

### Backward Compatibility

- Existing expenses work without changes
- If `originalCurrency` is missing, expense treated as single-currency
- Migration not needed (new fields are optional)

---

## Files Modified

### New Files
- `utils/exchangeRate.ts` - Exchange rate fetching and caching

### Modified Files
- `types.ts` - Added multi-currency fields to `FinalExpense`
- `utils/currencyFormatter.ts` - Added `formatExpenseAmount()` function
- `components/AddExpenseForm.tsx` - Added currency selection and conversion UI
- `components/ExpenseItem.tsx` - Updated to show both amounts
- `components/ExpenseDetailModal.tsx` - Updated to show both amounts and rate info
- `components/BalanceDetailModal.tsx` - Updated currency formatting
- `App.tsx` - Updated expense display and notifications

---

## Testing Checklist

- [x] Can select different currency when creating expense
- [x] Exchange rate auto-fetches when currency changes
- [x] Can manually override exchange rate
- [x] Converted amount displays correctly
- [x] Expense saves with both original and converted amounts
- [x] Expense list shows both amounts
- [x] Expense detail shows both amounts and rate info
- [x] Balances calculated correctly (using converted amounts)
- [x] Splits calculated in group currency
- [x] Backward compatible with existing expenses

---

## Example Use Case: Costa Rica Trip

**Scenario:**
- Group currency: `USD`
- Expense 1: Dinner paid in `CRC` (50,000 CRC)
- Expense 2: Taxi paid in `USD` ($15 USD)

**Flow:**
1. User creates expense: `50000` in `CRC`
2. System converts: `50,000 CRC = $90 USD` (rate: 0.0018)
3. Expense saved with both amounts
4. User creates expense: `15` in `USD`
5. Expense saved normally (no conversion needed)

**Display:**
- Expense 1: `$90.00 USD (₡50,000 CRC)`
- Expense 2: `$15.00 USD`

**Balances:**
- All calculated in `USD` (group currency)
- "You owe $45.00 USD" (regardless of original currency)

---

## Future Enhancements

Potential improvements (not implemented):
- Historical exchange rates (use rate from expense date)
- Bulk currency conversion for existing expenses
- Exchange rate alerts/notifications
- Currency conversion in expense editing
- Export with original currencies preserved

---

## Summary

✅ **Complete Implementation:**
- Multi-currency expense entry
- Automatic exchange rate fetching
- Manual rate override
- Dual-currency display
- Balance calculations in base currency
- Full ISO 4217 currency support (170+ currencies)

**User Benefits:**
- Enter expenses in any currency
- Automatic conversion to group currency
- Transparent display of both amounts
- Accurate balance calculations
- Historical rate preservation
