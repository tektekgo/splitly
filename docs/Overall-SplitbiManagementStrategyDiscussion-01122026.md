# Overall Splitbi Management Strategy Discussion
**Date:** January 12, 2026
**Status:** Firebase Dev Environment COMPLETED

---

## Table of Contents
1. [GitHub Actions vs Bitrise](#1-github-actions-vs-bitrise)
2. [PWA vs Android Deployment Strategy](#2-pwa-vs-android-deployment-strategy)
3. [Play Store CI/CD During Beta](#3-play-store-cicd-during-beta)
4. [Firebase Environment Separation](#4-firebase-environment-separation)
5. [Security Scanning Options](#5-security-scanning-options)
6. [Automated Testing Strategy](#6-automated-testing-strategy)
7. [Implementation Decisions](#7-implementation-decisions)
8. [Daily Operations Guide](#8-daily-operations-guide)

---

## 1. GitHub Actions vs Bitrise

**Decision: Use GitHub Actions**

| Feature | GitHub Actions | Bitrise |
|---------|---------------|---------|
| Android builds | ✅ | ✅ |
| iOS builds | ✅ (macOS runners) | ✅ |
| PWA/Web builds | ✅ | ✅ |
| Play Store deploy | ✅ (via fastlane/gradle-play-publisher) | ✅ (native step) |
| Firebase deploy | ✅ (firebase-tools) | ✅ |
| Free minutes | **2,000/month** (Linux) | 300 credits (~3-5 builds) |
| Already integrated | ✅ Your repo | ❌ Needs setup |

**Verdict**: GitHub Actions is the better choice - more free minutes, already integrated with your repo.

---

## 2. PWA vs Android Deployment Strategy

### Key Insight
SplitBi is a **Capacitor hybrid app** - the Android app wraps your web code. So:
- **Web code changes** → Both PWA and Android need updates
- **Native Android changes** (e.g., splash screen, permissions) → Only Android

### Deployment Matrix

| Scenario | PWA (Firebase) | Android (Play Store) |
|----------|----------------|---------------------|
| Bug fix in web code | ✅ Deploy | ✅ Deploy (same web code) |
| Bug fix in Android-only code | ❌ Skip | ✅ Deploy |
| New feature | ✅ Deploy | ✅ Deploy |
| Hotfix | ✅ Deploy immediately | ⚠️ Play Store review delay |

### Recommended Strategy
```
Main branch push →
  ├── Auto-deploy PWA to Firebase (immediate)
  └── Build Android AAB (manual Play Store upload initially)
```

---

## 3. Play Store CI/CD During Beta

**You do NOT need to wait for production approval to set up CI/CD.**

### Play Store Tracks & Review Times

| Track | Review Time | Use Case |
|-------|-------------|----------|
| Internal testing | Instant (no review) | Quick internal testing |
| Closed testing | Hours to 1 day | Beta testers |
| Open testing | Standard review | Public beta |
| Production | 1-3 days | Public release |

You can automate uploads to **any track** via the Play Developer API.

---

## 4. Firebase Environment Separation

### ✅ COMPLETED - January 12, 2026

### Architecture
```
┌──────────────────────┐    ┌──────────────────────┐
│  splitbi-dev         │    │  splitlyapp-cc612    │
│  (DEV project)       │    │  (PROD project)      │
│  ┌────────────────┐  │    │  ┌────────────────┐  │
│  │ Firestore DEV  │  │    │  │ Firestore PROD │  │
│  │ - Test data    │  │    │  │ - Real users   │  │
│  │ - Safe to wipe │  │    │  │ - Protected    │  │
│  └────────────────┘  │    │  └────────────────┘  │
└──────────────────────┘    └──────────────────────┘
```

### Environment Files

| File | Purpose | Firebase Project |
|------|---------|------------------|
| `.env.local` | Local development (`npm run dev`) | splitbi-dev |
| `.env.development` | Backup dev config | splitbi-dev |
| `.env.production` | Production builds (`npm run build`) | splitlyapp-cc612 |

### How It Works

| Command | Env File Used | Firebase Project |
|---------|---------------|------------------|
| `npm run dev` | `.env.local` | **splitbi-dev** (DEV) |
| `npm run build` | `.env.production` | **splitlyapp-cc612** (PROD) |

### Why Separate Projects?
1. **No accidental prod writes** - Different API keys entirely
2. **Independent scaling** - Dev won't eat into prod quotas
3. **Separate security rules** - Can be more permissive in dev
4. **Cost tracking** - See dev vs prod costs separately

### Billing Note
- **Same Google/Blaze account** - Both projects under one billing account
- Dev project stays on free tier unless you exceed limits

---

## 5. Security Scanning Options

### For PWA/Web (Free)

| Tool | What It Does | Integration |
|------|--------------|-------------|
| **GitHub Dependabot** | Dependency vulnerabilities | Built-in, free |
| **CodeQL** | SAST (code analysis) | Free for private repos with Actions |
| **npm audit** | Node dependencies | Free, run in CI |
| **Snyk** | Dependencies + code | Free tier: 200 tests/month |

### For Android (Free)

| Tool | What It Does | Integration |
|------|--------------|-------------|
| **MobSF** | Mobile security scanner | Free, GitHub Action available |
| **OWASP Dependency-Check** | Known vulnerabilities | Free, Gradle plugin |

### Recommended Starter Setup
- Dependabot (auto-enabled)
- npm audit (add to workflow)
- CodeQL (add workflow later)

---

## 6. Automated Testing Strategy

### Current State
No tests currently exist in the codebase.

### Test Pyramid (Target)
```
        ┌─────────────┐
        │   E2E Tests │  ← Few critical flows (Playwright)
        │  (Slowest)  │
        ├─────────────┤
        │ Integration │  ← API/Firebase tests (Vitest)
        │    Tests    │
        ├─────────────┤
        │  Unit Tests │  ← Component/function tests (Vitest)
        │  (Fastest)  │
        └─────────────┘
```

### Initial Setup (Basic)
1. Add Vitest (fast, Vite-native)
2. Add basic smoke tests
3. Expand over time

### Target CI/CD Flow
```
PR opened →
  ├── Run lint
  ├── Run unit tests
  ├── Run E2E tests (against DEV Firebase)
  └── Build check

Main branch merge →
  ├── All above tests pass
  ├── Deploy to Firebase Hosting (PWA - PROD)
  └── Build Android AAB (artifact)

Manual trigger →
  └── Upload AAB to Play Store
```

---

## 7. Implementation Decisions

| Decision | Choice | Status |
|----------|--------|--------|
| CI/CD Platform | GitHub Actions | ⏳ Pending |
| Firebase Dev Setup | Separate project (splitbi-dev) | ✅ Completed |
| Billing | Same Blaze account | ✅ Completed |
| Data Migration | Full migration from prod | ✅ Completed |
| Initial Testing | Basic Vitest setup | ⏳ Pending |
| Play Store Upload | Manual initially | Current |

---

## 8. Daily Operations Guide

### Development Workflow

#### Starting Development
```bash
# 1. Start development server (uses DEV Firebase automatically)
npm run dev

# 2. Open http://localhost:3000
# 3. Make your changes and test locally
```

#### Verify You're Using DEV
- Google sign-in popup should say "Sign in to **SplitBi-dev**"
- Check browser console for `splitbi-dev` in Firebase logs

#### Before Committing
```bash
# 1. Run linting
npm run lint

# 2. Run tests (when available)
npm run test

# 3. Build to check for errors
npm run build
```

#### Deploying to PROD (PWA)
```bash
# Option 1: Merge PR to main branch (triggers GitHub Actions - when configured)

# Option 2: Manual deploy
npm run build
firebase use splitlyapp-cc612
firebase deploy --only hosting
```

#### Deploying to PROD (Android)
```bash
# 1. Update version in android/app/build.gradle
#    - Increment versionCode
#    - Update versionName if needed

# 2. Build web and sync to Android
npm run build:android

# 3. Generate release AAB
cd android
./gradlew bundleRelease

# 4. Locate AAB file
# android/app/build/outputs/bundle/release/app-release.aab

# 5. Upload to Play Console
# - Go to https://play.google.com/console
# - Select SplitBi
# - Release > Testing/Production
# - Create new release
# - Upload AAB
# - Add release notes
# - Submit for review
```

### Environment Switching (Firebase CLI)

```bash
# Switch to DEV
firebase use splitbi-dev

# Switch to PROD
firebase use splitlyapp-cc612

# List all projects
firebase projects:list
```

### Admin Setup (Dev Environment)

When you first log into the dev environment, you need to set up admin access:

1. Log into the app at `http://localhost:3000`
2. Go to [Firebase Console - splitbi-dev](https://console.firebase.google.com/project/splitbi-dev/firestore/databases/-default-/data/~2Fusers)
3. Find your user document (by email)
4. Add field: `role` = `admin` (string)
5. Refresh the app

### Troubleshooting

#### Build Fails
```bash
# Clear caches and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### Android Build Fails
```bash
# Clean Android build
cd android
./gradlew clean
./gradlew bundleRelease
```

#### Firebase Deploy Fails
```bash
# Check you're logged in
firebase login

# Check correct project
firebase projects:list
firebase use <project-id>
```

#### Wrong Firebase Environment
If you're seeing prod data in dev (or vice versa):
1. Check `.env.local` has the correct config
2. Restart dev server (`npm run dev`)
3. Hard refresh browser (Ctrl+Shift+R)

---

## 9. Progress Checklist

### Completed ✅
- [x] Create splitbi-dev Firebase project
- [x] Enable Firestore in dev project
- [x] Enable Authentication (Google + Email)
- [x] Get Firebase config for dev
- [x] Configure Google OAuth for dev
- [x] Link to Blaze billing account
- [x] Create environment files (.env.local, .env.development)
- [x] Export data from prod Firestore
- [x] Import data to dev Firestore
- [x] Configure local dev to use dev Firebase
- [x] Test dev environment works
- [x] Set up admin role in dev

### Pending ⏳
- [ ] Set up GitHub Actions workflow
- [ ] Add basic testing setup (Vitest)
- [ ] Add security scanning
- [ ] Deploy Firestore security rules to dev

---

## Appendix A: Firebase Project Details

### Production Project
| Setting | Value |
|---------|-------|
| Project ID | `splitlyapp-cc612` |
| Auth Domain | `splitlyapp-cc612.firebaseapp.com` |
| Storage Bucket | `splitlyapp-cc612.firebasestorage.app` |
| Messaging Sender ID | `116751855385` |
| App ID | `1:116751855385:web:5c2c87412dd0d039d2df88` |

### Development Project
| Setting | Value |
|---------|-------|
| Project ID | `splitbi-dev` |
| Auth Domain | `splitbi-dev.firebaseapp.com` |
| Storage Bucket | `splitbi-dev.firebasestorage.app` |
| Messaging Sender ID | `989828662190` |
| App ID | `1:989828662190:web:b3c6f458cf85f8db3c7e3f` |
| Public-facing Name | SplitBi-dev |
| Analytics Account | splitbi-dev |

---

## Appendix B: Current Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React | 19.2.0 |
| Build Tool | Vite | 6.2.0 |
| Mobile Framework | Capacitor | 7.4.4 |
| Backend | Firebase (Firestore, Auth, Functions, Hosting) | 10.14.1 |
| Functions Runtime | Node.js | 20 |
| Android SDK | Target SDK | 35 |
| Android Min SDK | | 22 |

---

## Appendix C: Repository Structure

```
splitly/
├── android/                 # Android native code (Capacitor)
├── dist/                    # Build output (deployed to Firebase)
├── docs/                    # Documentation
├── functions/               # Firebase Cloud Functions
├── public/                  # Static assets
├── src/                     # React source code
├── .env.local              # Local dev environment (DEV Firebase)
├── .env.development        # Backup dev config (DEV Firebase)
├── .env.production         # Production builds (PROD Firebase)
├── capacitor.config.ts     # Capacitor configuration
├── firebase.json           # Firebase deployment config
├── firestore.rules         # Firestore security rules
├── package.json            # Node dependencies
└── vite.config.ts          # Vite build configuration
```

---

## Appendix D: Data Migration Reference

### Export from Prod
```bash
# Via Google Cloud Console:
# https://console.cloud.google.com/firestore/databases/-default-/import-export?project=splitlyapp-cc612
# Click Export → Choose bucket → Export entire database
```

### Import to Dev
```bash
# Via Google Cloud Console:
# https://console.cloud.google.com/firestore/databases/-default-/import-export?project=splitbi-dev
# Click Import → Enter path to .overall_export_metadata file
```

### Grant Cross-Project Access
For dev project to read prod bucket:
1. Go to prod bucket Permissions
2. Add principal: `service-989828662190@gcp-sa-firestore.iam.gserviceaccount.com`
3. Role: Storage Admin

---

*Document created: January 12, 2026*
*Last updated: January 12, 2026*
