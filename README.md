# Bedrock v0.9.2

## Critical v0.9.1 startup fix

The v0.9.1 JavaScript referenced a missing `closePhotoModal()` function while `initEvents()` was wiring controls. That `ReferenceError` stopped all subsequent listeners from being registered. This made settings, biometric controls, photo-source choices, and note saving appear broken; the unhandled note form then fell back to browser form submission and reloaded the page.

v0.9.2 restores `closePhotoModal()`, safely clears the temporary photo preview URL and draft fields, and keeps the page scroll lock correct when other dialogs are open.

## Update on Android

1. Keep a copy of your `.bedrock` encrypted backup first, if you have one.
2. Extract this ZIP. `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `VERSION`, and the `icons/` and `tests/` folders must stay in the published site root.
3. Upload the contents of the extracted `bedrock-v0.9.2` folder to the **same HTTPS address and same GitHub Pages path** you already use. Overwrite the old files.
4. Open Bedrock once with internet available. The Service Worker cache name has changed to `bedrock-shell-v9-2`; the updated app files should be fetched and the previous Bedrock shell cache removed on activation.
5. Close and reopen Bedrock. If the old screen is still visible, close the installed PWA/browser tab completely and open the same address again while online.
6. Do **not** clear browser data, IndexedDB, or site storage. Do not change the site origin/path; the encrypted vault is stored under that browser origin.

## Data compatibility

- IndexedDB database: `bedrock-local`, schema version `3` (unchanged).
- Vault key wrapping and encrypted record structure: unchanged.
- v1/v2 encrypted backup formats: unchanged.
- This update does not reset the vault and does not ask you to create a new one.

## Validation

See `TEST-REPORT.md` for the regression, browser, backup, biometric, and offline test results. The automated Node suite contains 15 passing tests. Mobile viewport Chromium workflows also passed. Real Android camera/microphone and physical fingerprint sensor checks remain device-level validation.
