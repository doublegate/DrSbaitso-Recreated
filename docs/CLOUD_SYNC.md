# Cloud Sync

Cloud sync copies the conversations you keep with **SAVE HISTORY** to a Firebase project
that **you** own, and merges newer ones back. It is optional, off by default, and
Enhanced mode only. Nothing leaves the browser unless you set it up and turn it on.

## What is synced

| Data | Synced |
|---|---|
| Conversations saved with SAVE HISTORY (status bar) | Yes |
| Anything while SAVE HISTORY is off | No: there is nothing to upload |
| Settings, themes, custom characters, sound packs, statistics | No |

The app ships no Firebase project and no Firebase key. The whole Firestore document is
limited to about 1 MB.

## Setting up your Firebase project

1. In the [Firebase console](https://console.firebase.google.com/), create a project.
2. **Authentication > Sign-in method**: enable **Anonymous**.
3. **Firestore Database**: create a database, then set rules so each user reaches only
   their own document:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. **Project settings > Your apps**: add a Web app and copy its config.
5. **Authentication > Settings > Authorized domains**: add the domain you use the app on.

A Firebase web config is not a secret (it identifies the project; the rules above
protect the data), but it is still yours: it is stored only in this browser.

## Using it

1. Open **SETTINGS > Cloud sync**.
2. Paste the web config into **Firebase web config**: the object, JSON, or the console's
   JavaScript snippet all work. `apiKey`, `authDomain`, `projectId` and `appId` are
   required and checked for shape. Press **CONNECT**.
3. Press **SIGN IN ANONYMOUSLY**.
4. Tick **Enable Cloud Sync**. Optionally untick **Auto-Sync** or change the interval
   (10-300 seconds, default 60).
5. **SYNC NOW** runs one round immediately.

The config and options are kept in localStorage (`cloudSyncFirebaseConfig`,
`cloudSyncOptions`), so the next visit reconnects when the panel is opened.

## How a sync round works

1. Download the document `users/<uid>` from Firestore.
2. Compare its `updatedAt` with the newest local conversation's `updatedAt`.
3. If the local copy is newer (or there is no cloud copy), upload it.
4. Otherwise merge the cloud conversations into local history: unknown ones are added,
   and a conversation replaces the local one only if its `updatedAt` is newer. Records
   that do not look like conversations are ignored. A screen-reader message says how many
   were restored.

Conflicts are last-write-wins; there is no manual resolution. Firestore's persistent
local cache is enabled, so reads and writes survive brief disconnects.

## Limitations

- **Auto-sync runs only while the Cloud sync panel is open.** Closing the panel releases
  the connection; it reconnects from the saved config the next time it is opened.
- **Anonymous accounts belong to one browser profile.** Another device, another browser,
  or clearing site data signs in as a new, empty user, so the data is not shared across
  devices. In practice cloud sync is a backup for one browser.
- Turning SAVE HISTORY off erases local history but not the cloud copy; delete the
  document in the Firebase console if you want it gone.

## Security

- Firebase loads from npm as a lazy chunk, only when you connect.
- The Content-Security-Policy allows connections only to the site itself and the Firebase
  hosts (`firestore.googleapis.com`, `identitytoolkit.googleapis.com`,
  `securetoken.googleapis.com`, `firebaseinstallations.googleapis.com`).
- Data is protected in transit by TLS and at rest by Firebase; it is not end-to-end
  encrypted. Anyone with access to your Firebase project can read it.

## Troubleshooting

| Message or symptom | Fix |
|---|---|
| "Invalid Firebase web config: ..." | The message lists each missing or malformed field |
| Sign-in fails | Enable Anonymous sign-in, and add the app's domain to the authorized domains |
| "Missing or insufficient permissions" | Check the Firestore rules above |
| "Too much data to sync" | The document limit is about 1 MB; delete old conversations |
| Nothing syncs | SAVE HISTORY must be on, and the panel must stay open for auto-sync |

## Implementation

| File | Role |
|---|---|
| `src/utils/cloudSync.ts` | `CloudSync` singleton: config parsing and validation, auth, upload, download, last-write-wins, auto-sync timer |
| `src/hooks/useCloudSync.ts` | React state from `CloudSync` events; disposes the instance when the last user unmounts |
| `src/components/CloudSyncPanel.tsx`, `CloudSyncSettings.tsx` | The panel; `EnhancedPanels` supplies the saved sessions and merges what comes back |
| `src/utils/sessionManager.ts` | `mergeSessions`: validation and per-conversation merge |
