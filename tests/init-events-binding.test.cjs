'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function makeElement() {
  return {
    hidden: false, value: '', checked: false, disabled: false, textContent: '',
    addEventListener() {}, removeEventListener() {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    focus() {}, reset() {}, replaceChildren() {}, setAttribute() {}, removeAttribute() {},
    scrollIntoView() {}, closest() { return null; }, querySelector() { return null; }
  };
}

test('all UI event listeners register without a ReferenceError', () => {
  const initMatch = source.match(/function initEvents\(\)\s*\{[\s\S]*?\n\}/);
  assert.ok(initMatch, 'initEvents function exists');
  const stubNames = [...source.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)]
    .map(match => match[1])
    .filter(name => name !== 'initEvents');
  const stubs = Object.fromEntries(stubNames.map(name => [name, () => {}]));
  const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  const mapBlock = source.slice(source.indexOf('const elements = {'), source.indexOf('\n};', source.indexOf('const elements = {')));
  const elementNames = [...mapBlock.matchAll(/^\s*([A-Za-z_$][\w$]*): document\.getElementById\('([^']+)'\)/gm)];
  const elements = {};
  for (const [, name, id] of elementNames) {
    assert.ok(htmlIds.has(id), `mapped HTML element #${id} exists`);
    elements[name] = makeElement();
  }
  const byId = new Map([...htmlIds].map(id => [id, makeElement()]));
  const document = {
    body: makeElement(),
    getElementById(id) { return byId.get(id) || makeElement(); },
    querySelectorAll() { return [makeElement()]; },
    addEventListener() {}
  };
  const window = {
    addEventListener() {}, setTimeout() { return 1; }, clearTimeout() {},
    scrollTo() {}
  };
  const context = vm.createContext({
    ...stubs, elements, document, window, navigator: {},
    records: [], activePasswordRecordId: null, activeCategory: 'all', activeTagFilter: '',
    Notification: undefined, CSS: { escape(value) { return String(value); } },
    console, Date, Math, URL, setTimeout() { return 1; }, clearTimeout() {}
  });
  assert.doesNotThrow(() => vm.runInContext(`${initMatch[0]}\ninitEvents();`, context, { timeout: 1000 }));
});

test('photo modal cleanup function exists and revokes the temporary photo URL', () => {
  assert.match(source, /function closePhotoModal\(\)/);
  assert.match(source, /URL\.revokeObjectURL\(pendingPhotoUrl\)/);
});

test('app and service-worker cache are both versioned 0.9.2', () => {
  assert.match(html, /app\.js\?v=0\.9\.2/);
  assert.match(html, /styles\.css\?v=0\.9\.2/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /bedrock-shell-v9-2/);
});
