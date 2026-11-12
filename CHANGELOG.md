# Bedrock v0.10.0 — Workspace foundation

## New
- Added an Obsidian-inspired tabbed workspace for opening encrypted records without leaving the library.
- Added desktop split view with two independent tab groups. On phones, the workspace stays single-pane and tabs are managed from the bottom tab counter.
- Workspace tabs (random record IDs only) are restored after reload; record content remains encrypted in IndexedDB.
- Added workspace preview for notes, images, audio, tags, and protected password records.
- Reworked the home area into a compact icon-first quick-action row and icon-only category filters.
- Reduced visible marketing copy and compacted the header/navigation.

## Preserved
- IndexedDB database name/schema, vault key wrapping, encrypted record format, and backup formats are unchanged.
- All v0.9.2 content types, reminders, biometric unlock, backup/restore, favorites, trash, archive, and appearance settings remain in place.

## Notes
- Split view is available on wider screens; phones use a single pane to avoid cramped reading.
- This is the first workspace milestone. Drag-to-reorder tabs, resizable panes, backlinks, Markdown editing, and graph view are future milestones.
- Added responsive recovery: desktop split-pane tabs are merged into the primary tab group when the workspace is opened on a phone, so open notes remain accessible.
