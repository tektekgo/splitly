# 🚨 User Support & Debugging Guide

**For:** Splitbi Production Support  
**Updated:** January 2025

## 🔍 Quick Debugging Checklist

When a user reports an issue, follow this systematic approach:

### 1. **Get User Information**
```
✅ User's email/name
✅ What they were trying to do
✅ Exact error message
✅ Browser/device type
✅ When the error occurred
```

### 2. **Collect Error Details**
Ask the user to:
1. **Open Developer Tools** (F12)
2. **Go to Console tab**
3. **Reproduce the error**
4. **Copy ALL red error messages**
5. **Send you the console output**

### 3. **Check Firebase Console**

#### **Authentication Issues:**
```
Firebase Console → Authentication → Users
- Does the user exist?
- Check sign-in providers
- Look for failed attempts
```

#### **Firestore Issues:**
```
Firebase Console → Firestore → Usage
- Check "Failed writes" or "Failed reads"
- Look for quota limits
- Review security rule violations
```

#### **Security Rules:**
```
Firebase Console → Firestore → Rules
- Test rules in "Rules playground"
- Check for permission denied errors
```

## 🛠️ Common Issues & Solutions

### **"Failed to create user" Error**

**Investigation Steps:**
1. Check if user already exists in Authentication
2. Verify Firestore security rules allow user creation
3. Check Firebase quotas (free tier limits)
4. Look for network connectivity issues

**Solutions:**
```javascript
// Check security rules allow this:
match /users/{userId} {
  allow create: if request.auth != null && 
    request.auth.uid == userId;
}
```

**Admin Actions:**
- Check Firebase Console → Authentication → Users
- Verify user doesn't already exist
- Check Firestore → Usage for failed writes

### **"Missing or insufficient permissions" Error**

**Common Causes:**
- Security rules blocking access
- User not properly authenticated
- Admin role not set correctly

**Solutions:**
```javascript
// Ensure rules allow authenticated users:
match /users/{userId} {
  allow read, write: if request.auth != null;
}
```

### **"Network request failed" Error**

**Investigation:**
- Check Firebase service status
- Verify internet connectivity
- Check Firebase project configuration

**Solutions:**
- Ask user to refresh page
- Check if Firebase services are down
- Verify firebase.ts configuration

### **"Quota exceeded" Error**

**Investigation:**
- Check Firebase Console → Usage
- Review free tier limits
- Check for unusual activity

**Solutions:**
- Upgrade Firebase plan if needed
- Monitor usage patterns
- Implement usage limits

## 📊 Admin Tools for Debugging

### **Database Stats**
```
Profile → Admin Tools → View Database Stats
```
Shows:
- Total users, groups, expenses
- Error log count
- Migration status
- System health

### **Error Logs**
```
Profile → Admin Tools → Error Logs
```
Shows:
- Recent error logs
- User actions that failed
- Error context and details
- Browser/device information

### **Export Error Logs**
```
Profile → Admin Tools → Export Error Logs
```
Downloads JSON file with:
- All error details
- User information
- Timestamps
- Error context

## 🚨 Emergency Response Plan

### **Critical Issues (App Down/Data Loss):**
1. **Immediate:** Check Firebase Console for service outages
2. **Backup:** Export all data via Admin Tools
3. **Communication:** Update users via app notification
4. **Fix:** Deploy hotfix if needed

### **User-Specific Issues:**
1. **Investigate:** Use error logs and Firebase Console
2. **Test:** Reproduce issue in your environment
3. **Fix:** Update code if needed
4. **Verify:** Test fix with affected user

### **Performance Issues:**
1. **Monitor:** Firebase Console → Usage
2. **Analyze:** Error logs for patterns
3. **Optimize:** Database queries, security rules
4. **Scale:** Upgrade Firebase plan if needed

## 📋 Support Templates

### **Initial Response Template:**
```
Hi [User Name],

Thanks for reporting this issue. To help me debug this quickly, could you please:

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try to reproduce the error
4. Copy any red error messages and send them to me

Also, let me know:
- What browser are you using?
- Are you on mobile or desktop?
- When exactly did this happen?

I'll investigate this right away and get back to you with a solution.

Best regards,
Sujit
```

### **Solution Template:**
```
Hi [User Name],

I found the issue! [Brief explanation]

The fix is: [Solution steps]

I've deployed the fix, so please try again. If you still have issues, let me know.

Thanks for your patience!

Best regards,
Sujit
```

## 🔧 Technical Debugging Tools

### **Browser Console Commands:**
```javascript
// Check current user
console.log('Current user:', window.__currentUserId);

// Check error logs
console.log('Error logs:', JSON.parse(localStorage.getItem('splitbi-error-logs') || '[]'));

// Check Firebase connection
console.log('Firebase config:', firebase.app().options);

// Test Firestore connection
firebase.firestore().collection('test').doc('test').get()
  .then(() => console.log('Firestore connected'))
  .catch(err => console.error('Firestore error:', err));
```

### **Firebase Console Queries:**
```
// Check user creation failures
Firebase Console → Authentication → Users → Failed attempts

// Check Firestore errors
Firebase Console → Firestore → Usage → Failed operations

// Test security rules
Firebase Console → Firestore → Rules → Rules playground
```

## 📈 Monitoring & Prevention

### **Daily Checks:**
- [ ] Review error logs count
- [ ] Check Firebase usage quotas
- [ ] Monitor user sign-ups
- [ ] Review failed operations

### **Weekly Reviews:**
- [ ] Analyze error patterns
- [ ] Review user feedback
- [ ] Check performance metrics
- [ ] Update documentation

### **Monthly Actions:**
- [ ] Export and archive error logs
- [ ] Review and optimize security rules
- [ ] Plan for scaling if needed
- [ ] Update support procedures

## 🆘 Escalation Path

### **Level 1: Standard Issues**
- User can't create account
- Feature not working
- Data sync issues

**Response Time:** 24 hours  
**Tools:** Error logs, Firebase Console

### **Level 2: Critical Issues**
- App completely down
- Data loss/corruption
- Security concerns

**Response Time:** 2 hours  
**Tools:** All available, consider Firebase support

### **Level 3: Emergency**
- Complete service outage
- Major security breach
- Data loss affecting multiple users

**Response Time:** Immediate  
**Actions:** 
- Check Firebase status page
- Contact Firebase support
- Consider rollback
- Communicate with users

## 📞 Contact Information

**Primary Support:** gsujit@gmail.com  
**Firebase Support:** [Firebase Console → Support]  
**Emergency:** Use Firebase Console support for critical issues

---

**Remember:** Always ask for browser console logs first - they contain the most valuable debugging information!
