const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('security gate handler is installed before optional UI wiring', () => {
  const initStart = app.indexOf('async function init()');
  const bindCall = app.indexOf('bindGateFormEarly();', initStart);
  const appearanceCall = app.indexOf('applyAppearancePreferences(readAppearancePreferences());', initStart);
  const eventCall = app.indexOf('initEvents();', initStart);
  assert.ok(initStart >= 0 && bindCall > initStart);
  assert.ok(appearanceCall > bindCall);
  assert.ok(eventCall > appearanceCall);
});

test('gate form cannot fall back to native GET navigation', () => {
  assert.match(html, /<form id="gateForm" onsubmit="return false">/);
  assert.match(app, /elements\.gateForm\.addEventListener\('submit', async event => \{\s*event\.preventDefault\(\);\s*event\.stopPropagation\(\);/);
  assert.match(html, /app\.js\?v=0\.11\.0/);
  assert.match(html, /onerror="document\.getElementById/);
});

test('database identity and schema remain stable', () => {
  assert.match(app, /const DB_NAME = 'bedrock-local';/);
  assert.match(app, /const DB_VERSION = 3;/);
  assert.match(app, /const META_STORE = 'settings';/);
});

test('orphaned encrypted records are routed to recovery instead of new vault setup', () => {
  assert.match(app, /const hasEncryptedRecords = stored\.some\(item => item && item\.format === VAULT_FORMAT\);/);
  assert.match(app, /setGateMode\('recovery'\)/);
  assert.match(app, /elements\.gateForm\.hidden = mode === 'recovery';/);
  assert.match(app, /gateMode === 'recovery'/);
});

test('service worker shell cache is bumped and pre-caches versioned assets', () => {
  assert.match(sw, /bedrock-shell-v11-0/);
  assert.match(sw, /app\.js\?v=0\.11\.0/);
  assert.match(sw, /styles\.css\?v=0\.11\.0/);
});
