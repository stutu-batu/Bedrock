# Bedrock v0.10.0

Bedrock is an offline-first personal vault. It stores encrypted records locally in IndexedDB and can be installed as a PWA.

## v0.10 workspace
- Tap a record card or its open icon to open it in a workspace tab.
- Tabs are shown above the library. Select a tab to switch records; close it with its x button.
- On desktop/tablet-width screens, use the split icon to open a second pane. Select a pane, then open a record from the library to place it there.
- On phones, use the bottom tab-counter icon to switch between open tabs. Split view is intentionally disabled on narrow screens.
- Password records remain masked in the workspace; use the key/open action to reveal credentials in the protected detail dialog.

## Home screen
The home screen now uses compact icon-only quick actions and category icons. Buttons retain accessible names and title tooltips.

## Update on Android
1. Make a fresh encrypted `.bedrock` backup before updating.
2. Extract this ZIP and upload all files/folders in its root to the same GitHub Pages directory used by your current Bedrock installation.
3. Keep the same HTTPS origin and path. Do not clear browser data, site storage, or IndexedDB.
4. Open Bedrock once while online. The Service Worker cache is `bedrock-shell-v10-0`; close and reopen the PWA after it updates.

## Data compatibility
- IndexedDB: `bedrock-local`, schema version `3` (unchanged).
- Vault key wrapping, encrypted record envelope, and backup v1/v2 formats unchanged.
- Workspace preferences are stored separately in localStorage and contain only random record IDs and pane arrangement, not note text or passwords.

## Milestones
- v0.10: tabbed workspace, desktop split view, compact icon-first UI.
- v0.11: internal links between notes, backlinks, and local relationship view.
- v0.12: Markdown editor, live preview, daily notes, and templates.
- v0.13: resizable panes, drag-to-reorder tabs, quick switcher, and command palette.
- v1.0: hardening, Android package, migration/backup validation, and final device tests.

## Validation
See `TEST-REPORT.md` for automated checks and limitations.
