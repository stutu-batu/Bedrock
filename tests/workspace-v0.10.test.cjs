'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('workspace contains two panes, tab bars and a mobile tab switcher', () => {
  for (const id of ['workspacePanel', 'workspaceGrid', 'workspaceTabs0', 'workspaceTabs1', 'workspaceContent0', 'workspaceContent1', 'workspaceSplitButton', 'workspaceCloseAllButton', 'workspaceTabSwitcher', 'workspaceTabSwitcherList', 'mobileNavTabs', 'mobileTabCount']) {
    assert.match(html, new RegExp(`id="${id}"`), `missing ${id}`);
  }
  assert.match(app, /function openWorkspaceTab\(/);
  assert.match(app, /function toggleWorkspaceSplit\(/);
  assert.match(app, /function renderWorkspaceTabSwitcher\(/);
});

test('workspace remembers only record IDs and pane layout, not decrypted note content', () => {
  assert.match(app, /const WORKSPACE_STORAGE_KEY = 'bedrock-workspace-v1'/);
  assert.match(app, /tabs: pane\.tabs\.slice\(0, 12\), activeId: pane\.activeId/);
  assert.doesNotMatch(app, /localStorage\.setItem\(WORKSPACE_STORAGE_KEY,[\s\S]{0,500}record\.body/);
});

test('record rows and explicit open buttons launch a workspace tab', () => {
  assert.match(app, /main\.dataset\.openRecord = record\.id/);
  assert.match(app, /openWorkspaceTab\(record\.id\)/);
  assert.match(app, /elements\.list\.addEventListener\('click'/);
});

test('phone uses a tab counter while split panes are limited to wider screens', () => {
  assert.match(app, /matchMedia\('\(min-width: 860px\)'\)/);
  assert.match(css, /\.workspace-split-button\{display:none!important\}/);
  assert.match(css, /\.mobile-dock\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});

test('home actions and category filters are icon-first but accessible', () => {
  assert.match(html, /class="quick-grid compact-quick-grid"/);
  assert.match(html, /aria-label="Yeni yazılı not"/);
  assert.match(html, /class="category-row icon-category-row"/);
  assert.match(css, /\.sr-only\{/);
});

test('workspace release keeps encrypted vault schema and bumps only app shell cache', () => {
  assert.match(app, /const DB_NAME = 'bedrock-local'/);
  assert.match(app, /const DB_VERSION = 3/);
  assert.match(app, /const APP_VERSION = '0\.10\.0'/);
  assert.match(sw, /bedrock-shell-v10-0/);
  assert.match(sw, /app\.js\?v=0\.10\.0/);
});

test('desktop split tabs are merged into the primary workspace on mobile', () => {
  const renderBody = app.match(/function renderWorkspace\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(renderBody, /if \(!canSplit && workspaceSplit\)/);
  assert.match(renderBody, /workspacePanes\[0\]\.tabs\.push\(id\)/);
  assert.match(renderBody, /workspacePanes\[1\] = \{ tabs: \[\], activeId: null \}/);
});
