export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

// Complete ISO 4217 currency list with symbols and decimal places
// Organized by popularity/common usage, then alphabetically
export const SUPPORTED_CURRENCIES: Currency[] = [
  // Most Popular (shown first in selectors)
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2 },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2 },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2 },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0 },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimals: 2 },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2 },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimals: 2 },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimals: 2 },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimals: 2 },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimals: 2 },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimals: 2 },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimals: 2 },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2 },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2 },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0 },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimals: 2 },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimals: 0 },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimals: 2 },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimals: 2 },
  
  // Additional ISO 4217 Currencies (Alphabetically by code)
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2 },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', decimals: 2 },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', decimals: 2 },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏', decimals: 2 },
  { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'ƒ', decimals: 2 },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', decimals: 2 },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimals: 2 },
  { code: 'AWG', name: 'Aruban Florin', symbol: 'ƒ', decimals: 2 },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', decimals: 2 },
  { code: 'BAM', name: 'Bosnia-Herzegovina Convertible Mark', symbol: 'КМ', decimals: 2 },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: '$', decimals: 2 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', decimals: 2 },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', decimals: 2 },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', decimals: 3 },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'Fr', decimals: 0 },
  { code: 'BMD', name: 'Bermudian Dollar', symbol: '$', decimals: 2 },
  { code: 'BND', name: 'Brunei Dollar', symbol: '$', decimals: 2 },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.', decimals: 2 },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: '$', decimals: 2 },
  { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.', decimals: 2 },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', decimals: 2 },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', decimals: 2 },
  { code: 'BZD', name: 'Belize Dollar', symbol: '$', decimals: 2 },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'Fr', decimals: 2 },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', decimals: 0 },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', decimals: 2 },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡', decimals: 2 },
  { code: 'CUP', name: 'Cuban Peso', symbol: '$', decimals: 2 },
  { code: 'CVE', name: 'Cape Verdean Escudo', symbol: '$', decimals: 2 },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fr', decimals: 0 },
  { code: 'DOP', name: 'Dominican Peso', symbol: '$', decimals: 2 },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', decimals: 2 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', decimals: 2 },
  { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', decimals: 2 },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', decimals: 2 },
  { code: 'FJD', name: 'Fijian Dollar', symbol: '$', decimals: 2 },
  { code: 'FKP', name: 'Falkland Islands Pound', symbol: '£', decimals: 2 },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾', decimals: 2 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', decimals: 2 },
  { code: 'GIP', name: 'Gibraltar Pound', symbol: '£', decimals: 2 },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', decimals: 2 },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'Fr', decimals: 0 },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q', decimals: 2 },
  { code: 'GYD', name: 'Guyanese Dollar', symbol: '$', decimals: 2 },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L', decimals: 2 },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn', decimals: 2 },
  { code: 'HTG', name: 'Haitian Gourde', symbol: 'G', decimals: 2 },
  { code: 'ILS', name: 'Israeli New Shekel', symbol: '₪', decimals: 2 },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د', decimals: 3 },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼', decimals: 2 },
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr', decimals: 0 },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: '$', decimals: 2 },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', decimals: 3 },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'Sh', decimals: 2 },
  { code: 'KGS', name: 'Kyrgystani Som', symbol: 'с', decimals: 2 },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', decimals: 2 },
  { code: 'KMF', name: 'Comorian Franc', symbol: 'Fr', decimals: 0 },
  { code: 'KPW', name: 'North Korean Won', symbol: '₩', decimals: 2 },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', decimals: 3 },
  { code: 'KYD', name: 'Cayman Islands Dollar', symbol: '$', decimals: 2 },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', decimals: 2 },
  { code: 'LAK', name: 'Laotian Kip', symbol: '₭', decimals: 2 },
  { code: 'LBP', name: 'Lebanese Pound', symbol: '£', decimals: 2 },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', decimals: 2 },
  { code: 'LRD', name: 'Liberian Dollar', symbol: '$', decimals: 2 },
  { code: 'LSL', name: 'Lesotho Loti', symbol: 'L', decimals: 2 },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', decimals: 3 },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', decimals: 2 },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L', decimals: 2 },
  { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', decimals: 2 },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден', decimals: 2 },
  { code: 'MMK', name: 'Myanma Kyat', symbol: 'K', decimals: 2 },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', decimals: 2 },
  { code: 'MOP', name: 'Macanese Pataca', symbol: 'P', decimals: 2 },
  { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'UM', decimals: 2 },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', decimals: 2 },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', decimals: 2 },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', decimals: 2 },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', decimals: 2 },
  { code: 'NAD', name: 'Namibian Dollar', symbol: '$', decimals: 2 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 2 },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$', decimals: 2 },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', decimals: 2 },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', decimals: 3 },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.', decimals: 2 },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', decimals: 2 },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K', decimals: 2 },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', decimals: 2 },
  { code: 'PYG', name: 'Paraguayan Guaraní', symbol: '₲', decimals: 0 },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', decimals: 2 },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', decimals: 2 },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин', decimals: 2 },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'Fr', decimals: 0 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', decimals: 2 },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: '$', decimals: 2 },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨', decimals: 2 },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.', decimals: 2 },
  { code: 'SHP', name: 'Saint Helena Pound', symbol: '£', decimals: 2 },
  { code: 'SLE', name: 'Sierra Leonean Leone', symbol: 'Le', decimals: 2 },
  { code: 'SLL', name: 'Sierra Leonean Leone (Old)', symbol: 'Le', decimals: 2 },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh', decimals: 2 },
  { code: 'SRD', name: 'Surinamese Dollar', symbol: '$', decimals: 2 },
  { code: 'SSP', name: 'South Sudanese Pound', symbol: '£', decimals: 2 },
  { code: 'STN', name: 'São Tomé and Príncipe Dobra', symbol: 'Db', decimals: 2 },
  { code: 'SYP', name: 'Syrian Pound', symbol: '£', decimals: 2 },
  { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'L', decimals: 2 },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'ЅМ', decimals: 2 },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'm', decimals: 2 },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', decimals: 3 },
  { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', decimals: 2 },
  { code: 'TTD', name: 'Trinidad and Tobago Dollar', symbol: '$', decimals: 2 },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$', decimals: 2 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'Sh', decimals: 2 },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', decimals: 2 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'Sh', decimals: 0 },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$', decimals: 2 },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'so\'m', decimals: 2 },
  { code: 'VED', name: 'Venezuelan Bolívar Soberano', symbol: 'Bs.S', decimals: 2 },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs.', decimals: 2 },
  { code: 'WST', name: 'Samoan Tala', symbol: 'T', decimals: 2 },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'Fr', decimals: 0 },
  { code: 'XCD', name: 'East Caribbean Dollar', symbol: '$', decimals: 2 },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'Fr', decimals: 0 },
  { code: 'XPF', name: 'CFP Franc', symbol: 'Fr', decimals: 0 },
  { code: 'YER', name: 'Yemeni Rial', symbol: '﷼', decimals: 2 },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', decimals: 2 },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: '$', decimals: 2 },
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
 * Handles prefix/suffix positioning based on currency conventions
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = getCurrency(currencyCode);
  if (!currency) {
    // Fallback to USD if currency not found
    return `$${amount.toFixed(2)}`;
  }

  const formattedAmount = amount.toFixed(currency.decimals);
  
  // Currencies with symbol prefix (before amount)
  const prefixCurrencies = [
    'USD', 'CAD', 'AUD', 'SGD', 'BRL', 'MXN', 'BBD', 'BMD', 'BSD', 'BZD', 
    'CLP', 'COP', 'CUP', 'DOP', 'FJD', 'GYD', 'JMD', 'KYD', 'LRD', 'NAD', 
    'NIO', 'SBD', 'SRD', 'TTD', 'TWD', 'UYU', 'XCD', 'ZWL',
    'INR', 'JPY', 'CNY', 'KRW', 'IDR', 'VND', 'CRC', 'ILS', 'PHP', 'THB',
    'AED', 'AFN', 'ALL', 'AMD', 'AZN', 'BDT', 'BGN', 'BHD', 'BND', 'BTN',
    'BYN', 'CDF', 'CVE', 'DJF', 'DZD', 'EGP', 'ERN', 'ETB', 'FKP', 'GEL',
    'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'HNL', 'HTG', 'IQD', 'IRR', 'ISK',
    'JOD', 'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KWD', 'KZT', 'LAK', 'LBP',
    'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT',
    'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MZN', 'NGN', 'NPR', 'OMR', 'PAB',
    'PEN', 'PGK', 'PKR', 'PYG', 'QAR', 'RSD', 'RWF', 'SAR', 'SCR', 'SDG',
    'SHP', 'SLE', 'SLL', 'SOS', 'SSP', 'STN', 'SYP', 'SZL', 'TJS', 'TMT',
    'TND', 'TOP', 'TZS', 'UAH', 'UGX', 'UZS', 'VED', 'VES', 'WST', 'XAF',
    'XOF', 'XPF', 'YER', 'ZMW'
  ];
  
  // Currencies with symbol suffix (after amount)
  const suffixCurrencies = [
    'EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ZAR',
    'MYR', 'RUB', 'TRY', 'RON', 'HRK', 'BAM', 'MKD', 'RSD', 'BGN', 'GEL',
    'UAH', 'BYN', 'KZT', 'KGS', 'TJS', 'TMT', 'UZS', 'AZN', 'AMD', 'GEL',
    'MDL', 'MNT', 'MOP', 'PGK', 'SBD', 'TOP', 'WST', 'FJD', 'XPF'
  ];
  
  if (prefixCurrencies.includes(currency.code)) {
    return `${currency.symbol}${formattedAmount}`;
  } else if (suffixCurrencies.includes(currency.code)) {
    return `${formattedAmount} ${currency.symbol}`;
  } else {
    // Default: prefix
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

/**
 * Format expense amount with original currency in brackets if different from base currency
 * Example: "$90.00 USD (50,000 CRC)" or "$90.00 USD"
 */
export function formatExpenseAmount(
  expense: { amount: number; currency: string; originalAmount?: number; originalCurrency?: string }
): string {
  const baseAmount = formatCurrency(expense.amount, expense.currency);
  
  // If expense was entered in different currency, show original in brackets
  if (expense.originalAmount && expense.originalCurrency && expense.originalCurrency !== expense.currency) {
    const originalAmount = formatCurrency(expense.originalAmount, expense.originalCurrency);
    return `${baseAmount} (${originalAmount})`;
  }
  
  return baseAmount;
}
