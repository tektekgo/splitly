export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

// Popular currencies with their symbols and decimal places
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimals: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimals: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimals: 2 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimals: 2 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimals: 2 },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimals: 2 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimals: 0 },
];

// Default currency
export const DEFAULT_CURRENCY = 'USD';

/**
 * Get currency information by code
 */
export function getCurrency(code: string): Currency | null {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code) || null;
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(code: string): string {
  const currency = getCurrency(code);
  return currency ? currency.symbol : '$';
}

/**
 * Get all supported currencies
 */
export function getCurrencyList(): Currency[] {
  return [...SUPPORTED_CURRENCIES];
}

/**
 * Format amount with currency symbol and proper decimals
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  if (!currency) {
    // Fallback to USD if currency not found
    return `$${amount.toFixed(2)}`;
  }

  const formattedAmount = amount.toFixed(currency.decimals);
  
  // Handle different symbol positions for different currencies
  switch (currency.code) {
    case 'USD':
    case 'CAD':
    case 'AUD':
    case 'SGD':
    case 'BRL':
    case 'MXN':
      return `${currency.symbol}${formattedAmount}`;
    case 'EUR':
    case 'GBP':
    case 'CHF':
    case 'SEK':
    case 'NOK':
    case 'DKK':
    case 'PLN':
    case 'CZK':
    case 'HUF':
    case 'ZAR':
    case 'THB':
    case 'MYR':
    case 'PHP':
      return `${formattedAmount} ${currency.symbol}`;
    case 'INR':
    case 'JPY':
    case 'CNY':
    case 'KRW':
    case 'IDR':
    case 'VND':
      return `${currency.symbol}${formattedAmount}`;
    default:
      return `${currency.symbol}${formattedAmount}`;
  }
}

/**
 * Format amount without currency symbol (for inputs, calculations)
 */
export function formatAmount(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  const decimals = currency ? currency.decimals : 2;
  return amount.toFixed(decimals);
}

/**
 * Parse formatted currency string back to number
 */
export function parseCurrencyAmount(formattedAmount: string, currencyCode: string): number {
  const currency = getCurrency(currencyCode);
  if (!currency) return parseFloat(formattedAmount.replace(/[^\d.-]/g, '')) || 0;
  
  // Remove currency symbol and any non-numeric characters except decimal point
  const cleanAmount = formattedAmount.replace(new RegExp(`[^\\d.-]`, 'g'), '');
  return parseFloat(cleanAmount) || 0;
}

/**
 * Validate currency code
 */
export function isValidCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.some(currency => currency.code === code);
}

/**
 * Get display name for currency (e.g., "USD - US Dollar")
 */
export function getCurrencyDisplayName(code: string): string {
  const currency = getCurrency(code);
  return currency ? `${currency.code} - ${currency.name}` : code;
}
