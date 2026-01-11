# Code Changes Summary - January 2024

## Changes Made Today

### 1. Fixed Logout Functionality ✅
**File:** `App.tsx`

**Problem:** User menu dropdown was not displaying correctly when clicking the user's name in the header, preventing logout functionality.

**Solution:**
- Added `useRef` import to track button position
- Added `userMenuButtonRef` to reference the user menu button
- Changed dropdown positioning from `absolute` to `fixed` with dynamic positioning
- Added `onClick` handler with `stopPropagation()` to prevent event conflicts
- Added check to ensure button ref exists before rendering dropdown

**Key Changes:**
```typescript
// Added ref
const userMenuButtonRef = useRef<HTMLButtonElement>(null);

// Updated button with ref and event handling
<motion.button
  ref={userMenuButtonRef}
  onClick={(e) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  }}
  ...
/>

// Updated dropdown with fixed positioning
{showUserMenu && userMenuButtonRef.current && (
  <motion.div 
    className="fixed z-[60] w-48 ..."
    style={{
      top: `${userMenuButtonRef.current.getBoundingClientRect().bottom + 8}px`,
      right: `${window.innerWidth - userMenuButtonRef.current.getBoundingClientRect().right}px`
    }}
    ...
  />
)}
```

**Status:** ✅ Deployed and working

---

### 2. Updated PWA Manifest for Custom Domain ✅
**File:** `public/manifest.json`

**Problem:** PWA install prompt on Android was showing Firebase domain (`splitlyapp-cc612.web.app`) instead of custom domain (`splitbi.app`).

**Solution:**
- Added `id` field pointing to custom domain
- Added `scope` field restricting PWA to custom domain

**Key Changes:**
```json
{
  "id": "https://splitbi.app",
  "scope": "https://splitbi.app/",
  ...
}
```

**Status:** ✅ Deployed (Note: Android Chrome may still show Firebase domain due to browser behavior - see recommendations below)

---

### 3. Fixed Google OAuth Redirect URIs ✅
**Configuration:** Google Cloud Console OAuth Client

**Problem:** OAuth redirect URIs were using single underscore (`/_/auth/handler`) instead of double underscore (`/__/auth/handler`), causing "Error 401: invalid_client".

**Solution:**
- Updated all Authorized redirect URIs in Google Cloud Console to use `/__/auth/handler` (double underscore)
- Updated URIs for:
  - `https://splitlyapp-cc612.firebaseapp.com/__/auth/handler`
  - `https://splitlyapp-cc612.web.app/__/auth/handler`
  - `http://localhost/__/auth/handler`
  - `https://splitbi.app/__/auth/handler`

**Status:** ✅ Fixed in Google Cloud Console

---

## Recommendations (Not Implemented)

### 1. Capacitor Configuration for Play Store Production Build
**File:** `capacitor.config.ts`

**Current State:**
```typescript
server: {
  url: 'https://splitbi.app',
  cleartext: true,
}
```

**Recommendation:**
For production Play Store builds, remove or comment out the `server` configuration so the app uses bundled assets instead of loading from a remote URL.

**Why:**
- App will work offline
- Faster load times
- No dependency on network connectivity for UI
- Better user experience

**Proposed Change:**
```typescript
// Server config removed for production - app will use bundled assets
// Uncomment below for development/testing to load from remote URL
// server: {
//   url: 'https://splitbi.app',
//   cleartext: true,
// }
```

**When to Apply:**
- Before building final release APK/AAB for Play Store
- Can keep server config for development/testing builds

**Note:** User has chosen to keep server config active for now.

---

### 2. Android App Name Consistency
**File:** `android/app/src/main/res/values/strings.xml`

**Current State:**
```xml
<string name="app_name">Splitbi</string>
<string name="title_activity_main">Splitbi</string>
```

**Recommendation:**
Update to match branding: "SplitBi" (capital B, lowercase i)

**Proposed Change:**
```xml
<string name="app_name">SplitBi</string>
<string name="title_activity_main">SplitBi</string>
```

**Status:** User rejected this change - keeping current naming

---

## Known Issues & Limitations

### 1. PWA Install Prompt Domain Display
**Issue:** Android Chrome shows `splitlyapp-cc612.web.app` instead of `splitbi.app` in PWA install prompt.

**Root Cause:**
- Android Chrome determines the domain shown based on where `manifest.json` is actually served from
- Even with custom domain properly configured, Chrome may detect the underlying Firebase hosting domain
- This is a browser-level behavior, not a Firebase configuration issue

**Impact:**
- Only affects the install prompt (one-time user experience)
- Once installed, app shows correct domain (`splitbi.app`)
- Does not affect functionality

**Workaround:**
- Native Android app (Capacitor) avoids this issue entirely since users install from Play Store
- User is already deploying to Play Store, so this limitation is acceptable

**Status:** Known limitation - no action required

---

## Deployment Process

### Standard Deployment Steps:
```bash
# 1. Build production bundle
npm run build

# 2. Deploy to Firebase Hosting
npx firebase-tools deploy --only hosting

# 3. For Android builds
npm run build:android  # Builds web assets and syncs with Capacitor
# Then build release APK/AAB in Android Studio
```

---

## Files Modified Today

1. ✅ `App.tsx` - Fixed logout functionality
2. ✅ `public/manifest.json` - Added id and scope fields
3. ✅ Google Cloud Console - Fixed OAuth redirect URIs
4. ⚠️ `capacitor.config.ts` - Recommendation provided (not applied)
5. ⚠️ `android/app/src/main/res/values/strings.xml` - Recommendation provided (rejected)

---

## Testing Checklist

- [x] Logout functionality works correctly
- [x] User menu dropdown displays properly
- [x] Google Sign-In works on production domain
- [x] PWA manifest loads correctly
- [ ] Play Store build tested (when ready)
- [ ] Offline functionality tested (if server config removed)

---

## Notes

- All critical functionality fixes have been deployed
- Recommendations are optional optimizations for future consideration
- PWA install prompt domain issue is a known limitation with acceptable workaround (Play Store deployment)
- User has chosen to keep current Capacitor server configuration for development/testing purposes

