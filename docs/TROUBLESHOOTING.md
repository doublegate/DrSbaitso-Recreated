# Troubleshooting Guide

## Common Issues

### Development Setup

#### Issue: "Cannot find module '@google/genai'"

**Symptoms:**
```
Error: Cannot resolve module '@google/genai'
```

**Causes:**
- Dependencies not installed
- node_modules corrupted

**Solutions:**
```bash
# Solution 1: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Solution 2: Clear npm cache
npm cache clean --force
npm install

# Solution 3: Use specific npm version
npm install --legacy-peer-deps
```

#### Issue: "GEMINI_API_KEY is not set"

**Symptoms:**
```
Error: API_KEY environment variable is not set
```

**Causes:**
- Missing `.env.local` file
- Incorrect variable name
- File not in project root

**Solutions:**

1. **Create `.env.local` in project root:**
   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env.local
   ```

2. **Verify file location:**
   ```bash
   ls -la .env.local  # Should be in project root
   ```

3. **Check variable name:**
   - Must be `GEMINI_API_KEY` (not API_KEY, GEMINI_KEY, etc.)
   - Case-sensitive

4. **Restart dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

#### Issue: Dev server won't start on port 3000

**Symptoms:**
```
Error: Port 3000 is already in use
```

**Solutions:**

```bash
# Solution 1: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Solution 2: Use different port
vite --port 3001

# Solution 3: Find and kill the process manually
lsof -i:3000  # Find PID
kill -9 <PID>
```

#### Issue: TypeScript errors in IDE

**Symptoms:**
- Red squiggly lines in VSCode
- "Cannot find name 'process'" error

**Solutions:**

1. **Reload IDE:**
   - VSCode: `Cmd/Ctrl + Shift + P` → "Reload Window"

2. **Verify TypeScript config:**
   ```bash
   # Check types are installed
   npm list @types/node
   ```

3. **Restart TypeScript server:**
   - VSCode: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"

### API Issues

#### Issue: "Error getting response from Gemini"

**Symptoms:**
- Dr. Sbaitso displays error message
- Console shows API error
- Conversation fails to progress

**Diagnosis:**

Check browser console for specific error:

```javascript
// Open browser DevTools (F12)
// Check Console tab
```

**Common Errors:**

##### 1. Invalid API Key

```
Error: 400 API key not valid
```

**Solutions:**
- Verify API key is correct
- Get new key from https://aistudio.google.com/apikey
- Check for extra spaces in `.env.local`
- Rebuild application: `npm run build`

##### 2. Rate Limit Exceeded

```
Error: 429 Resource Exhausted
```

**Solutions:**
- Wait 60 seconds before retrying
- Check quota at https://console.cloud.google.com/
- Upgrade to paid tier
- Implement exponential backoff (future enhancement)

##### 3. Network Error

```
TypeError: Failed to fetch
```

**Solutions:**
- Check internet connection
- Verify firewall/proxy settings
- Check browser network tab for blocked requests
- Try different network (disable VPN)

##### 4. CORS Error

```
Access to fetch blocked by CORS policy
```

**Solution:**
- Should not occur (Gemini API allows browser requests)
- Check browser extensions (ad blockers, privacy tools)
- Disable extensions and retry

#### Issue: API calls work in dev but fail in production

**Symptoms:**
- Works with `npm run dev`
- Fails after `npm run build` or in deployed version

**Causes:**
- Environment variable not set during build
- Different API key for production

**Solutions:**

1. **Verify build-time environment variable:**
   ```bash
   GEMINI_API_KEY=your_key npm run build
   npm run preview  # Test production build
   ```

2. **Check deployment platform settings:**
   - Vercel: Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Ensure variable is set for Production

3. **Verify built code contains key:**
   ```bash
   # After build, search dist files
   grep -r "generativelanguage.googleapis.com" dist/
   # Should find API calls
   ```

### Audio Issues

#### Issue: No audio plays

**Symptoms:**
- Text appears normally
- No sound from speakers
- No errors in console

**Diagnosis Steps:**

1. **Check browser audio:**
   - Play any YouTube video
   - Verify system volume not muted

2. **Check AudioContext state:**
   ```javascript
   // In browser console
   console.log(audioContextRef.current?.state);
   // Should be "running"
   ```

3. **Check autoplay policy:**
   - Modern browsers block audio without user interaction
   - Ensure first audio plays after clicking/typing

**Solutions:**

1. **Refresh page and try again:**
   - Click/type to trigger audio
   - Autoplay requires user gesture

2. **Check browser permissions:**
   - Settings → Site Settings → Sound
   - Ensure site allowed to play sound

3. **Test in different browser:**
   - Chrome, Firefox, Safari
   - Identifies browser-specific issues

4. **Clear browser cache:**
   ```
   Cmd/Ctrl + Shift + Delete
   ```

#### Issue: Audio is choppy or glitchy

**Symptoms:**
- Audio cuts in and out
- Stuttering or popping sounds
- Incomplete playback

**Causes:**
- High CPU usage
- Low memory
- Network issues during TTS generation

**Solutions:**

1. **Close other tabs/applications:**
   - Free up CPU and memory
   - Disable browser extensions

2. **Check network speed:**
   - Slow connection affects TTS API
   - Wait for full audio generation

3. **Reduce audio quality** (requires code change):
   ```typescript
   // audio.ts
   const numLevels = 32;  // Reduce from 64 to 32
   ```

#### Issue: Audio sounds normal (not 8-bit)

**Symptoms:**
- Voice sounds clear and modern
- No distortion or quantization
- Missing retro character

**Causes:**
- Bit-crusher not working
- playbackRate not applied
- ScriptProcessorNode not connected

**Diagnosis:**

```javascript
// Browser console
console.log(audioContextRef.current);
// Check if AudioContext exists
```

**Solutions:**

1. **Verify bit-crusher code:**
   - Check `utils/audio.ts:42-59`
   - Ensure `onaudioprocess` callback exists

2. **Check node connections:**
   - `source.connect(bitCrusher)`
   - `bitCrusher.connect(ctx.destination)`
   - Verify in code at `audio.ts:67-68`

3. **Test with different audio:**
   - Refresh page
   - Submit new message
   - Listen for quantization artifacts

#### Issue: "The AudioContext was not allowed to start"

**Symptoms:**
```
The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.
```

**Causes:**
- Browser autoplay policy
- AudioContext created before user interaction

**Solutions:**

1. **Click anywhere on page:**
   - Triggers user gesture
   - Allows AudioContext to start

2. **Refresh page:**
   - Start by typing name
   - Ensures first interaction creates context

3. **Check ensureAudioContext():**
   ```typescript
   // Should be called in event handlers
   // App.tsx:72, App.tsx:122
   ```

### UI Issues

#### Issue: Input field not focused

**Symptoms:**
- Must click input to type
- Auto-focus not working

**Causes:**
- Focus timing issue
- Multiple inputs competing

**Solutions:**

1. **Click input manually:**
   - Temporary workaround

2. **Check focus effect:**
   - `App.tsx:43-54`
   - Verify `nameInputRef` and `inputRef` refs exist

3. **Increase focus delay:**
   ```typescript
   // App.tsx:48
   setTimeout(() => nameInputRef.current?.focus(), 100);
   // Increase from 50ms to 100ms
   ```

#### Issue: Messages don't auto-scroll

**Symptoms:**
- New messages appear off-screen
- Must manually scroll down

**Causes:**
- scrollToBottom() not triggering
- messagesEndRef not rendering

**Solutions:**

1. **Manual scroll:**
   - Scroll to bottom manually
   - Temporary workaround

2. **Check scroll effect:**
   - `App.tsx:39-41`
   - Verify dependencies correct

3. **Verify ref element:**
   ```typescript
   // App.tsx:249
   <div ref={messagesEndRef} />
   // Ensure element exists
   ```

#### Issue: Typewriter effect not working

**Symptoms:**
- Text appears instantly
- No character-by-character typing
- No blinking cursor

**Causes:**
- Loop not executing
- State not updating

**Diagnosis:**

```javascript
// Browser console during response
console.log('Typewriter speed:', 40);
// Should see gradual text appearance
```

**Solutions:**

1. **Check handleUserInput:**
   - `App.tsx:149-156`
   - Verify for loop executes

2. **Adjust typing speed:**
   ```typescript
   // App.tsx:148
   const typingSpeed = 20;  // Faster (from 40)
   ```

3. **Check message state:**
   ```javascript
   // Browser console
   console.log(messages[messages.length - 1]);
   ```

### Build Issues

#### Issue: Build fails with TypeScript errors

**Symptoms:**
```
npm run build
> vite build

src/App.tsx:123:5 - error TS2322: Type 'X' is not assignable to type 'Y'
```

**Solutions:**

1. **Fix TypeScript errors:**
   - Read error messages carefully
   - Fix type mismatches

2. **Skip type checking (not recommended):**
   ```bash
   vite build --mode production
   ```

3. **Check tsconfig.json:**
   - Verify `"jsx": "react-jsx"`
   - Ensure `"types": ["node"]`

#### Issue: Build succeeds but app doesn't work

**Symptoms:**
- `npm run build` completes
- `npm run preview` shows blank page or errors

**Diagnosis:**

```bash
# Check build output
ls -lh dist/

# Should see:
# - index.html
# - assets/index-*.js
# - assets/index-*.css
```

**Solutions:**

1. **Check browser console:**
   - Open `http://localhost:4173`
   - Check DevTools console for errors

2. **Verify base path:**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     base: '/',  // Ensure correct base
   });
   ```

3. **Check environment variable injection:**
   ```bash
   # Search built files
   grep "generativelanguage" dist/assets/*.js
   # Should find API endpoints
   ```

### React Issues

#### Issue: Component renders twice

**Symptoms:**
- Audio plays twice
- Duplicate API calls
- Console logs appear twice

**Cause:**
- React StrictMode in development
- Intentional behavior to detect side effects

**Solutions:**

1. **Expected in development:**
   - Only happens with `npm run dev`
   - Production build (`npm run preview`) renders once

2. **Add guards for side effects:**
   ```typescript
   // App.tsx:105-106
   if (playingGreetingIndexRef.current !== greetingIndex) {
     playingGreetingIndexRef.current = greetingIndex;
     // Prevents double execution
   }
   ```

3. **Disable StrictMode (not recommended):**
   ```typescript
   // index.tsx - Remove <React.StrictMode>
   root.render(<App />);
   ```

#### Issue: State not updating

**Symptoms:**
- Changes not reflected in UI
- Console shows correct values but UI doesn't update

**Causes:**
- Mutating state directly
- Incorrect state update

**Solutions:**

1. **Use functional updates:**
   ```typescript
   // Correct
   setMessages(prev => [...prev, newMessage]);

   // Incorrect
   messages.push(newMessage);
   setMessages(messages);
   ```

2. **Check React DevTools:**
   - Install React DevTools extension
   - Inspect component state

### Browser Compatibility

#### Issue: App doesn't work in Safari

**Symptoms:**
- Blank page in Safari
- Audio doesn't play
- Errors in console

**Solutions:**

1. **Check Safari version:**
   - Requires Safari 14+
   - Update to latest version

2. **Verify webkit fallback:**
   ```typescript
   // App.tsx:28
   new (window.AudioContext || (window as any).webkitAudioContext)
   ```

3. **Enable experimental features:**
   - Safari → Develop → Experimental Features
   - Check relevant audio/media features

#### Issue: App doesn't work in mobile browsers

**Symptoms:**
- Works on desktop
- Fails on mobile
- Audio issues on mobile

**Causes:**
- Mobile autoplay restrictions
- Different sample rate handling
- Touch vs. click events

**Solutions:**

1. **Test in mobile browser DevTools:**
   - Chrome DevTools → Toggle device toolbar
   - Test responsive behavior

2. **Ensure touch events work:**
   - Tap input to type
   - Verify keyboard appears

3. **Check mobile network:**
   - TTS API requires good connection
   - Test on WiFi

## Debugging Tools

### Browser DevTools

**Chrome/Edge:**
```
F12 or Cmd/Ctrl + Shift + I
```

**Firefox:**
```
F12 or Cmd/Ctrl + Shift + K
```

**Safari:**
```
Cmd + Option + I
```

### Useful Console Commands

```javascript
// Check AudioContext state
console.log(audioContextRef.current?.state);

// Check current messages
console.log(messages);

// Check API key (first 10 chars)
console.log(process.env.API_KEY?.substring(0, 10));

// Monitor audio playback
audioContextRef.current?.addEventListener('statechange', () => {
  console.log('AudioContext state:', audioContextRef.current?.state);
});
```

### Network Tab

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to `generativelanguage.googleapis.com`
4. Check request/response details

**Expected Requests:**
- Chat API: `https://generativelanguage.googleapis.com/v1beta/chats/...`
- TTS API: `https://generativelanguage.googleapis.com/v1beta/models/...`

### React DevTools

Install extension:
- Chrome: https://chrome.google.com/webstore
- Firefox: https://addons.mozilla.org/firefox

**Features:**
- Inspect component tree
- View props and state
- Track re-renders
- Profile performance

## Performance Issues

#### Issue: Slow response times

**Symptoms:**
- Long delay between input and response
- Typewriter effect takes too long
- Audio plays late

**Expected Timings:**
- Chat API: 500-1500ms
- TTS API: 500-1000ms
- Typewriter: 40ms × message length
- Total: 1-3 seconds typical

**Solutions:**

1. **Check network speed:**
   ```bash
   # Run speed test
   curl -o /dev/null https://generativelanguage.googleapis.com/
   ```

2. **Reduce typewriter speed:**
   ```typescript
   // App.tsx:148
   const typingSpeed = 20;  // Faster
   ```

3. **Monitor API performance:**
   - Check Gemini API status page
   - Try different time of day

#### Issue: High memory usage

**Symptoms:**
- Browser tab uses excessive RAM
- Page becomes slow over time
- Browser crashes

**Causes:**
- Audio buffers not garbage collected
- ScriptProcessorNode memory leak
- Long conversation history

**Solutions:**

1. **Refresh page periodically:**
   - After 20-30 messages
   - Clears memory

2. **Verify node disconnection:**
   ```typescript
   // audio.ts:72-74
   source.disconnect();
   bitCrusher.disconnect();
   ```

3. **Clear conversation:**
   - Add "Reset" button (future enhancement)
   - Reload page

## Error Messages Reference

### User-Facing Errors

These errors appear in Dr. Sbaitso's responses:

```
UNEXPECTED DATA STREAM CORRUPTION. PLEASE REBOOT.
INTERNAL PROCESSOR FAULT. PLEASE TRY AGAIN.
MEMORY ADDRESS CONFLICT. PLEASE RESTATE YOUR PROBLEM.
IRQ CONFLICT AT ADDRESS 220H. SESSION TERMINATED.
```

**Meaning:** API call failed (network, rate limit, or other error)

**Action:** Wait a few seconds and try again

```
SYSTEM ERROR: FAILED TO INITIALIZE. PLEASE REFRESH.
```

**Meaning:** Greeting audio generation failed

**Action:** Refresh page and try again

### Console Errors

```
Error getting response from Gemini: <details>
```

**Check:** Network tab for API response details

```
Error synthesizing speech: <details>
```

**Check:** TTS API quota and network connection

```
Could not create AudioContext: <error>
```

**Check:** Browser compatibility and permissions

```
No audio data received from TTS API
```

**Check:** API key validity and quota

## Getting Help

### Resources

1. **Gemini API Documentation:**
   - https://ai.google.dev/docs

2. **Vite Documentation:**
   - https://vitejs.dev/guide/

3. **Web Audio API:**
   - https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

4. **React Documentation:**
   - https://react.dev/

### Reporting Issues

When reporting issues, include:

1. **Environment:**
   - OS and version
   - Browser and version
   - Node.js version (`node --version`)

2. **Steps to reproduce:**
   - Exact sequence of actions
   - Input that caused error

3. **Error messages:**
   - Browser console output
   - Network tab details
   - Screenshots

4. **Code changes:**
   - Any modifications made
   - Configuration differences

### Debugging Checklist

Before asking for help:

- [ ] Checked browser console for errors
- [ ] Verified `.env.local` exists with correct API key
- [ ] Tried refreshing the page
- [ ] Tested in different browser
- [ ] Checked internet connection
- [ ] Verified API key is valid
- [ ] Cleared browser cache
- [ ] Reinstalled dependencies (`rm -rf node_modules && npm install`)
- [ ] Checked this troubleshooting guide
- [ ] Searched existing issues (if applicable)
