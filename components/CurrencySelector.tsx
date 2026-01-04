import React from 'react';
import { getCurrencyList, getCurrencyDisplayName, DEFAULT_CURRENCY } from '../utils/currencyFormatter';

interface CurrencySelectorProps {
  value: string;
  onChange: (currencyCode: string) => void;
  disabled?: boolean;
  className?: string;
  showPopularFirst?: boolean;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
  showPopularFirst = true,
}) => {
  const currencies = getCurrencyList();

  // Popular currencies to show first
  const popularCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY'];

  // Sort currencies with popular ones first if requested
  const sortedCurrencies = showPopularFirst
    ? [
        ...currencies.filter(c => popularCurrencies.includes(c.code)),
        ...currencies
          .filter(c => !popularCurrencies.includes(c.code))
          .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically by currency name
      ]
    : currencies.sort((a, b) => a.name.localeCompare(b.name)); // Always sort alphabetically when not showing popular first

  return (
    <select
      value={value || DEFAULT_CURRENCY}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`block w-full pl-3 pr-10 py-2 bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${className}`}
    >
      {showPopularFirst && (
        <>
          {sortedCurrencies
            .filter(currency => popularCurrencies.includes(currency.code))
            .map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code} - {currency.name}
              </option>
            ))}
          <option disabled className="text-gray-400">────────────</option>
          {sortedCurrencies
            .filter(currency => !popularCurrencies.includes(currency.code))
            .map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code} - {currency.name}
              </option>
            ))}
        </>
      )}
      {!showPopularFirst && sortedCurrencies.map((currency) => (
        <option key={currency.code} value={currency.code}>
          {currency.symbol} {currency.code} - {currency.name}
        </option>
      ))}
    </select>
  );
};

export default CurrencySelector;
