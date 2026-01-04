// CRITICAL: Import React FIRST and synchronously to ensure scheduler is initialized
// This must happen before any other modules (especially framer-motion) try to access React's scheduler
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Force React's scheduler to initialize IMMEDIATELY by creating and unmounting a root
// This MUST happen synchronously before any other modules load
if (typeof document !== 'undefined' && document.body) {
  try {
    const dummyDiv = document.createElement('div');
    dummyDiv.style.display = 'none';
    dummyDiv.style.position = 'absolute';
    dummyDiv.style.top = '-9999px';
    dummyDiv.style.left = '-9999px';
    document.body.appendChild(dummyDiv);
    const dummyRoot = ReactDOM.createRoot(dummyDiv);
    // Render and immediately unmount to force scheduler initialization
    dummyRoot.render(React.createElement(React.Fragment));
    // Use requestAnimationFrame to ensure scheduler is fully initialized
    requestAnimationFrame(() => {
      try {
        dummyRoot.unmount();
        if (dummyDiv.parentNode) {
          document.body.removeChild(dummyDiv);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    });
  } catch (e) {
    // Ignore errors during initialization
  }
}

// Error boundary for debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Don't prevent default for initialization errors - we need to see them
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent default browser error handling for known harmless errors
  if (event.reason?.message?.includes('ServiceWorker') || 
      event.reason?.message?.includes('invalid state')) {
    event.preventDefault();
  }
});

// Initialize app after DOM is ready and ensure proper module loading order
async function initApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  try {
    // React is already imported at top level, scheduler should be initialized
    // Additional delay to ensure React's internal scheduler is fully ready
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => setTimeout(resolve, 100));

    // Load AuthProvider first, then App to avoid circular dependencies
    const { AuthProvider } = await import('./contexts/AuthContext');
    
    // Small delay before loading App
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const { default: App } = await import('./App');

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Error rendering app:', error);
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif;">
          <h1>Error Loading App</h1>
          <p>${error instanceof Error ? error.message : String(error)}</p>
          <pre>${error instanceof Error ? error.stack : ''}</pre>
        </div>
      `;
    }
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already ready
  initApp();
}
