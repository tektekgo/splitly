// Only register service worker in production (not localhost)
if ('serviceWorker' in navigator && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
          
          // Check for updates periodically (with error handling)
          let updateInProgress = false;
          setInterval(() => {
            // Prevent concurrent update attempts
            if (updateInProgress) return;
            
            try {
              // Only update if registration is still valid
              if (registration && registration.update) {
                updateInProgress = true;
                registration.update()
                  .then(() => {
                    updateInProgress = false;
                  })
                  .catch((error) => {
                    updateInProgress = false;
                    // Silently handle common update errors (SW already updating, invalid state, etc.)
                    // These are expected and don't indicate a problem
                    const errorMsg = error?.message || error?.toString() || '';
                    const isHarmlessError = 
                      errorMsg.includes('invalid state') || 
                      errorMsg.includes('ServiceWorker') ||
                      errorMsg.includes('Failed to update');
                    
                    if (!isHarmlessError) {
                      console.warn('Service Worker update warning:', errorMsg);
                    }
                  });
              }
            } catch (error) {
              // Ignore errors from update attempts
              updateInProgress = false;
            }
          }, 300000); // Check every 5 minutes (less aggressive)
        })
        .catch((error) => {
          // Only log actual registration failures
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  } else {
    console.log('🔧 Development mode - Service Worker disabled');
  }

// Suppress harmless COOP warnings from Firebase Auth popup
// These are browser security warnings, not actual errors, and don't affect functionality
(function() {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    const message = args[0]?.toString() || '';
    // Suppress COOP warnings from Firebase Auth (harmless browser security warnings)
    if (message.includes('Cross-Origin-Opener-Policy') || 
        (message.includes('window.closed') && message.includes('policy')) ||
        (message.includes('window.close') && message.includes('policy'))) {
      return; // Silently ignore harmless COOP warnings
    }
    originalError.apply(console, args);
  };
  
  // Also catch warnings (some browsers log COOP as warnings)
  console.warn = function(...args) {
    const message = args[0]?.toString() || '';
    if (message.includes('Cross-Origin-Opener-Policy') || 
        (message.includes('window.closed') && message.includes('policy')) ||
        (message.includes('window.close') && message.includes('policy'))) {
      return; // Silently ignore harmless COOP warnings
    }
    originalWarn.apply(console, args);
  };
})();