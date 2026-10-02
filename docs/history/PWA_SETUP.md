# Progressive Web App (PWA) Setup Guide

## Overview

Dr. Sbaitso Recreated can be installed as a Progressive Web App (PWA), allowing it to run as a standalone desktop or mobile application. Once installed, it launches in its own window without browser chrome, works offline, and integrates with your operating system like a native app.

## Benefits of PWA Installation

### Desktop Experience
- **Standalone Window**: Runs without browser tabs and address bar
- **Application Menu**: Appears in Start Menu (Windows), Applications folder (Mac), or app drawer (Linux)
- **Alt+Tab Switching**: Shows as separate app in task switcher
- **Desktop Icon**: Optional shortcut on desktop
- **System Integration**: File associations, notifications (future)

### Mobile Experience
- **Home Screen Icon**: Add to Android/iOS home screen
- **Full-Screen Mode**: No browser UI, maximizes screen space
- **App Switcher**: Appears as standalone app in recent apps
- **Splash Screen**: Branded loading screen on launch
- **Orientation Lock**: Portrait/landscape control

### Performance
- **Faster Launch**: Skip browser startup
- **Offline Support**: Works without internet (after first load)
- **Resource Caching**: Assets loaded from cache
- **Reduced Overhead**: No browser tabs/extensions

### Privacy
- **Isolated Storage**: Separate from browser
- **No Tracking**: No browser history integration
- **Clean Environment**: Fresh cookie/cache scope

---

## Installation Instructions

### Desktop (Chrome/Edge)

#### Automatic Install Prompt

1. **Visit Site**: Navigate to Dr. Sbaitso Recreated
2. **Wait for Prompt**: Install banner appears automatically (if eligible)
3. **Click "Install"**: Confirm installation
4. **App Opens**: Launches in standalone window
5. **Done**: App now in applications menu

**Note**: Prompt appears once per device. If dismissed, use manual method below.

#### Manual Installation

**Chrome/Edge**:
1. Click **⋮** (three dots) in top-right
2. Select **"Install Dr. Sbaitso Recreated"** or **"Apps" → "Install this site as an app"**
3. Confirm installation dialog
4. App launches automatically

**Windows**:
- App appears in Start Menu → All Apps → "Dr. Sbaitso Recreated"
- Right-click icon → Pin to Start / Pin to Taskbar

**macOS**:
- App appears in Applications folder
- Drag to Dock for quick access

**Linux**:
- App appears in application launcher
- Add to favorites for dock/panel

### Desktop (Firefox)

**Note**: Firefox has limited PWA support on desktop. Use Chrome or Edge for best experience.

**Workaround**:
- Use "Create Site Shortcut" extension
- Or bookmark and open in separate window

### Mobile (Android)

#### Chrome for Android

1. **Visit Site**: Open Dr. Sbaitso in Chrome
2. **Tap Menu**: ⋮ (three dots) in top-right
3. **Add to Home Screen**: Select from menu
4. **Confirm**: Tap "Add" or "Install"
5. **Icon Appears**: On home screen with app name
6. **Launch**: Tap icon to open in full-screen

**Alternative Method**:
- Chrome may show banner at bottom: "Add Dr. Sbaitso to Home Screen"
- Tap banner → Install

#### Samsung Internet

1. Visit site
2. Tap Menu → Add page to → Home screen
3. Edit name if desired
4. Tap Add

### Mobile (iOS)

**Safari** (iOS 11.3+):

1. **Visit Site**: Open Dr. Sbaitso in Safari
2. **Tap Share Button**: □↑ at bottom center
3. **Scroll Down**: Find "Add to Home Screen"
4. **Tap "Add to Home Screen"**
5. **Edit Name**: (optional)
6. **Tap "Add"**
7. **Icon Appears**: On home screen

**Features on iOS**:
- Full-screen mode (no Safari UI)
- Standalone app in task switcher
- Separate from Safari tabs
- Persistent login/settings

**Limitations on iOS**:
- No background sync
- No push notifications
- Limited offline support

---

## Verifying Installation

### Desktop

**Installed Successfully If**:
- App has own window (no browser tabs/address bar)
- App icon in applications menu
- Window title shows "Dr. Sbaitso Recreated"
- Separate process in task manager

**Check Window**:
- URL bar should be hidden
- Browser tabs should not be visible
- Minimalist title bar with app name only

### Mobile

**Installed Successfully If**:
- Icon on home screen with app name
- Opens in full-screen (no browser UI)
- Separate from browser in app switcher
- Shows splash screen on launch

---

## Using the Installed App

### Launching

**Desktop**:
- **Windows**: Start Menu → Dr. Sbaitso Recreated
- **macOS**: Applications → Dr. Sbaitso Recreated
- **Linux**: Application Launcher → Dr. Sbaitso Recreated

**Mobile**:
- Tap home screen icon

### Features Available Offline

After first visit with internet, these work offline:
- ✅ Full conversation interface
- ✅ All UI features
- ✅ Theme customization
- ✅ Sound settings
- ✅ Music player
- ✅ Saved conversations
- ✅ Custom sound packs
- ❌ AI responses (requires internet)
- ❌ New TTS audio (requires internet)

**Offline Mode**:
- Browse past conversations
- Adjust settings
- Play music
- Use sound packs
- Cannot start new AI conversations

### Updates

PWAs auto-update when:
- You launch the app
- New version detected on server
- Automatic background sync (if service worker active)

**Force Update**:
1. Close app completely
2. Clear browser cache (in browser, not app)
3. Relaunch app

---

## Managing the Installed App

### Desktop

#### Uninstall (Chrome/Edge)

**Method 1 - From App**:
1. Launch Dr. Sbaitso app
2. Click ⋮ (three dots) in app window
3. Select "Uninstall Dr. Sbaitso Recreated"
4. Confirm

**Method 2 - From Browser**:
1. Open Chrome/Edge
2. Navigate to `chrome://apps` or `edge://apps`
3. Right-click Dr. Sbaitso icon
4. Select "Uninstall from Chrome/Edge"

**Method 3 - From OS** (Windows):
1. Settings → Apps → Apps & features
2. Find "Dr. Sbaitso Recreated"
3. Click → Uninstall

#### Settings

**App-Specific Settings**:
1. Launch app
2. Click ⋮ → Settings (if available)
3. Adjust permissions, storage, etc.

### Mobile

#### Uninstall (Android)

1. Long-press home screen icon
2. Drag to "Uninstall" or "Remove"
3. Confirm

**Or**:
- Settings → Apps → Dr. Sbaitso Recreated → Uninstall

#### Uninstall (iOS)

1. Long-press home screen icon
2. Tap "Remove App"
3. Select "Delete App"
4. Confirm

**Or**:
- Settings → General → iPhone Storage → Dr. Sbaitso Recreated → Delete App

---

## Troubleshooting

### Install Option Not Appearing

**Desktop**:

**Causes**:
- Site already installed
- Browser doesn't support PWA
- HTTPS requirement not met (localhost exempt)
- Manifest errors

**Solutions**:
1. **Check if Already Installed**:
   - Look in applications menu
   - Check `chrome://apps`

2. **Use Supported Browser**:
   - Chrome 90+ or Edge 90+
   - Update to latest version

3. **Clear Browser Data**:
   - Settings → Privacy → Clear browsing data
   - Check "Cached images and files"
   - Clear and retry

4. **Verify HTTPS**:
   - URL must start with `https://`
   - Or use `localhost` for development

**Mobile (Android)**:

**Causes**:
- Already installed
- Unsupported browser
- Insufficient visits (Chrome requires engagement)

**Solutions**:
1. Visit site multiple times
2. Spend 30+ seconds on site
3. Return after 5 minutes
4. Use Chrome (not other browsers)

**Mobile (iOS)**:

**Cause**:
- Safari is only browser supporting home screen apps on iOS
- Chrome/Firefox on iOS use Safari engine with limited support

**Solution**:
- Always use Safari for iOS installation
- "Add to Home Screen" is manual only (no auto-prompt)

### App Won't Launch

**Desktop**:

**Symptoms**:
- Click icon, nothing happens
- Error message appears
- Opens in browser tab instead

**Solutions**:
1. **Reinstall**:
   - Uninstall completely
   - Clear cache
   - Reinstall from browser

2. **Check Browser Settings**:
   - Ensure apps are enabled
   - Check site permissions

3. **OS-Specific**:
   - **Windows**: Check Windows Defender SmartScreen settings
   - **macOS**: System Preferences → Security & Privacy → Allow app
   - **Linux**: Check executable permissions

**Mobile**:

**Symptoms**:
- Icon opens browser instead of app
- Crashes immediately
- Shows error screen

**Solutions**:
1. **Reinstall**: Delete icon and re-add to home screen
2. **Clear Cache**: In browser (not installed app)
3. **Update OS**: Ensure iOS/Android is up to date
4. **Free Space**: Ensure sufficient storage (500MB+)

### Offline Mode Not Working

**Symptoms**:
- "No Internet" error when offline
- Features unavailable
- Blank screens

**Cause**:
- Service worker not activated (future feature)
- First visit not completed while online
- Cache cleared

**Solutions**:
1. **Connect to Internet**:
   - Load site completely while online
   - Visit all features you want offline
   - Wait for resources to cache

2. **Check Service Worker** (future):
   - Visit `chrome://serviceworker-internals`
   - Verify Dr. Sbaitso worker is registered

3. **Force Reload**:
   - Close app
   - Open browser, visit site with internet
   - Reload completely (Ctrl+Shift+R)
   - Relaunch app

### Updates Not Applying

**Symptoms**:
- Old version still showing
- Features missing
- Bugs not fixed

**Solutions**:
1. **Hard Reload**:
   - Close PWA app
   - Open site in browser
   - Press Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Relaunch PWA

2. **Clear Cache**:
   - Browser settings → Clear cache
   - Relaunch app

3. **Reinstall**:
   - Uninstall PWA
   - Clear all browser data for site
   - Reinstall

---

## Advanced Configuration

### Manifest Customization

Developers can modify `public/manifest.json`:

```json
{
  "name": "Dr. Sbaitso Recreated",
  "short_name": "Dr. Sbaitso",
  "description": "1991 AI Therapist Recreated",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0000AA",
  "theme_color": "#0000AA",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Key Properties**:
- `display`: Controls app window mode (standalone, fullscreen, minimal-ui)
- `start_url`: Initial launch URL
- `theme_color`: Android status bar color
- `icons`: Must include 192x192 and 512x512 sizes

### Service Worker (Coming in Future Update)

**Planned Features**:
- Offline AI responses (cached)
- Background sync
- Push notifications
- Resource caching strategies

**Current Status**:
- Basic manifest PWA support (v1.10.0)
- Service worker planned for v1.11.0
- Full offline mode in v1.12.0

### Development Testing

**Test PWA Locally**:
```bash
# Must use HTTPS or localhost
npm run dev    # Development server (localhost)
npm run build  # Build production
npm run preview # Test production build
```

**Chrome DevTools**:
1. Open DevTools (F12)
2. Application tab
3. Manifest section: Verify manifest loads
4. Service Workers section: Check registration (future)

---

## Browser Support Matrix

| Platform | Browser | Version | Support Level |
|----------|---------|---------|---------------|
| **Desktop** |
| Windows | Chrome | 90+ | ✅ Full |
| Windows | Edge | 90+ | ✅ Full |
| Windows | Firefox | 100+ | ⚠️ Limited |
| macOS | Chrome | 90+ | ✅ Full |
| macOS | Edge | 90+ | ✅ Full |
| macOS | Safari | 14+ | ⚠️ Limited |
| Linux | Chrome | 90+ | ✅ Full |
| Linux | Edge | 90+ | ✅ Full |
| Linux | Firefox | 100+ | ⚠️ Limited |
| **Mobile** |
| Android | Chrome | 90+ | ✅ Full |
| Android | Edge | 90+ | ✅ Full |
| Android | Samsung | 14+ | ✅ Full |
| Android | Firefox | 100+ | ⚠️ Limited |
| iOS | Safari | 11.3+ | ✅ Full |
| iOS | Chrome | Any | ❌ Use Safari |
| iOS | Edge | Any | ❌ Use Safari |

**Legend**:
- ✅ Full: All features supported
- ⚠️ Limited: Basic install, some features missing
- ❌ Not Supported: Use alternative browser

---

## Security & Privacy

### Data Storage

**Local Only**:
- All data stored on device
- No cloud sync (yet)
- Private by default

**Storage Locations**:
- **Browser**: IndexedDB, localStorage (shared with web)
- **PWA**: Separate storage scope (isolated)

### Permissions

**Requested**:
- **Microphone**: For sound pack recording
- **Notifications**: (future) For background updates

**Not Requested**:
- **Location**: Never needed
- **Camera**: Not used
- **Contacts**: Not accessed
- **Files**: Optional for export only

### Privacy Benefits

**PWA vs Web**:
- Separate cookie scope
- Isolated from browser tracking
- No shared credentials
- Independent cache

---

## FAQ

### Q: Do I need to keep my browser open?
**A**: No. PWA runs independently of browser.

### Q: Can I have both web and PWA versions?
**A**: Yes. Separate storage and settings.

### Q: Will it work on my iPad?
**A**: Yes, using Safari's "Add to Home Screen" feature.

### Q: Does it use mobile data?
**A**: Only for AI responses. UI and features work offline.

### Q: Can I uninstall easily?
**A**: Yes. Uninstall like any other app.

### Q: Will I get notifications?
**A**: Not yet. Planned for future update.

### Q: Can I change the icon?
**A**: Not directly. Developers can customize in manifest.

### Q: Is there a Chrome extension version?
**A**: No. PWA provides similar benefits with better OS integration.

---

## Resources

### Official Documentation
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA Guide](https://web.dev/progressive-web-apps/)
- [Chrome: Install PWA](https://support.google.com/chrome/answer/9658361)

### Tools
- [PWA Builder](https://www.pwabuilder.com/) - Generate assets
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Audit PWA
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator) - Icons

### Dr. Sbaitso Resources
- [GitHub Repository](https://github.com/doublegate/DrSbaitso-Recreated)
- [Feature Documentation](./FEATURES.md)
- [Issue Tracker](https://github.com/doublegate/DrSbaitso-Recreated/issues)

---

## Future Enhancements

**Roadmap**:
- **v1.11.0**: Service worker implementation
- **v1.12.0**: Full offline mode with cached AI
- **v1.13.0**: Background sync and notifications
- **v2.0.0**: Cloud sync across devices

**Stay Updated**:
- Star the GitHub repository
- Watch for releases
- Join community discussions

---

**Version**: 1.11.0
**Last Updated**: November 2025
**Related**: [Features Overview](./FEATURES.md), [Music Mode Guide](./MUSIC_MODE.md), [Sound Packs Guide](./SOUND_PACKS_GUIDE.md)
