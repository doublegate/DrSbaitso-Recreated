# Progressive Web App (PWA) Guide

Complete guide to Dr. Sbaitso's Progressive Web App functionality, offline support, and installation.

**Version**: 1.7.0
**Last Updated**: 2025-10-30

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Offline Mode](#offline-mode)
4. [Service Worker](#service-worker)
5. [App Manifest](#app-manifest)
6. [Caching Strategy](#caching-strategy)
7. [Update Notifications](#update-notifications)
8. [Browser Support](#browser-support)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Dr. Sbaitso Recreated is a fully-featured Progressive Web App (PWA) that can be installed on your device like a native application. Key benefits:

- **Offline Access**: Continue using saved conversations without internet connection
- **Fast Loading**: Cached assets load instantly
- **Install to Home Screen**: Add app icon to your device
- **Fullscreen Experience**: Run in standalone mode without browser UI
- **Automatic Updates**: Seamless updates with user prompts
- **Cross-Platform**: Works on desktop, mobile, and tablets

### What Gets Cached?

- ✅ App shell (HTML, CSS, JavaScript)
- ✅ Static assets (icons, images)
- ✅ Audio processor worklet
- ✅ Previously loaded conversations
- ❌ Gemini API requests (always require internet)

---

## Installation

### Desktop Installation

#### Chrome/Edge (Windows, macOS, Linux)

1. Visit Dr. Sbaitso website
2. Look for the **install icon** (⊕) in the address bar
3. Click install icon → Click **Install**
4. App appears in Start Menu/Applications folder

Alternative method:
- Click **⋮** (menu) → **Install Dr. Sbaitso...**

#### Safari (macOS)

Safari doesn't support PWA installation on macOS. Use Chrome or Edge.

### Mobile Installation

#### iOS (Safari)

1. Open Dr. Sbaitso in Safari
2. Tap **Share** button (square with arrow)
3. Scroll down, tap **Add to Home Screen**
4. Tap **Add** in top-right corner
5. App icon appears on home screen

**Note**: iOS 14.1+ required for full PWA support.

#### Android (Chrome)

1. Open Dr. Sbaitso in Chrome
2. Tap **⋮** (menu) → **Add to Home screen**
3. Tap **Add** in dialog
4. App icon appears on home screen

Alternative: Tap the **install banner** when prompted.

### Install Prompt

When visiting Dr. Sbaitso for the first time, you may see an install prompt:

```
📱 INSTALL DR. SBAITSO

Install this app on your device for:
- Faster loading times
- Offline access to conversations
- Desktop/home screen icon
- Fullscreen experience

[INSTALL NOW] [LATER]
```

Click **INSTALL NOW** to add the app to your device.

---

## Offline Mode

### What Works Offline?

✅ **Available Offline**:
- View saved conversations
- Browse conversation history
- Search through saved sessions
- View statistics and analytics
- Access keyboard shortcuts help
- Switch themes and adjust settings
- Export conversations (Markdown, Text, JSON, HTML)

❌ **Requires Internet**:
- Start new conversations (Gemini API required)
- Voice input (Web Speech API requires connection)
- Cloud sync functionality
- Generate new AI responses

### Offline Indicator

When offline, you'll see a prominent indicator:

```
⚠️ OFFLINE MODE - LIMITED FUNCTIONALITY
```

This appears at the top of the screen and disappears when connection is restored.

### Offline Fallback

If you try to navigate while offline, you'll see:

```
OFFLINE MODE

   _______________
  |  DR. SBAITSO  |
  |_______________|
  |  [X]  [X]  [X] |
  |_______________|
  | NETWORK ERROR |
  |_______________|

YOU ARE CURRENTLY OFFLINE.
DR. SBAITSO REQUIRES AN INTERNET CONNECTION TO FUNCTION.
PLEASE CHECK YOUR NETWORK CONNECTION AND TRY AGAIN.

[RETRY CONNECTION]
```

---

## Service Worker

### What is a Service Worker?

A Service Worker is a background script that enables:
- Offline functionality
- Intelligent caching
- Background sync
- Push notifications (future feature)

### Service Worker Lifecycle

1. **Installation**: Downloads and caches app shell
2. **Activation**: Cleans up old caches
3. **Fetch**: Intercepts network requests and serves cached content
4. **Update**: Checks for new version hourly

### Manual Service Worker Control

**Check Registration**:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

**Unregister Service Worker**:
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  location.reload();
});
```

**Force Update**:
```javascript
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) reg.update();
});
```

### Service Worker Events

The app emits events you can listen for:

```javascript
// Online/Offline
window.addEventListener('online', () => console.log('Back online!'));
window.addEventListener('offline', () => console.log('Connection lost'));

// App installed
window.addEventListener('appinstalled', () => console.log('App installed!'));
```

---

## App Manifest

The Web App Manifest (`manifest.json`) defines app metadata:

```json
{
  "name": "Dr. Sbaitso Recreated",
  "short_name": "Dr. Sbaitso",
  "description": "A modern web-based recreation of the classic 1991 AI therapist",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000080",
  "theme_color": "#000080",
  "icons": [ /* 8 icon sizes */ ],
  "categories": ["entertainment", "health", "utilities"]
}
```

### Display Modes

- **`standalone`**: Fullscreen without browser UI (default)
- **`fullscreen`**: No browser UI, no status bar
- **`minimal-ui`**: Minimal browser UI (back button only)
- **`browser`**: Regular browser tab

### App Shortcuts

Quick actions from app icon (long-press on Android):

- **New Conversation**: Start fresh therapy session
- **Settings**: Configure audio, themes, accessibility

---

## Caching Strategy

### Cache-First Strategy

Used for: Images, fonts, icons

1. Check cache
2. If found → return cached version
3. If not found → fetch from network → cache → return

### Network-First Strategy

Used for: HTML, API calls

1. Try network
2. If succeeds → update cache → return
3. If fails → return cached version

### Stale-While-Revalidate

Used for: JavaScript, CSS

1. Return cached version immediately
2. Fetch new version in background
3. Update cache for next visit

### Cache Limits

- **Main Cache**: Unlimited (app shell only)
- **Runtime Cache**: 50 items maximum
- **Cache Age**: 7 days maximum
- **Total Size**: ~2-5 MB typical

### Clear Cache

Via Settings Panel:
1. Open Settings (⚙️ button)
2. Scroll to **Advanced**
3. Click **Clear Cache**
4. Confirm → Page reloads

Programmatically:
```javascript
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
  location.reload();
});
```

---

## Update Notifications

### Automatic Update Check

Dr. Sbaitso checks for updates:
- On app startup
- Every 60 minutes while running
- When regaining network connection

### Update Notification

When an update is available:

```
🔄 UPDATE AVAILABLE

A new version of Dr. Sbaitso is available.
Update now to get the latest features and improvements.

[UPDATE NOW] [LATER]
```

Click **UPDATE NOW** to:
1. Download new version
2. Activate new service worker
3. Reload page automatically

Click **LATER** to:
- Dismiss notification
- Continue using current version
- Update available on next reload

### Manual Update

Force check for updates:
```javascript
const registration = await navigator.serviceWorker.ready;
await registration.update();
```

### Skipping Waiting

Updates activate immediately when clicked:
```javascript
// Service worker receives message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

---

## Browser Support

### Desktop

| Browser | Version | PWA Support | Offline | Install | Notes |
|---------|---------|-------------|---------|---------|-------|
| Chrome | 88+ | ✅ Full | ✅ | ✅ | Recommended |
| Edge | 88+ | ✅ Full | ✅ | ✅ | Chromium-based |
| Firefox | 85+ | ⚠️ Partial | ✅ | ❌ | No install |
| Safari | 14+ | ⚠️ Limited | ✅ | ❌ | macOS only, no install |

### Mobile

| Browser | Platform | Version | PWA Support | Offline | Install | Notes |
|---------|----------|---------|-------------|---------|---------|-------|
| Chrome | Android | 88+ | ✅ Full | ✅ | ✅ | Best experience |
| Safari | iOS | 14.1+ | ✅ Full | ✅ | ✅ | iOS 14.1+ required |
| Samsung Internet | Android | 15+ | ✅ Full | ✅ | ✅ | Good support |
| Firefox | Android | 85+ | ⚠️ Partial | ✅ | ❌ | No install |

### Required Features

✅ **Required**:
- Service Worker API
- IndexedDB or localStorage
- Fetch API
- Promises

⚠️ **Optional**:
- Web App Manifest (for installation)
- beforeinstallprompt event (for install prompts)
- Background Sync (for future features)

---

## Troubleshooting

### PWA Won't Install

**Problem**: Install button doesn't appear

**Solutions**:
1. Ensure HTTPS (required for PWA)
2. Visit site at least twice
3. Wait 30 seconds on site
4. Interact with page (click, type)
5. Check manifest.json is valid
6. Verify service worker registered
7. Try incognito/private mode

**Check Install Criteria**:
```javascript
// Must be true for install prompt
const installable = [
  'HTTPS connection',
  'manifest.json present',
  'Service worker registered',
  'At least 2 page visits',
  '30+ seconds engagement'
];
```

### Service Worker Not Updating

**Problem**: Old version still running after update

**Solutions**:
1. Close all tabs of the app
2. Wait 24 hours (auto-update)
3. Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (macOS)
4. Unregister service worker manually
5. Clear browser cache

**Force Update**:
```javascript
// In DevTools Console
const reg = await navigator.serviceWorker.getRegistration();
await reg.update();
await reg.unregister();
location.reload();
```

### Offline Mode Not Working

**Problem**: App doesn't work offline

**Solutions**:
1. Verify service worker active: `navigator.serviceWorker.controller`
2. Check cache storage: DevTools → Application → Cache Storage
3. Ensure assets were cached during online use
4. Try visiting pages while online first
5. Check browser console for errors

**Verify Offline Capability**:
1. Open DevTools (F12)
2. Network tab → Throttling dropdown
3. Select "Offline"
4. Reload page
5. Should see cached content

### Cache Size Issues

**Problem**: localStorage quota exceeded

**Solutions**:
1. Export important conversations
2. Delete old sessions
3. Clear cache via Settings
4. Reduce conversation history
5. Increase browser storage limit (if possible)

**Check Storage Usage**:
```javascript
navigator.storage.estimate().then(estimate => {
  const usage = estimate.usage / 1024 / 1024; // MB
  const quota = estimate.quota / 1024 / 1024; // MB
  console.log(`Using ${usage.toFixed(2)} MB of ${quota.toFixed(2)} MB`);
});
```

### Icons Not Showing

**Problem**: App icon is blank or default

**Solutions**:
1. Verify icon files exist in `/icons/` directory
2. Check manifest.json icon paths
3. Ensure icons are correct sizes
4. Re-install app after fixing
5. Clear browser cache

**Required Icon Sizes**:
- 72×72, 96×96, 128×128, 144×144
- 152×152, 192×192, 384×384, 512×512

### HTTPS Required Error

**Problem**: PWA features disabled on HTTP

**Solutions**:
1. Deploy to HTTPS hosting (Vercel, Netlify, etc.)
2. Use localhost for development (allowed on HTTP)
3. Enable HTTPS on local server
4. Use ngrok for testing

**Note**: Service Workers only work on HTTPS (except localhost).

---

## Advanced Topics

### Background Sync

Future feature for syncing when connection is restored:

```javascript
// Register sync
await registration.sync.register('sync-sessions');

// Handle sync event in service worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-sessions') {
    event.waitUntil(syncSessions());
  }
});
```

### Periodic Background Sync

Future feature for scheduled updates:

```javascript
// Register periodic sync (every 24 hours)
const status = await registration.periodicSync.register('update-cache', {
  minInterval: 24 * 60 * 60 * 1000
});

// Handle periodic sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-cache') {
    event.waitUntil(updateCache());
  }
});
```

### Push Notifications

Future feature for important updates:

```javascript
// Request notification permission
const permission = await Notification.requestPermission();

// Subscribe to push
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: publicKey
});
```

---

## Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Google Workbox](https://developers.google.com/web/tools/workbox)

---

## Changelog

### v1.7.0 (2025-10-30)
- Initial PWA implementation
- Service worker with offline support
- Web app manifest with icons
- Install prompts and update notifications
- Comprehensive caching strategies
- Cross-platform installation support

---

**Need help?** Check the [main troubleshooting guide](TROUBLESHOOTING.md) or [open an issue](https://github.com/yourusername/DrSbaitso-Recreated/issues).
