# Splitbi - Project Context Summary

**Last Updated:** October 13, 2025  
**Status:** ✅ Production-Ready, Live & Launched  
**Developer:** Sujit Gangadharan (gsujit@gmail.com)

---

## 📱 What is Splitbi?

A privacy-first Progressive Web App (PWA) for tracking and splitting shared expenses. Built with React, TypeScript, Firebase, and Tailwind CSS.

**Primary URL:** https://splitbi.app ✅  
**Backup URL:** https://splitlyapp-cc612.web.app ✅  

---

## 🎯 Core Features

### **Expense Management**
- Create groups (roommates, trips, events, family)
- Add expenses with 4 split methods: Equal, Unequal, Percentage, Shares
- Real-time balance calculation with debt simplification algorithm
- Search/filter by description, category, or person
- Export to CSV

### **User System (Hybrid Model)**
- **Real Users:** Authenticated via Google/Email, control their own data
- **Guest Users:** Simulated users created by real users (no login needed)
- Privacy-scoped: Users only see their own data + guests they created
- Email-based invite system with accept/decline workflow

### **Collaboration**
- Send group invites by email
- Pending invites shown in Activity tab
- Accept/decline with automatic group joining
- No duplicate users - email is unique identifier
- 7-day invite expiry

### **UX Enhancements**
- Welcome empty state with examples
- Quick group switcher dropdown on dashboard
- Group context badge showing current group
- Info tooltips for guidance
- User menu dropdown for logout
- Comprehensive Help & FAQ modal
- Beautiful dark mode

---

## 🗄️ Data Architecture

### **Collections:**
```
users/
  - authType: 'google' | 'email' | 'simulated'
  - createdBy: userId (for simulated users)
  - role: 'admin' | 'user' (optional)
  - email: string (real users only)

groups/
  - members: string[] (user IDs)

expenses/
  - groupId, paidBy, splits[], splitMethod, category

groupInvites/
  - invitedEmail, invitedBy, status, groupId
  - status: 'pending' | 'accepted' | 'declined'

notifications/
  - type: expense_added | payment_recorded | group_invite
  - inviteId: string (for invite notifications)
```

### **Privacy Model:**
- Users fetched via: `where('createdBy', '==', currentUser.id)` + current user doc
- NO global user list
- Invite-only collaboration (consent-based)
- Firestore security rules enforce scoping

---

## 🔑 Key Technical Decisions

### **Phase 1: Privacy & Security**
- Scoped data fetching (users only see their data)
- AuthType tracking (google/email/simulated)
- CreatedBy field for ownership
- Security rules updated for privacy

### **Phase 2: Email Invites**
- GroupInvite collection for invite management
- Notification integration
- Accept/decline handlers
- Auto-join on acceptance

### **Admin Tools**
- Role-based admin access (set `role: 'admin'` in Firestore)
- Database stats viewer
- Export all data (JSON backup)
- Orphaned data checker
- ONE-TIME cleanup script (already used, button removed)

---

## 🎨 UI/UX Components

**Key Components:**
- `App.tsx` (1090+ lines) - Main orchestrator
- `BalanceSummary.tsx` - Group dashboard with balances
- `AddExpenseForm.tsx` - 4 split methods with AI suggestions
- `GroupManagementModal.tsx` - Manage members, invite by email, create guests
- `ActivityScreen.tsx` - Notifications + pending invites
- `ProfileScreen.tsx` - User account + guest management + admin tools
- `HelpModal.tsx` - Comprehensive FAQ (5 tabs)
- `InviteMemberModal.tsx` - Email invite sender
- `GroupSelector.tsx` - Quick group switcher
- `InfoTooltip.tsx` - Contextual help tooltips

**Special Features:**
- AI-powered expense suggestions (Gemini API)
- Debt simplification algorithm (utils/debtSimplification.ts)
- PWA with offline support
- Dark mode with system preference detection
- Install banner for PWA promotion

---

## 📁 Important Files

**Core:**
- `App.tsx` - Main app logic
- `types.ts` - TypeScript interfaces
- `firebase.ts` - Firebase config
- `contexts/AuthContext.tsx` - Authentication

**Documentation:**
- `BETA_LAUNCH_GUIDE.md` - Launch checklist & strategy
- `MIGRATION_PHASE1.md` - Privacy system details
- `MIGRATION_PHASE2.md` - Invite system details
- `TECH_STACK.md` - Technology overview
- `PROJECT_CONTEXT.md` - Project background

**Utils:**
- `utils/debtSimplification.ts` - Debt optimization algorithm
- `utils/adminTools.ts` - Database stats & monitoring
- `utils/databaseCleanup.ts` - ONE-TIME cleanup (already used)
- `utils/export.ts` - CSV export functionality

---

## 🚀 Current Status

### **Database:** 
- ✅ Cleaned and fresh (production ready)
- ✅ One user: gsujit@gmail.com (admin)
- ✅ No test data

### **Code:**
- ✅ All features implemented
- ✅ Complete Splitbi rebrand applied
- ✅ Logo integration complete
- ✅ Committed to git
- ✅ Built and deployed successfully

### **Launch Status:**
- ✅ Live at https://splitbi.app
- ✅ Backup URL maintained
- ✅ PWA working with custom domain
- ✅ Logo displaying correctly
- ✅ Ready for user testing

---

## 🎯 Key Features for Users to Know

### **Two Ways to Add People:**
1. **Guest Users (People tab):** No login, you manage their expenses
2. **Email Invites (Group Management):** They get their own account

### **Guest User Deletion:**
- Hover over guest → See delete (🗑️) button
- Can only delete if: Not in groups + Balance = $0.00
- Prevents orphaned data

### **Navigation:**
- Quick group switcher on dashboard (dropdown)
- Bottom nav: Dashboard, Groups, Add (+), Activity, People
- User menu dropdown (click name) for logout
- Help & FAQ at bottom footer

---

## 🔐 Security & Privacy

- Firestore security rules enforce user-scoped reads
- Password authentication via Firebase
- Google OAuth integration
- Admin role manually set in Firestore
- No global user directory (privacy-first)

---

## 📊 Admin Access

**Current Admin:** gsujit@gmail.com (role: 'admin' in Firestore)

**Admin Capabilities:**
- View database stats (users, groups, expenses, invites)
- Export all data as JSON backup
- Check for orphaned data
- Monitor system health

**To add more admins:** Set `role: 'admin'` field in user document (Firebase Console)

---

## 🐛 Known Items

### **Minor:**
- TypeScript warning: `import.meta.env` (pre-existing, non-breaking)
- PWA install button visibility varies by browser

### **Future Enhancements (Not Implemented):**
- Email notifications via SendGrid/Firebase
- Shareable invite links (QR codes)
- Bulk invites
- Receipt photo upload
- Payment integrations (Venmo/PayPal)
- Account deletion in UI
- Cancel pending invites

---

## 💡 Important Context for Future Development

### **Privacy Architecture:**
- Users are scoped by `createdBy` field (simulated) or own auth
- Invites use email matching (case-insensitive)
- ONE email = ONE user (no duplicates)
- Security rules prevent unauthorized access

### **Guest vs Real Users:**
- Guest users: `authType: 'simulated'`, `createdBy: creatorUserId`
- Real users: `authType: 'google' | 'email'`, `email: string`
- Guest deletion requires: not in groups + balance settled

### **Invite Flow:**
1. Send invite → Creates GroupInvite document
2. Recipient signs up → Sees invite in Activity
3. Accept → User added to group.members array
4. Decline → Invite status updated, not added

### **Data Relationships:**
- Expenses → groupId, paidBy (userId), splits[userId]
- Groups → members[] (user IDs)
- GroupInvites → groupId, invitedEmail, invitedBy
- Notifications → inviteId (optional link)

---

## 🚀 Next Session Quick Start

**To continue work:**
1. Current admin: gsujit@gmail.com
2. Database is clean and production-ready
3. All Phase 1 & 2 features complete
4. Ready for beta testing
5. Check `BETA_LAUNCH_GUIDE.md` for launch strategy

**Common Tasks:**
- Add features: Check `types.ts` for data models
- Fix bugs: Check browser console + Firestore rules
- Monitor: Use admin tools in People tab
- Backup: Admin tools → Export All Data

---

## 📞 Support

**Developer:** Sujit Gangadharan  
**Email:** gsujit@gmail.com  
**Firebase Project:** splitlyapp-cc612  
**Repository:** github_jisujit_tektekgo/splitly

---

**END OF SUMMARY** - Ready for Beta Launch! 🎉

