# Bedrock v0.11.0

- Replaced the quick-action dashboard with a single new-note entry point.
- Changed note creation into a full-screen, editor-first workspace.
- Added a collapsible bottom file browser with search and All / Recent / Tagged filters.
- Existing notes can be opened directly from the file panel.
- New notes use one note type; categories are derived from hashtags such as `#home` or `#ideas` in the title/body.
- Existing encrypted record schema, IndexedDB database, backup formats, biometric setup and attachments are unchanged.

Legacy object/password records are retained for compatibility; the old type shortcuts and type filters are no longer offered in the main flow.
