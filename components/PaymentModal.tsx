import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { User } from '../types';
import { formatCurrency } from '../utils/currencyFormatter';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromUser: User;
  toUser: User;
  amount: number;
  currency: string;
  onMarkAsPaid: () => void;
}

type PaymentMethod = 'venmo' | 'zelle' | 'cashApp' | 'manual';

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  fromUser,
  toUser,
  amount,
  currency,
  onMarkAsPaid,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const paymentInfo = toUser.paymentInfo || {};
  const hasPaymentInfo = !!(paymentInfo.venmo || paymentInfo.zelle || paymentInfo.cashApp);

  // Deep link functions
  const openVenmo = () => {
    if (!paymentInfo.venmo) return;
    const note = encodeURIComponent(`SplitBi: ${fromUser.name.replace(' (You)', '')} → ${toUser.name.replace(' (You)', '')}`);
    const venmoUrl = `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(paymentInfo.venmo)}&amount=${amount.toFixed(2)}&note=${note}`;
    
    // Try deep link, fallback to web
    window.location.href = venmoUrl;
    setTimeout(() => {
      window.open(`https://venmo.com/${paymentInfo.venmo}?txn=pay&amount=${amount.toFixed(2)}&note=${note}`, '_blank');
    }, 500);
  };

  const openZelle = () => {
    if (!paymentInfo.zelle) return;
    // Zelle doesn't have a reliable deep link, so we'll copy details
    const zelleDetails = `Send ${formatCurrency(amount, currency)} to ${toUser.name.replace(' (You)', '')} via Zelle\nEmail/Phone: ${paymentInfo.zelle}`;
    navigator.clipboard.writeText(zelleDetails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    // Try to open Zelle app (iOS/Android)
    const zelleUrl = `zellepay://send?amount=${amount.toFixed(2)}&recipient=${encodeURIComponent(paymentInfo.zelle)}`;
    window.location.href = zelleUrl;
  };

  const openCashApp = () => {
    if (!paymentInfo.cashApp) return;
    const cashAppUrl = `cashme://send?amount=${amount.toFixed(2)}&cashtag=${encodeURIComponent(paymentInfo.cashApp.replace('$', ''))}`;
    
    // Try deep link, fallback to web
    window.location.href = cashAppUrl;
    setTimeout(() => {
      window.open(`https://cash.app/$${paymentInfo.cashApp.replace('$', '')}`, '_blank');
    }, 500);
  };

  const copyPaymentDetails = () => {
    const details = `Payment Details:\nFrom: ${fromUser.name.replace(' (You)', '')}\nTo: ${toUser.name.replace(' (You)', '')}\nAmount: ${formatCurrency(amount, currency)}\n\nPayment Methods:\n${paymentInfo.venmo ? `Venmo: ${paymentInfo.venmo}\n` : ''}${paymentInfo.zelle ? `Zelle: ${paymentInfo.zelle}\n` : ''}${paymentInfo.cashApp ? `Cash App: ${paymentInfo.cashApp}\n` : ''}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(details).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = details;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = details;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-stone-100 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-charcoal dark:text-gray-100">Pay {toUser.name.replace(' (You)', '')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-primary dark:text-primary-400 mb-2">
              {formatCurrency(amount, currency)}
            </p>
            <p className="text-sm text-sage dark:text-gray-400">
              {fromUser.name.replace(' (You)', '')} → {toUser.name.replace(' (You)', '')}
            </p>
          </div>
        </div>

        <div className="p-6">
          {hasPaymentInfo ? (
            <div className="space-y-3">
              {paymentInfo.venmo && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={openVenmo}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#3D95CE] hover:bg-[#2d7bb3] text-white font-semibold rounded-xl transition-colors"
                >
                  <span className="text-xl">💙</span>
                  <span>Pay with Venmo</span>
                </motion.button>
              )}

              {paymentInfo.zelle && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={openZelle}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#6C1D45] hover:bg-[#5a1838] text-white font-semibold rounded-xl transition-colors"
                >
                  <span className="text-xl">💜</span>
                  <span>Pay with Zelle</span>
                </motion.button>
              )}

              {paymentInfo.cashApp && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={openCashApp}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#00D632] hover:bg-[#00b828] text-white font-semibold rounded-xl transition-colors"
                >
                  <span className="text-xl">💚</span>
                  <span>Pay with Cash App</span>
                </motion.button>
              )}

              <div className="pt-2 border-t border-stone-200 dark:border-gray-700">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={copyPaymentDetails}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-sage dark:text-gray-400 hover:text-charcoal dark:hover:text-gray-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Payment Details</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-sage dark:text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-charcoal dark:text-gray-200 mb-1">
                  {toUser.name.replace(' (You)', '')} hasn't set up payment info yet
                </p>
                <p className="text-xs text-sage dark:text-gray-400">
                  Ask them to add their Venmo, Zelle, or Cash App info in their Profile
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={copyPaymentDetails}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 text-primary font-semibold rounded-xl transition-colors"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Payment Details</span>
                  </>
                )}
              </motion.button>
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-stone-200 dark:border-gray-600 rounded-b-2xl">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onMarkAsPaid();
              onClose();
            }}
            className="w-full px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Mark As Paid
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentModal;

