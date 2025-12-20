import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
];

const CurrencyConverterModal: React.FC<CurrencyConverterModalProps> = ({ isOpen, onClose }) => {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Free API endpoint (no key required for basic usage)
  const fetchExchangeRate = async (from: string, to: string) => {
    if (from === to) {
      setExchangeRate(1);
      setConvertedAmount(parseFloat(amount) || 0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Using exchangerate-api.com free tier (no API key needed for basic usage)
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      const data = await response.json();
      
      if (data.rates && data.rates[to]) {
        const rate = data.rates[to];
        setExchangeRate(rate);
        setLastUpdated(new Date());
        
        if (amount) {
          setConvertedAmount(parseFloat(amount) * rate);
        }
      } else {
        setError('Exchange rate not available');
      }
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
      setError('Failed to fetch exchange rate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && fromCurrency && toCurrency) {
      fetchExchangeRate(fromCurrency, toCurrency);
    }
  }, [isOpen, fromCurrency, toCurrency]);

  useEffect(() => {
    if (amount && exchangeRate !== null) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        setConvertedAmount(numAmount * exchangeRate);
      } else {
        setConvertedAmount(null);
      }
    } else {
      setConvertedAmount(null);
    }
  }, [amount, exchangeRate]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmount('');
    setConvertedAmount(null);
  };

  const fromCurrencyInfo = CURRENCIES.find(c => c.code === fromCurrency);
  const toCurrencyInfo = CURRENCIES.find(c => c.code === toCurrency);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
              💱 Currency Converter
            </h3>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Convert between currencies instantly
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* From Currency */}
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              From
            </label>
            <div className="flex gap-2">
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-xl text-charcoal dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSwap}
              className="p-2 rounded-full bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
              title="Swap currencies"
            >
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </motion.button>
          </div>

          {/* To Currency */}
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              To
            </label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-xl text-charcoal dark:text-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal dark:text-gray-300 font-semibold">
                {fromCurrencyInfo?.symbol}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700 border-2 border-stone-200 dark:border-gray-600 rounded-xl text-charcoal dark:text-gray-100 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Converted Amount */}
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">Loading exchange rate...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : convertedAmount !== null && amount ? (
            <div className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-xl border-2 border-primary/20 dark:border-primary/30">
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">Converted Amount</p>
              <p className="text-3xl font-extrabold text-primary dark:text-primary-300">
                {toCurrencyInfo?.symbol} {convertedAmount.toFixed(2)}
              </p>
              {exchangeRate !== null && exchangeRate !== 1 && (
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                  1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                </p>
              )}
              {lastUpdated && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Rate updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Source: <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">exchangerate-api.com</a>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-5 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-stone-200 dark:border-gray-600">
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center">
                Enter an amount to convert
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CurrencyConverterModal;
