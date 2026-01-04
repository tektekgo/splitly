# Currency Enhancement Discussion

## Current State

### What We Have Now:
1. **Per-Group Currency**: Each group has one currency (set at creation)
2. **Expense Currency**: Expenses inherit the group's currency automatically
3. **Supported Currencies**: 25 currencies in `SUPPORTED_CURRENCIES`
4. **Currency Converter**: 15 currencies (hardcoded, separate from main list)
5. **Currency Formatting**: Proper symbols, decimal places, positioning

### Current Limitations:
- ❌ Cannot enter expenses in different currencies within the same group
- ❌ No currency conversion at expense level
- ❌ Currency converter has fewer currencies than group selector
- ❌ Missing Costa Rican Colón (CRC) and other travel currencies

---

## Requirement #1: Multi-Currency Expenses Within a Group

### Your Use Case:
**Costa Rica Trip Example:**
- Group currency: USD (base currency for the trip)
- Some expenses paid in: Costa Rican Colón (CRC)
- Some expenses paid in: USD
- Need to convert CRC → USD for balance calculations

### Your Proposed Solution:
> "When setting up expense within a group, allow for user to select the currency of the amount entered, select a conversion currency, and final amount in converted currency"

---

## Clarifying Questions

### 1. Exchange Rate Source
**Question:** How should we get exchange rates?

**Options:**
- **A) Real-time API** (like current converter uses `exchangerate-api.com`)
  - ✅ Always up-to-date
  - ✅ Automatic conversion
  - ⚠️ Requires internet
  - ⚠️ Rates change daily (historical accuracy?)

- **B) Manual Entry**
  - ✅ User controls exact rate used
  - ✅ Works offline
  - ✅ Historical accuracy (use rate from expense date)
  - ⚠️ More user input required

- **C) Hybrid** (Recommended)
  - Auto-fetch current rate as default
  - Allow manual override
  - Store rate used for historical reference

**My Recommendation:** **Option C (Hybrid)**
- Fetch rate automatically when currency selected
- Allow manual edit if user knows exact rate
- Store both: `originalAmount`, `originalCurrency`, `convertedAmount`, `exchangeRate`, `rateDate`

---

### 2. Data Storage
**Question:** What should we store in the database?

**Options:**
- **A) Store Original + Converted**
  ```typescript
  {
    amount: 50000,           // Converted to group currency (USD)
    originalAmount: 50000,   // Original amount entered
    originalCurrency: 'CRC', // Currency entered
    exchangeRate: 0.0018,    // Rate used
    rateDate: '2025-01-04'   // When rate was fetched
  }
  ```

- **B) Store Only Converted**
  ```typescript
  {
    amount: 90,              // Already converted to USD
    // Original currency info lost
  }
  ```

- **C) Store Only Original** (calculate on-the-fly)
  ```typescript
  {
    amount: 50000,
    currency: 'CRC',
    // Convert when displaying/calculating
  }
  ```

**My Recommendation:** **Option A**
- Preserves original transaction details
- Allows re-calculation if rates change
- Better for accounting/audit trail
- Shows both amounts in UI

---

### 3. UI/UX Flow
**Question:** How should the expense form work?

**Proposed Flow:**
1. User enters amount: `50000`
2. User selects currency: `CRC` (Costa Rican Colón)
3. System auto-fetches rate: `1 CRC = 0.0018 USD`
4. System calculates: `50000 CRC = 90 USD`
5. User can:
   - Accept auto-conversion
   - Manually edit exchange rate
   - See both amounts displayed

**UI Mockup:**
```
┌─────────────────────────────────────┐
│ Amount                               │
│ [50000] [CRC ▼]                     │
│                                      │
│ Exchange Rate                        │
│ [0.0018] (Auto-fetched) [Edit]      │
│ Rate date: Jan 4, 2025              │
│                                      │
│ Converted Amount (Group Currency)    │
│ $90.00 USD                          │
│                                      │
│ [Save Expense]                       │
└─────────────────────────────────────┘
```

**Questions:**
- Should conversion be **automatic** (always convert) or **optional** (toggle)?
- Should we show **both amounts** in expense list? (e.g., "Dinner - 50,000 CRC ($90)")
- Should we allow **editing exchange rate** after expense is saved?

---

### 4. Balance Calculations
**Question:** How should balances work with mixed currencies?

**Current:** All expenses in group currency → simple sum

**With Multi-Currency:**
- All expenses converted to group currency
- Balances calculated in group currency
- Display: "You owe $150 USD" (even if some expenses were in CRC)

**Edge Cases:**
- What if exchange rate changes after expense is saved?
  - **Option A:** Keep original rate (historical accuracy)
  - **Option B:** Re-calculate with new rate (current value)
  
**My Recommendation:** **Option A** (keep original rate)
- Historical accuracy for accounting
- Balances don't change unexpectedly
- Can add "recalculate" option if needed

---

## Requirement #2: Add More Currencies

### Current Status:
- **Group Currency Selector**: 25 currencies
- **Currency Converter**: 15 currencies (hardcoded list)
- **Missing**: Costa Rican Colón (CRC), and potentially others

### Questions:

1. **Which currencies to add?**
   - Costa Rican Colón (CRC) - ✅ Definitely needed
   - Others? (Please list)

2. **Should converter use same list as groups?**
   - **Option A:** Yes, use `SUPPORTED_CURRENCIES` everywhere
   - **Option B:** Converter can have more currencies (for reference)
   - **Option C:** Converter can have fewer (only popular ones)

**My Recommendation:** **Option A**
- Single source of truth (`SUPPORTED_CURRENCIES`)
- Consistent experience
- Easier maintenance

3. **Currency Priority:**
   - Which currencies are most important for your users?
   - Should we add all ISO 4217 currencies, or curated list?

---

## Proposed Implementation Plan

### Phase 1: Add Missing Currencies
1. Add Costa Rican Colón (CRC) to `SUPPORTED_CURRENCIES`
2. Update Currency Converter to use `SUPPORTED_CURRENCIES` (remove hardcoded list)
3. Add any other requested currencies

### Phase 2: Multi-Currency Expense Support
1. **Update Data Model:**
   ```typescript
   interface FinalExpense {
     // Existing fields...
     amount: number;              // Converted to group currency
     currency: string;            // Group currency (for display)
     
     // New fields for multi-currency:
     originalAmount?: number;      // Amount entered by user
     originalCurrency?: string;    // Currency entered by user
     exchangeRate?: number;        // Rate used for conversion
     rateDate?: string;            // Date when rate was fetched/used
     rateSource?: 'auto' | 'manual'; // How rate was obtained
   }
   ```

2. **Update AddExpenseForm:**
   - Add currency selector (defaults to group currency)
   - Add exchange rate input (auto-fetched, editable)
   - Show converted amount preview
   - Add toggle: "Use different currency" (optional)

3. **Update Expense Display:**
   - Show both amounts if different from group currency
   - Format: "Dinner - 50,000 CRC ($90 USD)"
   - Show exchange rate info on hover/click

4. **Update Balance Calculations:**
   - Use converted amount (already in group currency)
   - No changes needed to calculation logic

5. **Update Currency Converter:**
   - Use same currency list as groups
   - Add "Use in expense" button (copy rate to expense form)

---

## Suggested UI Flow

### Expense Form with Currency Conversion:

```
┌─────────────────────────────────────────────┐
│ Add Expense                                  │
├─────────────────────────────────────────────┤
│ Description: [Dinner at restaurant    ]     │
│                                             │
│ Amount: [50000] [CRC ▼]                     │
│                                             │
│ ☑ Use different currency (toggle)          │
│                                             │
│ Exchange Rate:                              │
│ [0.0018] USD per CRC                        │
│ [Auto-fetched] [Edit manually]             │
│ Rate date: Jan 4, 2025                      │
│                                             │
│ Converted Amount (Group Currency):          │
│ $90.00 USD                                  │
│                                             │
│ [Rest of form: date, category, splits...]   │
└─────────────────────────────────────────────┘
```

### Expense List Display:

```
┌─────────────────────────────────────────────┐
│ Expenses                                     │
├─────────────────────────────────────────────┤
│ Dinner at restaurant                        │
│ 50,000 CRC ($90.00 USD) • Jan 4             │
│ Paid by: You • Split: Equal                │
│                                             │
│ Taxi ride                                   │
│ $15.00 USD • Jan 4                         │
│ Paid by: Sarah • Split: Equal              │
└─────────────────────────────────────────────┘
```

---

## Technical Considerations

### 1. Exchange Rate API
- **Current:** `exchangerate-api.com` (free tier, no key needed)
- **Limitations:** 
  - Rate limits (1500 requests/month free)
  - May need API key for production
- **Alternative:** `fixer.io`, `currencylayer.com`, `openexchangerates.org`

### 2. Rate Caching
- Cache rates for same day (avoid repeated API calls)
- Store rates with expenses (historical accuracy)
- Allow manual override

### 3. Backward Compatibility
- Existing expenses: `originalCurrency = group.currency`, `exchangeRate = 1`
- Migration: Not needed (new fields are optional)

---

## Questions for You

1. **Exchange Rate Source:**
   - ✅ Auto-fetch with manual override? (Recommended)
   - Or manual entry only?
   - Or auto-fetch only?

2. **Currency Selection:**
   - Should it be **always visible** or **toggle/optional**?
   - Default to group currency, allow change?

3. **Display:**
   - Show both amounts in expense list? (e.g., "50,000 CRC ($90)")
   - Or only converted amount with original on hover?

4. **Additional Currencies:**
   - Which currencies to add besides CRC?
   - Full list or specific ones?

5. **Exchange Rate Updates:**
   - Keep original rate (historical) or allow re-calculation?

6. **Priority:**
   - Which should we implement first?
     - A) Add more currencies
     - B) Multi-currency expense support
     - C) Both together

---

## My Recommendations

1. **Start with adding currencies** (easier, immediate value)
2. **Then implement multi-currency expenses** (more complex)
3. **Use hybrid exchange rate** (auto-fetch + manual override)
4. **Store both original and converted** (better audit trail)
5. **Show both amounts in UI** (transparency)

What are your thoughts? Let's discuss and finalize the approach!
