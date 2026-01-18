---
name: play-store-publishing
description: Helps with Google Play Store app publishing workflow. Use when preparing releases, managing testers, troubleshooting sign-in issues, or checking publishing status. Automatically reads the setup guide for context.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - Write
---

# Google Play Store Publishing Workflow for SplitBi

When this skill is activated, first read the comprehensive setup guide:
- **Full guide:** `docs/launch/PLAY_STORE_SETUP.md`

This file contains current status, all form values, SHA-1 fingerprints, and step-by-step instructions.

## Common Tasks

### Check Current Status
1. Read `docs/launch/PLAY_STORE_SETUP.md` - look at "Current Status & Next Steps" section
2. Report where we are in the publishing process
3. List immediate next actions

### Prepare New Release
1. Increment version in `android/app/build.gradle`:
   - `versionCode` - must increase for each upload
   - `versionName` - semantic version (e.g., "1.0.3")
2. Update `src/version.ts` to match
3. Build: `npm run build && npx cap sync android`
4. Create AAB: `cd android && ./gradlew bundleRelease`
5. Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Add Testers to Closed Testing
Guide the user through:
1. Check Google Form responses
2. Add emails to Play Console → Testing → Closed testing → Alpha → Testers
3. Send opt-in link: `https://play.google.com/apps/testing/app.splitbi.splitbi`

### Troubleshoot Google Sign-In
If "Something went wrong" error:
1. Check Firebase Console has BOTH SHA-1 fingerprints:
   - Upload key: `05:85:3B:78:73:46:BF:A2:D2:1A:8A:EC:B7:45:A8:E5:AD:A5:24:46`
   - App signing key: `FA:48:E6:E4:81:42:07:EE:E5:4F:60:5E:DD:E9:5C:F6:D4:CC:31:76`
2. App signing key is found in: Play Console → Setup → App integrity → App signing

### Update Documentation
After any significant step, update `docs/launch/PLAY_STORE_SETUP.md`:
- Update the checklist in "Where We Are Now"
- Add any new troubleshooting items discovered
- Update timestamps

## Key Links

| Resource | URL |
|----------|-----|
| Play Console | https://play.google.com/console |
| Firebase Console | https://console.firebase.google.com |
| Tester signup form | https://forms.gle/iqXkrtbmauh6PzWD9 |
| Tester opt-in link | https://play.google.com/apps/testing/app.splitbi.splitbi |
| Privacy policy | https://splitbi.app/privacy |
| Delete account | https://splitbi.app/delete-account |

## Publishing Checklist

Before each release:
- [ ] Version code incremented
- [ ] Version name updated
- [ ] Web build successful (`npm run build`)
- [ ] Capacitor synced (`npx cap sync android`)
- [ ] AAB built successfully
- [ ] Release notes written
- [ ] Tested on physical device

## Questions to Ask User

When helping with publishing:
1. What stage are you at? (internal testing, closed testing, production)
2. Are you creating a new release or troubleshooting?
3. How many testers have opted in so far?
