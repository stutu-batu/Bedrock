# Bedrock v0.10.0 — Validation report

## Automated checks

- Node.js syntax check: `node --check app.js` — passed.
- Node.js regression suite: `node --test tests/*.test.cjs` — **22/22 passed**.
- Backup/security suite: **7/7 passed** (backup v2 round-trip and attachment verification, v0.7 backup backward compatibility, wrong password rejection, corrupted record/media rejection, authenticated KDF header tamper rejection, duplicate record ID rejection).
- UI/startup regression checks: passed (event listener binding, security gate submission, database identity/schema stability, photo modal cleanup, static element IDs).
- Workspace checks: passed (tab/pane elements, ID-only local workspace persistence, record-to-tab opening, mobile tab counter, icon-first accessible controls, desktop split-tab consolidation on mobile).
- PWA cache and version checks: passed (`bedrock-shell-v10-0`, versioned app assets).
- `manifest.webmanifest` JSON parse: passed.
- ZIP integrity (`unzip -t`): passed.

## Browser/device limitations

A live Chromium click-through test was attempted, but this execution environment blocks navigation to both local HTTP and `file://` pages with `ERR_BLOCKED_BY_ADMINISTRATOR`. Therefore no claim is made that an interactive browser or physical Android device test passed in this environment.

Please verify on the phone after updating: open two records as tabs, switch tabs from the bottom tab counter, close a tab, reload and confirm tabs restore. If available, also test split view on a wider screen, then reopen on the phone and confirm the second-pane tabs are merged into the mobile tab group.

## Data compatibility

- IndexedDB remains `bedrock-local`, schema version `3`.
- Vault encryption and backup formats remain unchanged.
- Workspace localStorage stores record IDs and pane layout only, not decrypted note contents.
