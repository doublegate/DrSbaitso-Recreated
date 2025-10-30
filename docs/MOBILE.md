# Mobile Documentation

Complete guide to using Dr. Sbaitso Recreated on mobile devices.

## Overview

Version 1.2.0 introduces full mobile support with touch-optimized UI, responsive layouts, and gesture controls. The application works seamlessly on iOS Safari, Chrome Android, and other mobile browsers.

## Mobile Features

### Responsive Design

**Breakpoints:**
- **Mobile**: <768px - Optimized for phones
- **Tablet**: 768-1024px - Optimized for tablets
- **Desktop**: >1024px - Full desktop experience

**Automatic Optimization:**
- UI scales to screen size
- Touch targets enlarged to 44x44px minimum
- Font sizes adjusted for readability
- Scrollbar thickness reduced on mobile
- Keyboard inputs optimized to prevent zoom

### Touch Gestures

**Swipe Gestures:**
- **Swipe Left**: Navigate to next AI character
- **Swipe Right**: Navigate to previous AI character
- **Swipe Up/Down**: Scroll message history (natural scrolling)

**Touch Actions:**
- **Tap**: Select buttons, activate inputs
- **Long Press**: Show context menus (future feature)
- **Double Tap**: Currently unused (reserved for future features)

### Virtual Keyboard Handling

**iOS Optimization:**
- Input font size set to 16px minimum (prevents auto-zoom)
- Viewport adjusts when keyboard appears
- Scroll position maintained during keyboard transitions
- Auto-scroll to active input field

**Android Optimization:**
- Keyboard overlay handled gracefully
- Input remains visible above keyboard
- Smooth keyboard transitions
- Auto-focus management

## Browser Support

### iOS Safari (14.1+)

**Supported Features:**
- ✅ AudioWorklet bit-crushing
- ✅ Touch gestures
- ✅ Responsive layout
- ✅ Voice input (with webkit prefix)
- ✅ Session storage
- ✅ Audio playback (requires user interaction first)

**Known Limitations:**
- AudioContext must start after user gesture
- No pull-to-refresh in standalone mode
- Limited background audio processing

### Chrome Android (88+)

**Supported Features:**
- ✅ Full AudioWorklet support
- ✅ Touch gestures
- ✅ Responsive layout
- ✅ Voice input (excellent support)
- ✅ Session storage
- ✅ Background audio (limited)

**Known Limitations:**
- Some devices may have voice recognition latency
- Battery usage higher during continuous voice listening

### Samsung Internet (15+)

**Supported Features:**
- ✅ AudioWorklet support
- ✅ Touch gestures
- ✅ Responsive layout
- ⚠️ Voice input (limited support)
- ✅ Session storage

**Known Limitations:**
- Voice input accuracy varies by device
- Some Samsung-specific UI quirks

## Installation

### Add to Home Screen (iOS)

1. Open Safari and navigate to the app
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name the app and tap "Add"
5. App icon appears on home screen

**Standalone Mode Benefits:**
- Full-screen experience
- No Safari UI chrome
- App-like experience
- Custom app icon

### Add to Home Screen (Android)

1. Open Chrome and navigate to the app
2. Tap the three-dot menu
3. Tap "Add to Home screen"
4. Name the app and tap "Add"
5. App icon appears on home screen

**Standalone Mode Benefits:**
- Immersive full-screen
- No browser UI
- Faster launch
- App-like behavior

## Performance Optimization

### Mobile Performance Tips

**Audio Quality:**
- Use "Authentic 8-bit" or "High Quality" presets on mobile
- "Modern Quality" provides best performance
- "Extreme Lo-Fi" most CPU-intensive

**Session Management:**
- Clear old sessions periodically (localStorage limited to ~5-10MB)
- Export important conversations to free up space
- Use statistics reset to clear accumulated data

**Battery Life:**
- Disable continuous voice listening when not needed
- Lower screen brightness
- Close app when finished (don't leave in background)

### Data Usage

**Network Usage:**
- Chat API: ~1-5KB per message
- TTS API: ~50-150KB per response
- AudioWorklet: Loaded once (~2KB)
- Total per session: ~500KB-2MB

**Offline Capabilities:**
- App shell cached after first load
- Audio processing works offline
- Chat/TTS requires internet connection

## Touch Gesture Implementation

### Using Touch Gestures in Your Code

```typescript
import { useTouchGestures } from '@/hooks/useTouchGestures';

const MyComponent = () => {
  const gestureRef = useTouchGestures<HTMLDivElement>({
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
    onSwipeUp: () => console.log('Swiped up'),
    onSwipeDown: () => console.log('Swiped down'),
    onLongPress: () => console.log('Long press'),
    onTap: () => console.log('Tapped'),
    swipeThreshold: 50, // pixels
    longPressDelay: 500, // milliseconds
    tapMaxDuration: 200, // milliseconds
  });

  return <div ref={gestureRef}>Swipe me!</div>;
};
```

### Global Swipe Detection

```typescript
import { useGlobalSwipe } from '@/hooks/useTouchGestures';

const App = () => {
  useGlobalSwipe({
    onSwipeLeft: () => nextCharacter(),
    onSwipeRight: () => previousCharacter(),
  });

  return <div>App content</div>;
};
```

## Responsive Design Implementation

### Using Media Query Hooks

```typescript
import {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useDeviceType,
  useViewportSize
} from '@/hooks/useMediaQuery';

const MyComponent = () => {
  const isMobile = useIsMobile(); // <768px
  const isTablet = useIsTablet(); // 768-1024px
  const isDesktop = useIsDesktop(); // >1024px
  const deviceType = useDeviceType(); // 'mobile' | 'tablet' | 'desktop'
  const { width, height } = useViewportSize();

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
};
```

### Custom Media Queries

```typescript
import { useMediaQuery, BREAKPOINTS } from '@/hooks/useMediaQuery';

const MyComponent = () => {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isTouchDevice = useMediaQuery(BREAKPOINTS.touch);
  const isHighDPI = useMediaQuery('(min-resolution: 2dppx)');

  return <div>Responsive content</div>;
};
```

## Troubleshooting

### Common Mobile Issues

**Audio not playing:**
- Ensure user has interacted with page first (tap anywhere)
- Check device volume and ringer/silent switch (iOS)
- Verify browser permissions for audio
- Try refreshing the page

**Voice input not working:**
- Check microphone permission in browser settings
- Verify microphone is not being used by another app
- Test in supported browser (Chrome, Safari, Edge)
- Check network connection (required for voice processing)

**Touch gestures not responding:**
- Ensure you're not in text selection mode
- Try refreshing the page
- Check browser console for errors
- Verify touch events are supported

**Keyboard issues:**
- If zoom occurs on input focus, report as bug
- If keyboard covers input, try scrolling manually
- If keyboard doesn't dismiss, tap outside input area

**Performance issues:**
- Clear browser cache and reload
- Close other browser tabs
- Restart browser app
- Lower audio quality preset
- Clear old sessions from localStorage

### Reporting Mobile Issues

When reporting mobile issues, please include:
- Device model and OS version
- Browser name and version
- Exact steps to reproduce
- Screenshot or screen recording
- Console error messages (if any)

## Advanced Mobile Features

### Haptic Feedback (Future)

Planned for v1.3.0:
- Vibration on button press
- Haptic feedback for voice input
- Vibration patterns for different events

### Offline Mode (Future)

Planned for v1.3.0:
- Service Worker for offline functionality
- Cached responses for common questions
- Offline session editing

### Mobile-Specific Themes (Future)

Planned for v1.3.0:
- Dark mode for OLED screens
- High-contrast mode for sunlight
- Battery-saving mode

## Accessibility on Mobile

### Touch Target Sizes

All interactive elements meet WCAG 2.1 AA standards:
- Minimum 44x44px touch targets
- Adequate spacing between targets
- Visual feedback on touch

### Screen Reader Support

Planned improvements in v1.3.0:
- Full VoiceOver support (iOS)
- TalkBack support (Android)
- Semantic HTML markup
- ARIA labels for all interactive elements

### Voice Control

Current voice input features:
- Voice-to-text for message input
- Voice commands (future)
- Voice navigation (future)

## Best Practices

### For Users

1. **Use in landscape mode** on phones for better text visibility
2. **Enable "Do Not Disturb"** for uninterrupted sessions
3. **Keep screen timeout long** during voice input
4. **Use headphones** for privacy and better audio quality
5. **Clear old sessions** regularly to maintain performance

### For Developers

1. **Test on real devices** not just emulators
2. **Handle touch events with passive listeners** for performance
3. **Respect safe area insets** for notched devices
4. **Optimize bundle size** for mobile networks
5. **Implement loading states** for slow connections

## Future Enhancements

Planned for future versions:
- [ ] Native mobile apps (iOS/Android)
- [ ] Push notifications for session reminders
- [ ] Biometric authentication for session privacy
- [ ] Cloud sync across devices
- [ ] Offline-first architecture
- [ ] Progressive Web App (PWA) manifest
- [ ] Share conversations via native share sheet
- [ ] Deep linking support
- [ ] Mobile-optimized onboarding flow

## Resources

- [Touch Events API](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Viewport Meta Tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag)
- [iOS Safari Web App](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Android Chrome WebAPK](https://developer.chrome.com/docs/android/trusted-web-activity/)

---

**Last Updated**: v1.2.0 (2025-10-30)
