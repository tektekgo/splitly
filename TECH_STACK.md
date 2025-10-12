# Splitly Tech Stack

## Frontend Framework
- **React**: 19.2.0 (UI framework)
- **TypeScript**: 5.8.2 (Type safety)
- **Tailwind CSS**: CDN (Styling)

## Build Tools
- **Vite**: 6.2.0 (Fast build tool and dev server)
- **@vitejs/plugin-react**: 5.0.0 (React integration)

## Backend & Services
- **Firebase**: 10.12.3
  - Firestore (Database)
  - Auth (Coming soon)
  - Hosting (Deployment option)
- **Google Gemini AI**: gemini-2.5-flash (AI category suggestions)

## State Management
- React Hooks (useState, useEffect, useCallback, useMemo)
- Context API (for auth, coming soon)

## Key Libraries
- **react**: 19.2.0
- **react-dom**: 19.2.0
- **firebase**: 10.12.3

## Development Environment
- **OS**: Windows 11
- **Node.js**: v22.16.0
- **Package Manager**: npm
- **Git**: v2.49.0
- **IDE**: Cursor

## Deployment Strategy
- **Current**: Local development (localhost:3000)
- **Phase 1**: Vercel or Firebase Hosting (web version)
- **Phase 2**: Capacitor wrapper for native apps
- **Phase 3**: Apple App Store + Google Play Store

## Project Structure
splitly/
├── components/           # React components (20+ files)
│   ├── AddExpenseForm.tsx
│   ├── BalanceSummary.tsx
│   ├── ExpenseList.tsx
│   └── ...
├── utils/               # Utility functions
│   ├── debtSimplification.ts
│   └── export.ts
├── App.tsx             # Main app component
├── firebase.ts         # Firebase configuration
├── types.ts            # TypeScript type definitions
├── constants.ts        # App constants
├── index.html          # HTML entry point
├── index.tsx           # React entry point
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── vite.config.ts      # Vite config
└── .env.local          # Environment variables (not in git)

## To See All Dependencies
Run: `npm list --depth=0`

## Future Additions
- Firebase Auth SDK (Week 1)
- Capacitor Core & CLI (Week 3)
- Platform-specific plugins as needed