# Splitbi Project Context

## What This Is
Expense splitting app for friends/roommates. Similar to Splitwise.

## Current Status
- 95% complete React/TypeScript web app
- Firebase Firestore backend working
- Running locally on http://localhost:3000
- Needs: Firebase Auth, PWA features, mobile wrapper

## Key Files
- `App.tsx` - Main app component (600 lines)
- `firebase.ts` - Firebase configuration
- `components/` - 20+ React components
- `utils/debtSimplification.ts` - Core debt simplification algorithm
- `utils/export.ts` - CSV export functionality

## Critical Info
- Currently uses hardcoded CURRENT_USER_ID = 'user1' (needs replacing with real auth)
- Firebase keys now secured in .env.local
- Features: Multi-group support, 4 split methods, dark mode, notifications, AI categories

## Tech Stack
- Frontend: React 19, TypeScript, Tailwind CSS
- Backend: Firebase Firestore
- Build: Vite 6.2
- AI: Google Gemini (category suggestions)

## Development Environment
- OS: Windows 11
- Node: v22.16.0
- Git: v2.49.0
- IDE: Cursor

## Goals
1. ✅ Setup local environment
2. ⏳ Add Firebase Authentication
3. ⏳ Convert to PWA (Progressive Web App)
4. ⏳ Wrap with Capacitor for native apps
5. ⏳ Submit to App Store + Play Store
6. ⏳ Add $2.99 pricing after beta testing