# Bedrock v0.9.2 — Test report

Date: 2026-11-11

## Root cause fixed

The previous v0.9.1 JavaScript referenced `closePhotoModal()` from `initEvents()` but did not define it. The resulting `ReferenceError` stopped event-listener initialization at that point. Later listeners for the note form, photo source buttons, settings, biometric controls, backup controls, and other actions were therefore never registered. The missing note-submit listener also allowed the browser's default form submission to reload the page, which looked like a return to the vault gate.

v0.9.2 defines the cleanup function, releases temporary photo object URLs, clears the photo draft fields, and performs modal scroll-lock cleanup without interfering with other open modals.

## Automated tests

- Node test suite: **15/15 passed**.
- JavaScript syntax check: passed.
- HTML IDs: unique; all static `getElementById` references resolve.
- Event-handler initialization regression: passed; no `ReferenceError` while registering listeners.
- Encrypted backup tests: v2 round trip, media attachment verification, v0.7/v1 compatibility, wrong-password rejection, corrupted record/media rejection, KDF header tamper rejection, and duplicate-record rejection all passed.

## Mobile viewport browser tests

Tested in Chromium at a 390 × 844 mobile viewport using a clean test profile:

1. Create a new vault.
2. Open settings and change theme, accent color, and density.
3. Create and save a note with tags and a reminder.
4. Search records and use date/content/sort filters.
5. Favorite, archive, unarchive, move to trash, and restore a note.
6. Create a photo record using the gallery file chooser.
7. Exercise the camera-source file input using a test image file. This validates the camera input path, not a physical camera sensor.
8. Add multiple photos to an existing note and save.
9. Record and save audio using Chromium's synthetic microphone input.
10. Create a password record and open its detail view.
11. Dispatch a due reminder using a controlled test clock.
12. Export an encrypted backup and verify it without changing the vault.
13. Run the in-app security self-check.
14. Reload, unlock, and confirm records remain present.

All listed flows passed. The browser reported **no page errors and no console errors** during the comprehensive flow.

## Restore, deletion, and password tests

- Export a backup containing a photo attachment, add a later record, restore the backup, and confirm the photo record returns while the later record is absent: passed.
- Permanently empty the trash after confirming: passed.
- Change the master password and unlock using the new password while preserving the record: passed.
- No page errors or console errors in this test flow.

## Biometric tests

A Chromium WebAuthn virtual platform authenticator with PRF support was used to test:

- Register a biometric credential: passed.
- Manual biometric unlock: passed.
- Enable automatic biometric unlock and unlock after a page reload: passed.
- No page errors or console errors.

This is a virtual authenticator test. A physical Android fingerprint sensor and the device's actual biometric prompt must still be checked on the user's phone.

## Offline test

Service Worker registration and control: passed. The `bedrock-shell-v9-2` cache was present. With the browser switched offline, the app shell reloaded and displayed the vault gate: passed.

## Scope and limitations

- Camera selection was tested through the browser file-input path with a fixture image; actual Android camera/galley intents need device verification.
- Audio recording used a synthetic microphone stream; physical microphone permissions and device behavior need verification on the phone.
- The app is a PWA; reliable timed alerts while the app is fully terminated are not guaranteed by a browser-only service worker.
- Tests are functional regression checks, not an independent security audit.

## Data compatibility

No IndexedDB database name, schema version, vault-key wrapping format, encrypted record format, or backup format was changed. The app remains on database `bedrock-local`, schema version `3`. Do not clear browser/site storage when updating.
