# Google Play Store Setup Guide for SplitBi

This document captures all steps and form values used to set up SplitBi on Google Play Store. Use this as a reference for future app releases or similar projects.

---

## Current Status & Next Steps

**Status:** Closed Testing - Submitted for Review (January 12, 2026)

### Where We Are Now
- [x] Android release build configured
- [x] Play Console app created
- [x] App content forms completed
- [x] Store listing completed
- [x] Internal testing live and working
- [x] Google Sign-In configured (both SHA-1 fingerprints added)
- [x] Closed testing track created and submitted for review
- [ ] **Recruit 12 testers** ← YOU ARE HERE
- [ ] Wait 14 days after testers opt-in
- [ ] Apply for production access

### Immediate Next Steps
1. Share tester signup form: `https://forms.gle/iqXkrtbmauh6PzWD9`
2. As responses come in, add emails to Play Console tester list
3. Send opt-in link to added testers: `https://play.google.com/apps/testing/app.splitbi.splitbi`
4. Track progress in Play Console (see "Tracking Testers" section below)

### Tracking Testers in Play Console
1. Go to **Play Console** → **SplitBi**
2. **Testing** → **Closed testing** → **Alpha**
3. Look at the **Statistics** or **Testers** tab to see:
   - Number of testers who opted in
   - Number of downloads/installs
4. **Dashboard** → **Statistics** shows overall install metrics

### Resume Prompt for Claude
Copy this to start a new Claude session:
```
I'm continuing work on publishing SplitBi to Google Play Store.
Read docs/launch/PLAY_STORE_SETUP.md for full context and current status.
Current stage: Recruiting testers for Closed Testing (need 12 testers for 14 days).
```

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Android Release Build Setup](#android-release-build-setup)
3. [Play Console App Creation](#play-console-app-creation)
4. [App Content Configuration](#app-content-configuration)
5. [Store Listing](#store-listing)
6. [Internal Testing Setup](#internal-testing-setup)
7. [Google Sign-In Configuration](#google-sign-in-configuration)
8. [Closed Testing (Production Requirement)](#closed-testing-production-requirement)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Google Play Developer Account ($25 one-time fee)
- Firebase project with Authentication enabled
- Android Studio installed
- Java 17+ (Android Studio's bundled JDK works)

---

## Android Release Build Setup

### 1. Create Release Keystore

```bash
# Navigate to android folder
cd android

# Generate keystore (run in terminal, NOT PowerShell)
keytool -genkey -v -keystore splitbi-release.keystore -alias splitbi -keyalg RSA -keysize 2048 -validity 10000
```

**Keystore details used:**
- Keystore file: `splitbi-release.keystore`
- Keystore password: `[your-password]`
- Key alias: `splitbi`
- Key password: `[your-password]`
- Validity: 10000 days

> **IMPORTANT:** Store the keystore file and passwords securely. You'll need them for all future updates. If lost, you cannot update your app!

### 2. Create keystore.properties

Create `android/keystore.properties`:

```properties
storeFile=../splitbi-release.keystore
storePassword=[your-password]
keyAlias=splitbi
keyPassword=[your-password]
```

### 3. Configure build.gradle

`android/app/build.gradle` should include:

```gradle
// Load keystore properties (at top of file)
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

// Get version from git commit count (matches web versioning)
def getGitCommitCount = { ->
    try {
        def stdout = new ByteArrayOutputStream()
        exec {
            commandLine 'git', 'rev-list', '--count', 'HEAD'
            standardOutput = stdout
        }
        return Integer.parseInt(stdout.toString().trim())
    } catch (Exception e) {
        logger.warn("Could not get git commit count, using fallback")
        return 1
    }
}

def commitCount = getGitCommitCount()

android {
    namespace "app.splitbi.splitbi"
    compileSdk rootProject.ext.compileSdkVersion

    defaultConfig {
        applicationId "app.splitbi.splitbi"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode commitCount  // Auto-increments with each commit
        versionName "1.0.${commitCount}"  // Matches web version
    }

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

> **Note:** Version is now automatic! Both web and Android use git commit count as the patch version (e.g., `1.0.76`). No manual version updates needed.

### 4. Configure Java Home (local builds only)

For local Windows builds, add to `android/local.properties` (this file is gitignored):

```properties
org.gradle.java.home=C:/Program Files/Android/Android Studio/jbr
```

> **Important:** Do NOT add this to `gradle.properties` as it will break CI builds on Linux. The CI uses `setup-java` action instead.

### 5. Update SDK Version

`android/variables.gradle` - ensure targetSdkVersion meets Play Store requirements:

```gradle
ext {
    minSdkVersion = 22
    compileSdkVersion = 35
    targetSdkVersion = 35  // Must be current year's requirement
}
```

### 6. Update .gitignore

Add to `.gitignore`:

```
# Android signing (NEVER commit keystores!)
*.keystore
*.jks
keystore.properties
```

### 7. Build the AAB

```bash
# From project root
npm run build

# Sync with Capacitor
npx cap sync android

# Build AAB (from android folder or use Android Studio)
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Play Console App Creation

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**

### App Details Form:
| Field | Value |
|-------|-------|
| App name | SplitBi |
| Default language | English (United States) |
| App or game | App |
| Free or paid | Free |
| Declarations | Check all required boxes |

---

## App Content Configuration

Navigate to: **Policy** → **App content**

### 1. Privacy Policy
| Field | Value |
|-------|-------|
| Privacy policy URL | https://splitbi.app/privacy |

> Create `/public/privacy.html` and configure Firebase hosting rewrites

### 2. App Access
| Setting | Value |
|---------|-------|
| Access type | All or some functionality is restricted |
| Restriction type | Login credentials |
| Test credentials | Username: [test email], Password: [test password] |
| Instructions | "Use these test credentials to sign in and access all app features..." |

### 3. Ads Declaration
| Field | Value |
|-------|-------|
| Contains ads? | No |

### 4. Content Rating (IARC Questionnaire)
| Question | Answer |
|----------|--------|
| Email | gsujit@gmail.com |
| Category | Utility, Productivity, Communication, or Other |
| Violence | No |
| Sexuality | No |
| Language | No |
| Controlled substances | No |
| Crude humor | No |
| Fear | No |
| Simulated gambling | No |
| Real gambling | No |
| User-generated content | No |
| User interaction | No |
| Personal info sharing | Yes (shares expenses with group members) |
| Location sharing | No |
| Digital purchases | No |

**Result:** Rated 12+ / Teen

### 5. Target Audience
| Field | Value |
|-------|-------|
| Target age groups | 18 and over |
| Appeals to children? | No |

> Select 18+ only to avoid additional children's privacy requirements

### 6. Data Safety

#### Data Collection Overview:
| Question | Answer |
|----------|--------|
| Collects/shares user data? | Yes |
| All data encrypted in transit? | Yes |
| Users can request deletion? | Yes |
| Deletion request URL | https://splitbi.app/delete-account |

#### Data Types Collected:

**Personal Info:**
| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Name | Yes | No | App functionality |
| Email | Yes | No | App functionality, Account management |

**Financial Info:**
| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| User payment info | No | - | - |
| Other financial info | Yes | No | App functionality (expense tracking) |

**Account Info:**
| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Authentication | Yes | No | Account management (Google Sign-In) |

### 7. Government Apps
| Field | Value |
|-------|-------|
| Government app? | No |

### 8. Financial Features
| Field | Value |
|-------|-------|
| Financial features? | No |

> Even though it tracks expenses, it doesn't process payments or connect to bank accounts

### 9. Health Apps
| Field | Value |
|-------|-------|
| Health app? | No |

---

## Store Listing

Navigate to: **Grow** → **Store presence** → **Main store listing**

### App Details:
| Field | Character Limit | Value |
|-------|----------------|-------|
| App name | 30 chars | SplitBi |
| Short description | 80 chars | Split expenses easily with friends, family, and roommates. Track and settle up! |
| Full description | 4000 chars | See below |

**Full Description:**
```
SplitBi makes splitting expenses with friends, family, and roommates simple and stress-free.

KEY FEATURES:

Create Groups - Organize expenses by trip, household, event, or any shared activity

Add Expenses - Quickly log who paid and how to split the cost

Track Balances - See at a glance who owes whom

Settle Up - Record payments and clear balances

Multi-Currency Support - Handle expenses in different currencies

HOW IT WORKS:
1. Create a group and invite members
2. Add expenses as they happen
3. SplitBi calculates who owes what
4. Settle up when you're ready

Perfect for:
- Roommates sharing rent and utilities
- Friends splitting dinner or trip costs
- Couples managing shared expenses
- Groups planning events or vacations

No more awkward money conversations. No more spreadsheets. Just simple, fair expense splitting.

Download SplitBi today and make shared expenses easy!
```

### Graphics Requirements:

| Asset | Dimensions | Format |
|-------|------------|--------|
| App icon | 512x512 | PNG (uploaded during app creation) |
| Feature graphic | 1024x500 | PNG/JPG |
| Phone screenshots | 16:9 or 9:16 | PNG/JPG (2-8 required) |
| 7-inch tablet | 16:9 or 9:16 | PNG/JPG (optional but recommended) |
| 10-inch tablet | 16:9 or 9:16 | PNG/JPG (optional but recommended) |

> Feature graphic HTML template available at `/public/feature-graphic.html`

### Category & Contact:

| Field | Value |
|-------|-------|
| App category | Finance |
| Email | gsujit@gmail.com |
| Phone | [optional] |
| Website | https://splitbi.app |

---

## Internal Testing Setup

Navigate to: **Testing** → **Internal testing**

### Steps:
1. Click **Create new release**
2. If first time, accept Play App Signing
3. Upload your AAB file (`app-release.aab`)
4. Add release notes (e.g., "Initial release for internal testing")
5. Click **Save** then **Review release** then **Start rollout**

### Add Testers:
1. Go to **Testers** tab
2. Create an email list
3. Add tester emails (including your own)
4. Copy the **opt-in URL** and share with testers

### Version Code Management:
- Version is now **automatic** - derived from git commit count
- Each commit automatically increments the version
- No manual version updates needed in `build.gradle`

---

## Google Sign-In Configuration

**CRITICAL:** This is the most common issue with Android Google Sign-In!

### Required SHA-1 Fingerprints in Firebase:

You need **TWO** SHA-1 fingerprints registered in Firebase Console:

#### 1. Upload Key SHA-1 (your keystore):
```bash
keytool -list -v -keystore android/splitbi-release.keystore -alias splitbi
```

#### 2. App Signing Key SHA-1 (Google's key):
- Go to Play Console → **Setup** → **App integrity** → **App signing**
- Copy SHA-1 from "App signing key certificate" section

### Add to Firebase:
1. [Firebase Console](https://console.firebase.google.com) → Your project
2. Project settings (gear icon) → General tab
3. Scroll to Android app (`app.splitbi.splitbi`)
4. Click **Add fingerprint** for each SHA-1
5. Save

**SplitBi SHA-1 Fingerprints:**
- Upload key: `05:85:3B:78:73:46:BF:A2:D2:1A:8A:EC:B7:45:A8:E5:AD:A5:24:46`
- App signing key: `FA:48:E6:E4:81:42:07:EE:E5:4F:60:5E:DD:E9:5C:F6:D4:CC:31:76`

> **Note:** After adding fingerprints, wait 1-2 minutes. No app rebuild needed - Firebase checks server-side.

---

## Closed Testing (Production Requirement)

Before going to production, Google requires:
- **12 testers** minimum who opt-in
- **14 consecutive days** of closed testing
- Testers must opt-in via the testing link

### Internal vs Closed Testing

| Aspect | Internal Testing | Closed Testing |
|--------|------------------|----------------|
| Purpose | Developer/team testing | Pre-production testing |
| Max testers | 100 | Thousands |
| Minimum testers | None | 12 required for production |
| Time requirement | None | 14 days required for production |
| Run simultaneously? | Yes | Yes |

### Setup Steps:

1. Go to **Testing** → **Closed testing**
2. Click on **Closed testing - Alpha**
3. Complete the setup checklist:

#### Step 1: Select Countries
- Click "Select countries"
- Add countries where testers are located (e.g., United States, India, Canada)
- Save

#### Step 2: Select Testers
1. Click "Testers" tab
2. Click **Create email list**
3. Name: `Closed Beta Testers`
4. Add tester emails (Gmail/Google accounts)
5. Save
6. **Enable the list** (check the box)
7. Add feedback email: `gsujit@gmail.com`

#### Step 3: Create Release
1. Click **Create new release**
2. Upload AAB or click "Add from library" to reuse existing
3. Release name: `1.0.2 Beta`
4. Release notes:
```
<en-US>
Initial beta release for closed testing.
- Split expenses with friends and groups
- Google Sign-In authentication
- Multi-currency support
- Track balances and settle up
</en-US>
```
5. Click **Review release** → **Save**
6. Go to **Publishing overview** → **Send changes for review**

### Opt-in URL

After setup, find the opt-in URL in:
**Closed testing → Alpha → Testers tab → "How testers join your test"**

**SplitBi opt-in URL:** `https://play.google.com/apps/testing/app.splitbi.splitbi`

### Tester Recruitment Workflow

**Recommended approach using Google Form:**

1. Create a Google Form with:
   - **Title:** SplitBi Beta Tester Sign-up
   - **Field 1:** Name (short answer, required)
   - **Field 2:** Email - the one you use for Google Play Store (short answer, required)

2. **SplitBi tester form:** `https://forms.gle/iqXkrtbmauh6PzWD9`

3. Share this message in WhatsApp/social media:
```
Hey! 🙌

I built an app called SplitBi - helps split expenses with friends and groups.

Need 12 Android users to help test before I can publish on Play Store.

What to do:
1. Fill this form (10 seconds): https://forms.gle/iqXkrtbmauh6PzWD9
2. I'll add you as a tester
3. You'll get a link to download from Play Store
4. Keep it installed for 2 weeks

You can actually use the app! Create groups, add expenses, see who owes what.

Anyone willing to help? 🙏
```

### Adding Testers from Form Responses

1. Check Google Form responses (linked spreadsheet)
2. Go to Play Console → **Testing** → **Closed testing** → **Alpha** → **Testers**
3. Click edit (pencil icon) on "Closed Beta Testers" list
4. Copy emails from spreadsheet and paste (one per line or comma-separated)
5. Click **Save**
6. Send testers the opt-in link:
```
Thanks for signing up! Here's your link to download SplitBi:

https://play.google.com/apps/testing/app.splitbi.splitbi

1. Click the link
2. Accept to become a tester
3. Download the app

Let me know if you have any issues!
```

> **Note:** Google does NOT automatically notify testers. You must send them the opt-in link manually.

### Important Notes

- Testers can be from **any country** (no geographic restrictions)
- Testers need a **Google account** (Gmail or Google Workspace)
- The 14-day clock starts when testers **opt-in to Closed Testing**
- Recruit 15-20 people as buffer in case some drop out
- Testers don't need to actively use the app daily - just keep it installed

After 14 days with 12+ testers, you can apply for **Production** access.

---

## Troubleshooting

### "Version code already used"
- This shouldn't happen with auto-versioning (git commit count)
- If it does, make a new commit to increment the version
- Rebuild the AAB

### "Something went wrong" on Google Sign-In
1. Check both SHA-1 fingerprints are in Firebase
2. Most common: Missing the **App signing key** SHA-1 (Google's key, not yours)
3. Find it in Play Console → Setup → App integrity → App signing

### Java version error during build (local)
- Add `org.gradle.java.home=C:/Program Files/Android/Android Studio/jbr` to `android/local.properties`
- Do NOT add to `gradle.properties` (breaks CI)

### API level too low error
- Update `targetSdkVersion` in `android/variables.gradle` to meet current Play Store requirements

### Privacy/Terms pages showing app login instead of HTML
- Check Firebase hosting rewrites in `firebase.json`:
```json
"rewrites": [
  { "source": "/privacy", "destination": "/privacy.html" },
  { "source": "/terms", "destination": "/terms.html" },
  { "source": "/delete-account", "destination": "/delete-account.html" },
  { "source": "**", "destination": "/index.html" }
]
```
- The specific routes must come BEFORE the catch-all `**` route

### Corrupted splash screen PNGs
- Delete `android/app/src/main/res/drawable-land-*` and `drawable-port-*` folders if you get AAPT compilation errors

---

## Quick Reference: Build & Deploy Checklist

```bash
# 1. Build and sync (version auto-generated from git commit count)
npm run build:android

# 2. Build signed AAB
cd android
./gradlew bundleRelease

# 3. Upload to Play Console
#    File: android/app/build/outputs/bundle/release/app-release.aab
```

> **Version Management:** No manual version updates needed! Both web and Android automatically use git commit count as the patch version. Each commit increments the version on both platforms.

---

## Files Modified/Created for Play Store

| File | Purpose |
|------|---------|
| `android/splitbi-release.keystore` | Release signing key (DO NOT COMMIT) |
| `android/keystore.properties` | Keystore credentials (DO NOT COMMIT) |
| `android/local.properties` | Local machine settings incl. Java home (DO NOT COMMIT) |
| `android/app/build.gradle` | Signing config, auto-versioning from git |
| `android/variables.gradle` | SDK versions |
| `android/gradle.properties` | Gradle JVM settings (no Java home here!) |
| `android/app/google-services.json` | Firebase config with SHA-1 |
| `plugins/vite-plugin-version.js` | Auto-generates web version from git commit count |
| `public/privacy.html` | Privacy policy page |
| `public/delete-account.html` | Account deletion request page |
| `public/feature-graphic.html` | Feature graphic template |
| `firebase.json` | Hosting rewrites for static pages |
| `.gitignore` | Exclude keystore files |

---

*Last updated: January 18, 2026*
*App version: Auto-generated from git commit count (e.g., 1.0.76)*
*Status: Closed testing active*
