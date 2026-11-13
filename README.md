# Bedrock v0.11.0

Bedrock is an offline-first, encrypted personal notes workspace.

## Editor-first workflow
- Tap the single note button to open a full-screen text editor.
- The title stays at the top; the writing surface fills the screen.
- Use the folder/panel icon in the editor header to open or close the bottom Files panel.
- Search files and filter All, Recent, or Tagged notes. Tap a file to open it in the editor.
- Add categories inline with hashtags, for example `#home`, `#ideas`, or `#important`. Up to 12 unique tags are stored from the title and body.
- Photo attachments and reminders remain available within a note.

## Compatibility and update
- Existing encrypted records, photos, audio attachments, vault keys and backup formats are preserved.
- Legacy special record types are retained so old data is not discarded, but new quick-create shortcuts are removed; new entries are notes.
- Make a fresh encrypted backup, then upload all files in this ZIP to the same HTTPS origin and path. Do not clear browser storage or IndexedDB.
- Service worker cache: `bedrock-shell-v11-0`. Open once online, then close and reopen the installed PWA.

## Next milestones
- v0.12: Markdown editing, preview, daily notes and templates.
- v0.13: resizable panels, draggable tabs, quick switcher and command palette.
- v1.0: final security, migration, Android packaging and device validation.
