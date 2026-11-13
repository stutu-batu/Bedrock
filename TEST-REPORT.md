# Bedrock v0.11.0 — Test report

## Automated checks

- 21/21 Node.js regression and static integration assertions passed.
- JavaScript syntax checks passed for `app.js` and `sw.js`.
- UI ID/reference and uniqueness checks passed.
- Existing backup security tests passed, including v1/v2 compatibility, wrong-password rejection, corrupted-record rejection, corrupted-attachment rejection, authenticated-header tampering and duplicate-ID rejection.
- Startup, biometric UI wiring, camera/gallery wiring, attachment staging, appearance preferences, service-worker cache versioning and workspace regression tests passed.
- New editor checks passed: collapsible file drawer, search/filter controls, single-note creation, hashtag-derived tags and removal of old quick-create shortcuts.

## Manual/device validation still required

A complete interactive Android session was not available in this build environment. Please verify on the phone after deployment:
1. Open a new note; confirm the cursor starts in the writing area.
2. Type a note without a title and save; the first non-empty line should become its title.
3. Add `#home` and `#idea` in the text; verify they appear as tags in the existing tag filters.
4. Open the Files icon, search/filter notes, select one and verify it opens in the editor.
5. Close the Files panel and confirm the editor remains open.
6. Add a photo and a reminder, save, then reopen the note.
7. Verify biometric unlock and existing encrypted backup/restore on the device.

## Data compatibility

- IndexedDB name and schema version remain `bedrock-local`, version `3`.
- Vault key wrapping, encrypted record envelope, and backup formats are unchanged.
- Existing records are not migrated or deleted. New records are saved as the single `note` type; hashtags in title/body become up to 12 unique tags.
- Legacy object/password records remain in the encrypted vault for compatibility, although old quick-create buttons and type filters are removed from the main flow.
