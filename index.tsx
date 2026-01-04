
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

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
    // Dynamically import to ensure proper initialization order
    const [{ default: App }, { AuthProvider }] = await Promise.all([
      import('./App'),
      import('./contexts/AuthContext')
    ]);

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
