# Cloud Sync Guide

Firebase-powered cross-device session synchronization for Dr. Sbaitso Recreated.

**Version**: 1.7.0
**Last Updated**: 2025-10-30
**Status**: ⚠️ Requires Firebase Project Setup

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Setup](#setup)
4. [Usage](#usage)
5. [Security](#security)
6. [Troubleshooting](#troubleshooting)

---

## Overview

Cloud Sync enables you to:
- ☁️ Save conversations to the cloud
- 📱 Access from any device
- 🔄 Real-time synchronization
- 📴 Offline-first with automatic sync
- 🔒 Encrypted data transmission

### How It Works

1. **Sign In**: Anonymous or authenticated
2. **Auto-Sync**: Runs every 60 seconds (configurable)
3. **Conflict Resolution**: Last-write-wins strategy
4. **Offline Support**: Changes queued and synced when online

---

## Features

### Synchronized Data

- ✅ Conversation sessions
- ✅ App settings (theme, audio, etc.)
- ✅ Statistics and usage data
- ✅ Custom characters
- ❌ Temporary UI state (not synced)

### Sync Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Auto-Sync** | Syncs every N seconds | Real-time collaboration |
| **Manual Sync** | Sync on demand | Controlled updates |
| **Offline Queue** | Syncs when online | Unreliable connections |

---

## Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project**
3. Enter project name: `dr-sbaitso-sync`
4. Disable Google Analytics (optional)
5. Click **Create Project**

### 2. Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click **Create Database**
3. Start in **Production Mode**
4. Choose location (closest to users)
5. Click **Enable**

### 3. Configure Security Rules

In Firestore → Rules tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

This ensures users can only access their own data.

### 4. Get Firebase Config

1. Project Settings (⚙️) → General
2. Scroll to **Your apps**
3. Click **</> Web**
4. Register app: `Dr. Sbaitso Web`
5. Copy Firebase config object:

```javascript
{
  apiKey: "AIza...",
  authDomain: "dr-sbaitso-sync.firebaseapp.com",
  projectId: "dr-sbaitso-sync",
  storageBucket: "dr-sbaitso-sync.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123..."
}
```

### 5. Add Config to App

**Option A: Environment Variables** (Recommended for production)

Create `.env.local`:
```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_PROJECT_ID=dr-sbaitso-sync
```

**Option B: Hardcode** (Development only)

In App.tsx or settings component, call:
```typescript
await cloudSync.initialize({
  apiKey: 'AIza...',
  projectId: 'dr-sbaitso-sync',
  // ... other config
});
```

---

## Usage

### Enable Cloud Sync

1. Open Dr. Sbaitso
2. Click **☁️ Cloud Sync** button (header)
3. Click **SIGN IN ANONYMOUSLY**
4. Toggle **Enable Cloud Sync**
5. Configure auto-sync settings

### Manual Sync

1. Open Cloud Sync Settings
2. Click **🔄 SYNC NOW**
3. Wait for confirmation

### Auto-Sync Configuration

```typescript
// Sync every 30 seconds
cloudSync.updateOptions({
  autoSync: true,
  syncInterval: 30000, // milliseconds
});
```

### Programmatic Usage

```typescript
import { CloudSync } from '@/utils/cloudSync';

const sync = CloudSync.getInstance();

// Initialize
await sync.initialize(firebaseConfig);

// Sign in
await sync.signInAnonymously();

// Upload data
await sync.uploadData({
  sessions: getAllSessions(),
  settings: getSettings(),
  stats: getStats(),
  customCharacters: getCustomCharacters(),
  updatedAt: Date.now(),
  deviceId: getDeviceId(),
});

// Download data
const cloudData = await sync.downloadData();

// Bidirectional sync
const result = await sync.syncData(localData);
if (result) {
  // Cloud data was newer, apply it
  applySyncData(result);
}

// Listen for remote changes
const unsubscribe = await sync.subscribeToChanges((data) => {
  console.log('Remote change detected:', data);
  applySyncData(data);
});

// Clean up
unsubscribe();
```

---

## Security

### Data Encryption

- ✅ **In Transit**: HTTPS/TLS encryption
- ✅ **At Rest**: Firebase encryption
- ⚠️ **Client-Side**: Data readable by user (as designed)

### Authentication

**Anonymous Sign-In**:
- No email/password required
- Unique ID per browser
- Data tied to anonymous user

**Future**: Email/password, Google Sign-In

### Firebase Security Rules

Current rules ensure:
- Users can only read/write their own data
- Authentication required for all operations
- No public read/write access

### Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** in production
3. **Enable App Check** for production (prevents abuse)
4. **Monitor usage** in Firebase Console
5. **Set up billing alerts** to prevent overages

---

## Troubleshooting

### Sync Not Working

**Problem**: Data not syncing

**Solutions**:
1. Check internet connection
2. Verify Firebase config is correct
3. Ensure user is signed in (`isAuthenticated` = true)
4. Check Firestore security rules
5. Look for errors in browser console

### Authentication Failed

**Problem**: Sign-in fails

**Solutions**:
1. Enable Anonymous Authentication in Firebase Console:
   - Authentication → Sign-in method
   - Anonymous → Enable
2. Verify Firebase config (apiKey, projectId)
3. Check for CORS issues (production domain whitelisted?)

### Quota Exceeded

**Problem**: Firebase free tier limits exceeded

**Limits** (Free Spark Plan):
- Firestore reads: 50,000/day
- Firestore writes: 20,000/day
- Storage: 1 GB

**Solutions**:
1. Reduce sync frequency (increase `syncInterval`)
2. Disable auto-sync
3. Upgrade to Firebase Blaze plan (pay-as-you-go)

### Conflicts

**Problem**: Data conflicts between devices

**Current Behavior**: Last-write-wins (newer data overwrites older)

**Future**: Manual conflict resolution option

### Data Loss

**Problem**: Synced data disappeared

**Prevention**:
1. Export conversations regularly
2. Don't rely solely on cloud sync for backups
3. Use local storage as primary
4. Cloud sync as secondary backup

---

## Firebase Costs

### Free Tier (Spark Plan)

- Reads: 50,000/day
- Writes: 20,000/day
- Deletes: 20,000/day
- Storage: 1 GB

**Typical Usage**:
- 1 sync/minute = 1,440 writes/day
- 10 sessions = ~10 KB storage
- Well within free limits for personal use

### Paid Tier (Blaze Plan)

- $0.06 per 100,000 reads
- $0.18 per 100,000 writes
- $0.02 per 100,000 deletes
- $0.18/GB/month storage

**Estimated Cost** (1,000 users):
- 1M writes/month = $1.80
- 500 MB storage = $0.09
- **Total**: ~$2/month

---

## Roadmap

### Planned Features

- [ ] Email/password authentication
- [ ] Google Sign-In integration
- [ ] Selective sync (choose what to sync)
- [ ] Conflict resolution UI
- [ ] Shared conversations (collaborate)
- [ ] Export to cloud storage (Google Drive, Dropbox)
- [ ] End-to-end encryption option

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Pricing](https://firebase.google.com/pricing)

---

**Note**: Cloud Sync is an **optional** feature. Dr. Sbaitso works fully offline without it.
