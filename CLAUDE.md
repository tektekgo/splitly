# SplitBi - Project Context for Claude

## Pending Tasks (Resume Here!)

**Last updated:** January 18, 2026

### Completed This Session:
- [x] UX fix: Disable split options for single-member groups
- [x] Synced Android version with web (git commit count)
- [x] Fixed CI compatibility (Java home in local.properties)
- [x] Created `terms.html` (Terms of Service)
- [x] Added Privacy, Terms, Delete Account links to Profile screen
- [x] Deployed to production web (`splitbi.app`)
- [x] Submitted v1.0.76 to Play Store (in review)

### Still Pending:
- [ ] **Build and release Android** with legal links (after this commit)
- [ ] **Decision needed:** Set up dev branch workflow? (Currently only main → prod exists)

### Recently Completed:
- [x] Fixed `.firebaserc` to default to dev (safe local deploys)
- [x] Committed terms.html, ProfileScreen.tsx, CLAUDE.md, .firebaserc

---

## Firebase Projects (IMPORTANT!)

This project uses **two separate Firebase projects** for dev and production:

| Environment | Project ID | Hosting URL | Custom Domain |
|-------------|------------|-------------|---------------|
| **Development** | `splitbi-dev` | https://splitbi-dev.web.app | - |
| **Production** | `splitlyapp-cc612` | https://splitlyapp-cc612.web.app | https://splitbi.app |

### Deployment Commands

```bash
# Deploy to DEVELOPMENT (default - safe!)
firebase deploy --only hosting

# Deploy to PRODUCTION (requires explicit flag)
firebase deploy --only hosting --project prod
```

### CI/CD
- GitHub Actions deploys to **production** (`splitlyapp-cc612`) automatically on push to main
- Local `firebase deploy` defaults to **development** (`splitbi-dev`)

---

## Android / Play Store

- **Package ID:** `app.splitbi.splitbi`
- **Current Status:** Closed Testing (Alpha)
- **Version:** Auto-generated from git commit count (e.g., 1.0.76)
- **Setup Guide:** `docs/launch/PLAY_STORE_SETUP.md`

### Build Commands
```bash
npm run build:android    # Build web + sync to Android
cd android && ./gradlew bundleRelease   # Build signed AAB
```

**AAB Location:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Mobile:** Capacitor (Android)
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **Auth:** Google Sign-In + Email/Password

---

## Key Files

| File | Purpose |
|------|---------|
| `docs/launch/PLAY_STORE_SETUP.md` | Complete Play Store setup guide |
| `firebase.json` | Hosting config and rewrites |
| `android/app/build.gradle` | Android versioning (auto from git) |
| `android/local.properties` | Local machine settings (gitignored) |
| `plugins/vite-plugin-version.js` | Auto-generates version from git |
