# Mobile

The app runs in mobile browsers and can be installed to the home screen. Both screens
work with touch and an on-screen keyboard; the classic screen is built for a desktop-sized
display, so on phones Enhanced mode is the more comfortable one.

## Classic screen

- The 80x25 text screen is 720x400 CSS pixels at 1x and is scaled by whole numbers only,
  so the bitmap font stays crisp (`integerScale` in
  `src/components/classic/DosScreen.tsx`).
- Tap anywhere to focus the hidden input and bring up the keyboard. The input uses a
  16 px font so iOS does not zoom on focus, and `autocapitalize="characters"`.
- **Known limitation:** the scale never goes below 1, so a viewport narrower than 720 px
  or shorter than 400 px crops the screen at the edges. On a phone, use landscape, or
  switch to Enhanced mode.
- Switching screens on a touch device: open the page with `?mode=enhanced`, or use the
  home-screen shortcut *Enhanced Mode* of the installed app. (The "Switch to the
  enhanced interface" link appears only on keyboard focus.)

## Enhanced mode

- The layout fills the dynamic viewport height (`h-dvh`), so the input line stays above
  the keyboard and the browser toolbars.
- The header wraps; on screens up to 640 px wide, an open menu spans the full width.
- The status bar wraps onto several lines; the "Alt+Shift+X classic screen" hint is
  hidden on small screens.
- Buttons and inputs have a 44x44 px minimum touch target. Form fields use a 16 px font
  under 768 px wide, so iOS does not zoom.
- **Swipe right** anywhere (at least 75 px horizontally) closes the panel opened last,
  like a back gesture (`useGlobalSwipe` in `src/hooks/useTouchGestures.ts`, with
  `closeLatest` from `src/hooks/usePanels.ts`). Swiping left does nothing.
- Pinch zoom is allowed (the viewport does not set `maximum-scale` or
  `user-scalable=no`).

## Audio

Browsers keep audio locked until the first tap or key press. The first speech plays after
you submit your name (Enhanced) or type (classic). On iOS, the ring/silent switch can
mute Web Audio.

## Voice

Voice input and hands-free voice control use the Web Speech API: Chrome on Android and
Safari on iOS support it; Firefox does not. See [VOICE_INPUT.md](VOICE_INPUT.md).

## Installing

| Platform | How |
|---|---|
| Android (Chrome, Edge) | The app offers an install banner when the browser allows it, or use the browser menu > *Install app* / *Add to Home screen* |
| iOS / iPadOS (Safari) | Share > *Add to Home Screen* |

The installed app opens full screen. Long-press its icon for the shortcuts *Classic
Screen* and *Enhanced Mode*. On Android, sharing text or a link to the installed app puts
it, unsent, on the input line. See [PWA.md](PWA.md).

## Data use

Each reply is one `/api/chat` request (a few KB, since the conversation so far is sent
with it) and, unless muted, one `/api/tts` request returning raw 24 kHz 16-bit audio
(about 48 KB per second of speech). Muting speech (SOUND menu) saves the TTS traffic.
The app shell is cached by the service worker after the first visit.

## Troubleshooting

| Symptom | Check |
|---|---|
| No sound | Tap once first; check the silent switch (iOS) and media volume |
| Classic screen cut off | Rotate to landscape or use `?mode=enhanced` |
| Keyboard does not appear on the classic screen | Tap the screen once |
| Voice input unavailable | Use Chrome (Android) or Safari (iOS); allow the microphone |
