import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePluginVersion } from './plugins/vite-plugin-version.js';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      vitePluginVersion(), 
      react({
        // Ensure React 19 compatibility
        jsxRuntime: 'automatic',
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      // Improve chunking to avoid circular dependency issues
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // CRITICAL: React must be in its own chunk and load first
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Put Firebase in its own chunk
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // Put UI libraries in their own chunk (loads after React)
            if (id.includes('framer-motion')) {
              return 'ui-vendor';
            }
            // Put App in its own chunk to avoid circular dependencies
            if (id.includes('App.tsx') || id.includes('App.jsx')) {
              return 'app';
            }
            // Put node_modules in vendor chunk
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
          // Ensure proper chunk loading order
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: (chunkInfo) => {
            // React vendor must load first
            if (chunkInfo.name === 'react-vendor') {
              return 'assets/react-vendor-[hash].js';
            }
            return 'assets/[name]-[hash].js';
          }
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
      // Use commonjs format for better compatibility
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
      // Optimize for React 19
      target: 'esnext',
      minify: 'esbuild',
    },
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(env.VITE_FIREBASE_MEASUREMENT_ID),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'import.meta.env.VITE_RESEND_API_KEY': JSON.stringify(env.VITE_RESEND_API_KEY),
    }
  };
});
