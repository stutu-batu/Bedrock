const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('v0.9 includes the camera/gallery source chooser and both file inputs', () => {
  assert.match(html, /id="photoSourceModal"/);
  assert.match(html, /id="photoCameraInput"[^>]*capture="environment"/);
  assert.match(html, /id="photoGalleryInput"[^>]*multiple/);
  assert.match(js, /choosePhotoSource\('camera'\)/);
  assert.match(js, /choosePhotoSource\('gallery'\)/);
});

test('existing notes can stage multiple photos and save them as encrypted attachments', () => {
  assert.match(html, /id="addPhotoToNoteButton"/);
  assert.match(js, /async function handlePhotosForNote\(files\)/);
  assert.match(js, /attachments: \[\.\.\.\(existing && Array\.isArray\(existing\.attachments\) \? existing\.attachments : \[\]\), \.\.\.pendingNotePhotoAttachments\]/);
  assert.match(js, /persistEncryptedRecord\(record\)/);
});

test('automatic biometric unlock is an explicit opt-in setting and requires an existing biometric credential', () => {
  assert.match(html, /id="autoBiometricUnlockToggle"/);
  assert.match(js, /if \(!vaultConfig \|\| !vaultConfig\.biometric\)/);
  assert.match(js, /scheduleAutomaticBiometricUnlock\(\)/);
  assert.match(js, /autoBiometricUnlock: false/);
});

test('appearance settings cover theme, accent and density and are persisted locally', () => {
  for (const id of ['appearanceTheme', 'appearanceAccent', 'appearanceDensity']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(js, /localStorage\.setItem\(APPEARANCE_STORAGE_KEY/);
  assert.match(css, /html\[data-theme="light"\]/);
  assert.match(css, /html\[data-density="compact"\]/);
});

test('right-side scrollbars are hidden without disabling scrolling and PWA cache is versioned', () => {
  assert.match(css, /scrollbar-width:\s*none/);
  assert.match(css, /::-webkit-scrollbar/);
  assert.match(sw, /bedrock-shell-v9-1/);
});

test('all static getElementById references exist and IDs are unique', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate HTML ids found');
  const references = [...js.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);
  const known = new Set(ids);
  const missing = [...new Set(references)].filter(id => !known.has(id));
  assert.deepEqual(missing, []);
});
