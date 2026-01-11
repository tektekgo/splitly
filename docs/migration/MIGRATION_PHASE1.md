# Phase 1 Migration - User Privacy & Security

**Date:** October 13, 2025  
**Status:** ✅ Implemented  
**Priority:** CRITICAL (Privacy & Security Fix)

---

## 🎯 Problem Solved

### Before (Security Issues):
- ❌ App fetched **ALL users** from Firestore
- ❌ Anyone could see everyone's name/avatar
- ❌ Users could be added to groups without consent
- ❌ No privacy - global user list
- ❌ Wouldn't scale beyond 100+ users

### After (Secure & Private):
- ✅ Users only see themselves + guests they created
- ✅ No global user list
- ✅ Privacy-first architecture
- ✅ Scales to unlimited users
- ✅ Foundation for Phase 2 (invite system)

---

## 📋 Changes Made

### 1. **Updated Data Model** (`types.ts`)
```typescript
export type AuthType = 'google' | 'email' | 'simulated';

export interface User {
  id: string;
  name: string;
  email?: string; // Only for real users
  avatarUrl: string;
  authType: AuthType; // NEW: How user was created
  createdBy?: string; // NEW: Creator's user ID (for simulated)
  createdAt?: string; // NEW: Timestamp
}
```

### 2. **Updated Auth System** (`contexts/AuthContext.tsx`)
- Google Sign-In: Sets `authType: 'google'`, includes email
- Email Sign-Up: Sets `authType: 'email'`, includes email
- Both set `createdAt` timestamp

### 3. **Updated Simulated User Creation** (`App.tsx`)
- Sets `authType: 'simulated'`
- Sets `createdBy: currentUser.id` (ownership)
- Sets `createdAt` timestamp

### 4. **Updated Data Fetching** (`App.tsx`)
**CRITICAL CHANGE:**
```typescript
// OLD: Fetched ALL users
const usersSnapshot = await getDocs(collection(db, 'users'));

// NEW: Fetches only relevant users
const usersQuery = query(
    collection(db, 'users'),
    where('createdBy', '==', currentUser.id)
);
```

Now only loads:
- Current user (themselves)
- Guest users created by current user

### 5. **Updated UI** (`components/ProfileScreen.tsx`)
- Shows auth type: "Authenticated with Google" or "Email: user@example.com"
- Properly filters simulated users using `authType` field
- Clearer distinction between real and guest users

---

## 🔄 Data Migration Required?

### For Existing Users in Database:

**Existing real users** (logged in via Google/Email):
- Missing: `authType`, `email`, `createdAt`
- **Action:** Will auto-populate on next login (handled in AuthContext)
- **Status:** ✅ No manual migration needed

**Existing simulated users** (created before this update):
- Missing: `authType`, `createdBy`, `createdAt`
- **Problem:** Won't show up for ANY user (no createdBy field)
- **Action:** Manual migration or recreate

### Migration Options:

#### Option A: Fresh Start (Recommended for testing)
```bash
# Delete all simulated users from Firestore
# Users will recreate them with new fields
```

#### Option B: Migration Script (If preserving data)
```javascript
// Run once to update existing simulated users
const users = await getDocs(collection(db, 'users'));
users.forEach(async (doc) => {
  const user = doc.data();
  
  // If user has no authType, determine it
  if (!user.authType) {
    // Check if this is a real user (has Firebase Auth)
    const authUser = await getAuth().getUser(doc.id).catch(() => null);
    
    if (authUser) {
      // Real user - update with auth info
      await updateDoc(doc.ref, {
        authType: authUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
        email: authUser.email,
        createdAt: user.createdAt || new Date().toISOString()
      });
    } else {
      // Simulated user - needs manual assignment
      // Assign to a specific user OR delete and recreate
      console.log(`Orphaned simulated user: ${user.name} (${doc.id})`);
    }
  }
});
```

#### Option C: Assign Orphans (If you know the owner)
```javascript
// Assign all orphaned simulated users to a specific user
const orphanedUsers = users.filter(u => !u.authType);
orphanedUsers.forEach(async (user) => {
  await updateDoc(user.ref, {
    authType: 'simulated',
    createdBy: 'OWNER_USER_ID', // Replace with actual owner
    createdAt: new Date().toISOString()
  });
});
```

---

## 🧪 Testing Checklist

### Test 1: New User Sign-Up
- [ ] Sign up with Google → Check `authType: 'google'`
- [ ] Sign up with Email → Check `authType: 'email'`
- [ ] Verify `email` and `createdAt` are set

### Test 2: Create Simulated User
- [ ] Go to People tab
- [ ] Add guest user "Test Guest"
- [ ] Check Firestore: verify `authType: 'simulated'`, `createdBy`, `createdAt`

### Test 3: Privacy - Can't See Other Users
- [ ] Create User A account
- [ ] User A creates guest "Guest A"
- [ ] Create User B account
- [ ] User B creates guest "Guest B"
- [ ] Verify: User A can't see User B or "Guest B"
- [ ] Verify: User B can't see User A or "Guest A"

### Test 4: Group Management
- [ ] User A creates group "Test Group"
- [ ] Add User A's guest to group → Should work ✅
- [ ] Try to add User B → Should not appear in list ✅

### Test 5: Profile Screen
- [ ] Check "Your Account" shows correct auth type
- [ ] Check "People You've Added" shows only your guests
- [ ] Count badge shows correct number

---

## 📊 Firestore Security Rules (Recommended Update)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Can read own user doc
      allow read: if request.auth.uid == userId;
      
      // Can read users you created (simulated users)
      allow read: if resource.data.createdBy == request.auth.uid;
      
      // Can create own user doc
      allow create: if request.auth.uid == userId;
      
      // Can update own user doc
      allow update: if request.auth.uid == userId;
      
      // Can create simulated users with your createdBy
      allow create: if request.resource.data.authType == 'simulated' 
                    && request.resource.data.createdBy == request.auth.uid;
    }
  }
}
```

---

## 🚀 Next Steps (Phase 2)

1. **Email Invite System**
   - Add `GroupInvite` collection
   - Send email invitations
   - Invite acceptance flow

2. **Privacy Settings**
   - "Allow anyone to add me" toggle
   - Email-based user search

3. **Simulated User Conversion**
   - Link simulated user to real user
   - Merge expense histories

---

## 🐛 Known Issues

1. **Existing simulated users won't appear** (see migration options)
2. **No way to invite real users yet** (Phase 2)
3. **Can't search for users by email yet** (Phase 2)

---

## 📝 Notes

- This is a **breaking change** for existing deployments
- Requires data migration or fresh start
- Sets foundation for future invite system
- Critical for scaling beyond beta testing

---

**Questions?** See discussion in commit history or contact development team.

