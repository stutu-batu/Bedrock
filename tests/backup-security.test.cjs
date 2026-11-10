'use strict';

// Developer-only verification of the backup parser/cryptographic routines used by app.js.
// Requires Node.js 18+ (uses built-in WebCrypto and Blob; no npm packages).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { TextEncoder, TextDecoder } = require('node:util');

const appSource = fs.readFileSync(require('node:path').join(__dirname, '..', 'app.js'), 'utf8');

function extractFunction(name) {
  const re = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`, 'g');
  const match = re.exec(appSource);
  assert.ok(match, `Function ${name} exists in app.js`);
  const start = match.index;
  const open = appSource.indexOf('{', re.lastIndex);
  assert.ok(open > 0, `Function ${name} has a body`);
  let depth = 0;
  let state = 'code';
  let quote = '';
  for (let i = open; i < appSource.length; i += 1) {
    const ch = appSource[i];
    const next = appSource[i + 1];
    if (state === 'line-comment') {
      if (ch === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (ch === '*' && next === '/') { state = 'code'; i += 1; }
      continue;
    }
    if (state === 'string') {
      if (ch === '\\') { i += 1; continue; }
      if (ch === quote) state = 'code';
      continue;
    }
    if (state === 'template') {
      if (ch === '\\') { i += 1; continue; }
      if (ch === '`') state = 'code';
      continue;
    }
    if (ch === '/' && next === '/') { state = 'line-comment'; i += 1; continue; }
    if (ch === '/' && next === '*') { state = 'block-comment'; i += 1; continue; }
    if (ch === '"' || ch === "'") { state = 'string'; quote = ch; continue; }
    if (ch === '`') { state = 'template'; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return appSource.slice(start, i + 1);
    }
  }
  throw new Error(`Could not extract function ${name}`);
}

const constants = `
const BACKUP_FORMAT = 'bedrock-backup-v1';
const BACKUP_PAYLOAD_FORMAT = 'bedrock-backup-payload-v1';
const BACKUP_FORMAT_V2 = 'bedrock-backup-v2';
const BACKUP_PAYLOAD_FORMAT_V2 = 'bedrock-backup-payload-v2';
const BACKUP_MAX_BYTES = 100 * 1024 * 1024;
const BACKUP_MAX_RECORDS = 50000;
const BACKUP_MAX_ATTACHMENTS_PER_RECORD = 250;
const BACKUP_MAX_METADATA_BYTES = 2 * 1024 * 1024;
const VAULT_FORMAT = 'bedrock-encrypted-v1';
const PBKDF2_ITERATIONS = 310000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
`;
const functions = [
  'bytesToBase64', 'base64ToBytes', 'randomBytes', 'normalizeTags', 'derivePasswordWrappingKey',
  'encryptBytes', 'decryptBytes', 'unwrapVaultKey', 'encodeBinaryForBackup',
  'encodeRecordForBackup', 'decodeBackupBase64', 'validateRecordEnvelopeShape',
  'validateVaultConfigForBackup', 'verifyEncryptedRecordCollection',
  'backupV2AdditionalData', 'readAndVerifyBackup', 'encryptRecord'
].map(extractFunction).join('\n\n');

const context = vm.createContext({
  crypto: webcrypto,
  TextEncoder,
  TextDecoder,
  Blob,
  ArrayBuffer,
  Uint8Array,
  DataView,
  atob,
  btoa,
  JSON,
  Number,
  String,
  Set,
  Map,
  Math,
  Date,
  Error,
  TypeError
});
vm.runInContext(`${constants}\n${functions}`, context, { timeout: 10000 });

async function call(name, ...args) {
  return vm.runInContext(`${name}(...__args)`, Object.assign(context, { __args: args }), { timeout: 30000 });
}

async function buildTestConfig(password, rawVaultKey) {
  const salt = await call('randomBytes', 16);
  const wrappingKey = await call('derivePasswordWrappingKey', password, salt, 310000);
  const wrapped = await call('encryptBytes', rawVaultKey, wrappingKey, 'bedrock-vault-key-v1');
  return {
    key: 'vaultConfig', version: 1, kdf: 'PBKDF2-SHA-256', iterations: 310000,
    salt: await call('bytesToBase64', salt),
    wrapIv: await call('bytesToBase64', wrapped.iv),
    wrappedKey: await call('bytesToBase64', new Uint8Array(wrapped.cipher)),
    biometric: null, createdAt: Date.now()
  };
}

async function buildBackup(payload, password, version = 2) {
  const isV2 = version === 2;
  const salt = await call('randomBytes', 16);
  const envelope = {
    format: isV2 ? 'bedrock-backup-v2' : 'bedrock-backup-v1',
    version,
    kdf: 'PBKDF2-SHA-256',
    iterations: 310000,
    salt: await call('bytesToBase64', salt)
  };
  const key = await call('derivePasswordWrappingKey', password, salt, envelope.iterations);
  const aad = isV2 ? await call('backupV2AdditionalData', envelope) : 'bedrock-backup-v1';
  const encrypted = await call('encryptBytes', new TextEncoder().encode(JSON.stringify(payload)), key, aad);
  envelope.iv = await call('bytesToBase64', encrypted.iv);
  envelope.cipher = await call('bytesToBase64', new Uint8Array(encrypted.cipher));
  return new Blob([JSON.stringify(envelope)], { type: 'application/vnd.bedrock.backup+json' });
}

(async () => {
  const password = 'Unit-Test-Bedrock-2026!';
  const rawVaultKey = await call('randomBytes', 32);
  const vaultKey = await webcrypto.subtle.importKey('raw', rawVaultKey, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  const config = await buildTestConfig(password, rawVaultKey);
  const now = Date.now();
  const testRecord = {
    id: 'record-test-0001', title: 'Security test note', body: 'Backup integrity fixture', category: 'note',
    tags: ['test'], favorite: true, deletedAt: null, archivedAt: null,
    reminderAt: null, reminderNotifiedAt: null, createdAt: now, updatedAt: now,
    attachments: [{ id: 'audio-test-0001', kind: 'audio', name: 'voice.webm', mimeType: 'audio/webm', createdAt: now, blob: new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: 'audio/webm' }) }]
  };
  const encryptedRecord = await call('encryptRecord', testRecord, vaultKey);
  const encodedRecord = await call('encodeRecordForBackup', encryptedRecord);

  const payloadV2 = {
    format: 'bedrock-backup-payload-v2', version: 2, appVersion: '0.8.0', exportedAt: now,
    vaultConfig: config, records: [encodedRecord]
  };
  const backupV2 = await buildBackup(payloadV2, password, 2);
  const resultV2 = await call('readAndVerifyBackup', backupV2, password);
  assert.equal(resultV2.formatVersion, 2);
  assert.equal(resultV2.integrity.recordCount, 1);
  assert.equal(resultV2.integrity.attachmentCount, 1);

  // v0.7 format remains importable.
  const payloadV1 = {
    format: 'bedrock-backup-payload-v1', version: 1, exportedAt: now,
    vaultConfig: config, records: [encodedRecord]
  };
  const backupV1 = await buildBackup(payloadV1, password, 1);
  const resultV1 = await call('readAndVerifyBackup', backupV1, password);
  assert.equal(resultV1.formatVersion, 1);
  assert.equal(resultV1.integrity.recordCount, 1);

  // Wrong password must fail at authenticated decryption.
  await assert.rejects(() => call('readAndVerifyBackup', backupV2, 'wrong-password'));

  // Corrupting the encrypted inner record while re-encrypting the outer payload
  // must still fail before an application restore transaction can start.
  const badRecord = JSON.parse(JSON.stringify(encodedRecord));
  const oldMetaCipher = badRecord.metaCipher;
  badRecord.metaCipher = (oldMetaCipher[0] === 'A' ? 'B' : 'A') + oldMetaCipher.slice(1);
  const badInnerPayload = { ...payloadV2, records: [badRecord] };
  const badInnerBackup = await buildBackup(badInnerPayload, password, 2);
  await assert.rejects(() => call('readAndVerifyBackup', badInnerBackup, password));

  const badAttachmentRecord = JSON.parse(JSON.stringify(encodedRecord));
  const oldAttachmentCipher = badAttachmentRecord.attachments[0].cipher;
  badAttachmentRecord.attachments[0].cipher = (oldAttachmentCipher[0] === 'A' ? 'B' : 'A') + oldAttachmentCipher.slice(1);
  const badAttachmentBackup = await buildBackup({ ...payloadV2, records: [badAttachmentRecord] }, password, 2);
  await assert.rejects(() => call('readAndVerifyBackup', badAttachmentBackup, password));

  // V2 KDF header is authenticated as AAD; changing its value must fail.
  const parsedHeader = JSON.parse(await backupV2.text());
  parsedHeader.iterations += 1;
  const badHeaderBackup = new Blob([JSON.stringify(parsedHeader)]);
  await assert.rejects(() => call('readAndVerifyBackup', badHeaderBackup, password));

  // Duplicated IDs are rejected after the outer backup authenticates.
  const duplicatePayload = { ...payloadV2, records: [encodedRecord, encodedRecord] };
  const duplicateBackup = await buildBackup(duplicatePayload, password, 2);
  await assert.rejects(() => call('readAndVerifyBackup', duplicateBackup, password));

  console.log(JSON.stringify({
    passed: [
      'v2 backup round-trip and attachment verification',
      'v0.7 v1 backup backward compatibility',
      'wrong password rejection',
      'corrupted inner record rejection',
      'corrupted media attachment rejection',
      'authenticated KDF header tamper rejection',
      'duplicate record ID rejection'
    ],
    status: 'all tests passed'
  }, null, 2));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
