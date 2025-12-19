/**
 * Enhanced Error Logging for Production Debugging
 * 
 * This utility helps track and debug user issues in production
 */

interface ErrorLog {
  timestamp: string;
  userId?: string;
  userEmail?: string;
  action: string;
  error: string;
  details?: any;
  userAgent: string;
  url: string;
}

/**
 * Log errors with context for debugging
 */
export function logError(action: string, error: any, details?: any) {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    userId: getCurrentUserId(),
    userEmail: getCurrentUserEmail(),
    action,
    error: error?.message || String(error),
    details,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // Log to console for development
  console.error('🚨 SplitBI Error:', errorLog);

  // In production, you could send to an external service
  // For now, we'll store in localStorage for debugging
  try {
    const existingLogs = JSON.parse(localStorage.getItem('splitbi-error-logs') || '[]');
    existingLogs.push(errorLog);
    
    // Keep only last 50 errors
    if (existingLogs.length > 50) {
      existingLogs.splice(0, existingLogs.length - 50);
    }
    
    localStorage.setItem('splitbi-error-logs', JSON.stringify(existingLogs));
  } catch (e) {
    console.error('Failed to save error log:', e);
  }
}

/**
 * Get error logs for debugging
 */
export function getErrorLogs(): ErrorLog[] {
  try {
    return JSON.parse(localStorage.getItem('splitbi-error-logs') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear error logs
 */
export function clearErrorLogs() {
  localStorage.removeItem('splitbi-error-logs');
}

/**
 * Export error logs as JSON for sharing
 */
export function exportErrorLogs(): string {
  const logs = getErrorLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Get current user ID (if available)
 */
function getCurrentUserId(): string | undefined {
  try {
    // This will be set by your auth context
    return (window as any).__currentUserId;
  } catch {
    return undefined;
  }
}

/**
 * Get current user email (if available)
 */
function getCurrentUserEmail(): string | undefined {
  try {
    return (window as any).__currentUserEmail;
  } catch {
    return undefined;
  }
}

/**
 * Common error patterns and solutions
 */
export const ERROR_SOLUTIONS = {
  'Failed to create user': [
    'Check if user already exists with that email',
    'Verify Firestore security rules allow user creation',
    'Check Firebase Authentication quotas',
    'Verify user has proper permissions'
  ],
  'Missing or insufficient permissions': [
    'Check Firestore security rules',
    'Verify user is authenticated',
    'Check if user document exists',
    'Verify admin role is set correctly'
  ],
  'Network request failed': [
    'Check internet connection',
    'Verify Firebase project configuration',
    'Check if Firebase service is down',
    'Try refreshing the page'
  ],
  'Quota exceeded': [
    'Check Firebase usage limits',
    'Upgrade Firebase plan if needed',
    'Review data usage patterns'
  ]
};

/**
 * Get suggested solutions for an error
 */
export function getErrorSolutions(errorMessage: string): string[] {
  const message = errorMessage.toLowerCase();
  
  for (const [pattern, solutions] of Object.entries(ERROR_SOLUTIONS)) {
    if (message.includes(pattern.toLowerCase())) {
      return solutions;
    }
  }
  
  return [
    'Check browser console for more details',
    'Try refreshing the page',
    'Clear browser cache and cookies',
    'Try in an incognito/private window'
  ];
}
