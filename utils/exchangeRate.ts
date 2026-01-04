/**
 * Exchange Rate Utilities
 * Fetches exchange rates from exchangerate-api.com (free tier, no API key needed)
 */

export interface ExchangeRateResult {
  rate: number;
  date: string; // ISO date string
  source: string;
}

/**
 * Fetch exchange rate from API
 * Uses exchangerate-api.com free tier (no API key required)
 */
export async function fetchExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<ExchangeRateResult> {
  // Same currency - no conversion needed
  if (fromCurrency === toCurrency) {
    return {
      rate: 1,
      date: new Date().toISOString(),
      source: 'same-currency',
    };
  }

  try {
    // Using exchangerate-api.com free tier (no API key needed for basic usage)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.rates || !data.rates[toCurrency]) {
      throw new Error(`Exchange rate not available for ${toCurrency}`);
    }

    const rate = data.rates[toCurrency];
    const date = data.date || new Date().toISOString().split('T')[0];

    return {
      rate,
      date,
      source: 'exchangerate-api.com',
    };
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw new Error(
      `Failed to fetch exchange rate: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert amount from one currency to another
 */
export function convertAmount(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  return amount * exchangeRate;
}

/**
 * Cache exchange rates for the same day to avoid repeated API calls
 */
const rateCache = new Map<string, { rate: number; date: string; timestamp: number }>();

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function getCachedExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<ExchangeRateResult> {
  const cacheKey = `${fromCurrency}-${toCurrency}`;
  const cached = rateCache.get(cacheKey);
  const now = Date.now();

  // Return cached rate if it's still valid (same day)
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return {
      rate: cached.rate,
      date: cached.date,
      source: 'cache',
    };
  }

  // Fetch new rate
  const result = await fetchExchangeRate(fromCurrency, toCurrency);
  
  // Cache the result
  rateCache.set(cacheKey, {
    rate: result.rate,
    date: result.date,
    timestamp: now,
  });

  return result;
}
