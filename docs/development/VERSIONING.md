# App Versioning Guide

## Deployment Steps (Correct Order)

```bash
1. npm run build          # Build first - auto-increments version
2. git add .
3. git commit -m "message"
4. git push origin main
5. firebase deploy
```

**Important:** Build first because the build process auto-generates `src/version.ts` with an incremented patch number and build date.

---

## How Versioning Works

1. **`vite.config.ts`** has a plugin that runs on each production build
2. It reads `src/version.ts`, increments `VERSION_PATCH`, updates `BUILD_DATE`
3. The version displays in the bottom navigation footer

### Version Format
```
v{MAJOR}.{MINOR}.{PATCH} Beta · Built {DATE}
Example: v1.0.65 Beta · Built Jan 11, 2026
```

### Version File Location
`src/version.ts` - Auto-generated, but committed to git

---

## Reusable Prompt for New Projects

Use this prompt when setting up versioning in new apps:

```
I want automatic semantic versioning for this app:

1. VERSION FORMAT: v{MAJOR}.{MINOR}.{PATCH} (e.g., v1.0.65)
   - MAJOR: Breaking changes (manual)
   - MINOR: New features (manual)
   - PATCH: Auto-increment on each build

2. AUTO-INCREMENT: On every production build:
   - Increment PATCH number by 1
   - Update BUILD_DATE to current timestamp
   - Generate/update a version.ts file

3. DISPLAY: Show version in the app footer as:
   "v1.0.65 Beta · Built Jan 11, 2026"

4. IMPLEMENTATION:
   - Create src/version.ts with exported constants
   - Add build plugin to auto-update version.ts before bundling
   - Export a getVersionString() function for display
   - Version file should be committed to git

5. DO NOT increment version during development (npm run dev),
   only during production builds (npm run build).
```

---

## Manual Version Updates

To manually update MAJOR or MINOR versions, edit `src/version.ts`:

```typescript
export const VERSION_MAJOR = 1;  // Increment for breaking changes
export const VERSION_MINOR = 0;  // Increment for new features
export const VERSION_PATCH = 65; // Auto-incremented on build
```
