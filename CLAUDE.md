# SplitBi - Project Context for Claude

## Project Status

**Last Updated:** January 18, 2026

### Current State
- ✅ Production live at https://splitbi.app
- ✅ Dev environment at https://splitbi-dev.web.app
- ✅ Play Store: Closed Testing (Alpha) - v1.0.76 in review
- ✅ All CI/CD workflows operational

### Recent Updates (Jan 18, 2026)
- Updated React to 19.2.3, Firebase to 12.8.0
- Set up dev branch with auto-deploy CI
- Configured Dependabot auto-merge for patch/minor updates
- Added Terms of Service and legal links to Profile screen
- Fixed `.firebaserc` to default to dev (safer local deploys)

### Pending / Future
- Android release with latest updates (AAB ready in GitHub Actions)
- Move from Closed Testing to Production on Play Store (when ready)

---

## Daily Workflow Guide

### Branch Strategy

```
dev (development)     →  splitbi-dev.web.app (Dev Firebase)
  ↓ merge
main (production)     →  splitbi.app (Prod Firebase) + Android AAB
```

### Your Daily Development Flow

#### 1. Start Your Day (Always work on `dev` branch)
```bash
git checkout dev
git pull origin dev
npm run dev              # Starts local server → uses DEV Firebase
```

#### 2. Make Changes & Test Locally
- Edit code as needed
- Test at `http://localhost:5173` (uses dev database)
- Your changes won't affect production users

#### 3. Commit & Push to Dev
```bash
git add .
git commit -m "Your change description"
git push origin dev
```
**What happens:** GitHub Actions deploys to `splitbi-dev.web.app`

#### 4. Test on Dev Environment
- Visit https://splitbi-dev.web.app
- Test with dev database (separate from prod users)
- Share with testers if needed

#### 5. Ready for Production? Merge to Main
```bash
git checkout main
git pull origin main
git merge dev
git push origin main
```
**What happens automatically:**
- ✅ Deploys to `splitbi.app` (production)
- ✅ Builds Android AAB (download from GitHub Actions artifacts)

#### 6. Release Android (When Needed)
1. Go to GitHub → Actions → Latest "Deploy" run
2. Download `android-release-aab` artifact
3. Upload to [Google Play Console](https://play.google.com/console)
4. Create release and submit for review

---

## Quick Reference

### Environments

| Environment | Branch | URL | Firebase Project | Database |
|-------------|--------|-----|------------------|----------|
| **Local Dev** | any | localhost:5173 | splitbi-dev | Dev |
| **Dev Server** | `dev` | splitbi-dev.web.app | splitbi-dev | Dev |
| **Production** | `main` | splitbi.app | splitlyapp-cc612 | Prod |

### Commands Cheat Sheet

```bash
# Daily development
npm run dev                                    # Local dev server

# Manual deploys (rarely needed - CI handles this)
firebase deploy --only hosting                 # Deploy to DEV
firebase deploy --only hosting --project prod  # Deploy to PROD

# Android build (CI builds automatically, but for local testing)
npm run build:android                          # Build web + sync
cd android && ./gradlew bundleRelease          # Build signed AAB
```

### Git Branches

| Branch | Purpose | Auto-deploys to |
|--------|---------|-----------------|
| `dev` | Active development, testing | splitbi-dev.web.app |
| `main` | Production releases | splitbi.app + Android AAB |

---

## Firebase Projects

| Environment | Project ID | Hosting URL | Custom Domain |
|-------------|------------|-------------|---------------|
| **Development** | `splitbi-dev` | https://splitbi-dev.web.app | - |
| **Production** | `splitlyapp-cc612` | https://splitlyapp-cc612.web.app | https://splitbi.app |

---

## Android / Play Store

- **Package ID:** `app.splitbi.splitbi`
- **Current Status:** Closed Testing (Alpha)
- **Version:** Auto-generated from git commit count
- **Setup Guide:** `docs/launch/PLAY_STORE_SETUP.md`

**AAB Location:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## CI/CD Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `ci.yml` | All pushes | Runs build/lint checks |
| `deploy.yml` | Push to `main` | Deploy to prod + build Android AAB |
| `deploy-dev.yml` | Push to `dev` | Deploy to dev environment |
| `auto-merge.yml` | Dependabot PRs | Auto-merges patch/minor updates |

---

## Tech Stack

- **Frontend:** React 19.2.3 + TypeScript + Vite 6.4 + Tailwind CSS
- **Mobile:** Capacitor 7.4.5 (Android)
- **Backend:** Firebase 12.8.0 (Auth, Firestore, Hosting)
- **Auth:** Google Sign-In + Email/Password

---

## Key Files

| File | Purpose |
|------|---------|
| `.firebaserc` | Firebase project aliases (dev/prod) |
| `firebase.json` | Hosting config and rewrites |
| `.env.local` | Local dev environment (gitignored) |
| `.env.development` | Dev environment template |
| `.env.production` | Prod environment template |
| `android/app/build.gradle` | Android versioning (auto from git) |
| `docs/launch/PLAY_STORE_SETUP.md` | Complete Play Store setup guide |

---

## GitHub Secrets Required

For `dev` branch CI to work, add these secrets in GitHub:
- `VITE_FIREBASE_API_KEY_DEV` - Dev Firebase API key
- `VITE_FIREBASE_APP_ID_DEV` - Dev Firebase App ID
- `FIREBASE_SERVICE_ACCOUNT_DEV` - Dev Firebase service account JSON

Production secrets (already configured):
- `VITE_FIREBASE_API_KEY` - Prod Firebase API key
- `VITE_FIREBASE_APP_ID` - Prod Firebase App ID
- `FIREBASE_SERVICE_ACCOUNT` - Prod Firebase service account JSON
- `ANDROID_KEYSTORE_BASE64` - Android signing keystore
- `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
