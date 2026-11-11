# Bedrock v0.9.2 — Critical startup and interaction fix

- Restored the missing `closePhotoModal()` function. In v0.9.1, its missing definition raised a `ReferenceError` during `initEvents()` and stopped the rest of the UI event listeners from registering.
- This explains the combined failure of settings, biometric controls, photo picker options, and saving notes. Without the note submit handler, the browser's default form submission reloaded the page and returned to the vault gate.
- Photo modal cleanup now releases the temporary Blob URL, clears the photo draft fields, and resets the save button safely.
- Closing the photo-source picker checks all related modals before removing the body's scroll lock.
- Updated `app.js` and `styles.css` asset query versions and the Service Worker cache to v0.9.2 so old cached app code is replaced.
- No IndexedDB schema, vault-key wrapping, encrypted record, or backup format changes.
- Added a regression test that runs all event-listener setup with a DOM stub to catch missing callback references.
- Added a comprehensive test report covering backups, CRUD, media, reminders, password rotation, biometric flows with a virtual authenticator, and offline shell loading.
