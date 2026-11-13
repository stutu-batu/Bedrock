'use strict';

const DB_NAME = 'bedrock-local';
const DB_VERSION = 3;
const STORE_NAME = 'records';
const META_STORE = 'settings';
const VAULT_FORMAT = 'bedrock-encrypted-v1';
const PBKDF2_ITERATIONS = 310000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAX_PHOTO_BYTES = 18 * 1024 * 1024;
const MAX_AUDIO_MILLISECONDS = 10 * 60 * 1000;
const BACKUP_FORMAT = 'bedrock-backup-v1'; // v0.7 format; retained for restore compatibility.
const BACKUP_PAYLOAD_FORMAT = 'bedrock-backup-payload-v1';
const BACKUP_FORMAT_V2 = 'bedrock-backup-v2';
const BACKUP_PAYLOAD_FORMAT_V2 = 'bedrock-backup-payload-v2';
const BACKUP_MAX_BYTES = 100 * 1024 * 1024;
const BACKUP_MAX_RECORDS = 50000;
const BACKUP_MAX_ATTACHMENTS_PER_RECORD = 250;
const BACKUP_MAX_METADATA_BYTES = 2 * 1024 * 1024;
const APP_VERSION = '0.11.0';
const MAX_IMAGE_EDGE = 1600;
const IMAGE_JPEG_QUALITY = 0.82;

const elements = {
  list: document.getElementById('recordsList'),
  count: document.getElementById('recordCount'),
  allCount: document.getElementById('allCount'),
  favoriteCount: document.getElementById('favoriteCount'),
  trashCount: document.getElementById('trashCount'),
  archiveCount: document.getElementById('archiveCount'),
  dateFilter: document.getElementById('dateFilter'),
  contentFilter: document.getElementById('contentFilter'),
  sortFilter: document.getElementById('sortFilter'),
  advancedFilterSummary: document.getElementById('advancedFilterSummary'),
  clearAdvancedFilters: document.getElementById('clearAdvancedFilters'),
  emptyTrash: document.getElementById('emptyTrashButton'),
  tagFilters: document.getElementById('tagFilterRow'),
  noteTags: document.getElementById('noteTags'),
  noteReminder: document.getElementById('noteReminderAt'),
  audioTags: document.getElementById('audioTags'),
  photoTags: document.getElementById('photoTags'),
  passwordTags: document.getElementById('passwordRecordTags'),
  search: document.getElementById('searchInput'),
  filters: document.getElementById('categoryFilters'),
  modal: document.getElementById('noteModal'),
  form: document.getElementById('noteForm'),
  title: document.getElementById('noteTitle'),
  category: document.getElementById('noteCategory'),
  body: document.getElementById('noteBody'),
  modalTitle: document.getElementById('modalTitle'),
  toast: document.getElementById('toast'),
  saveButton: document.getElementById('saveNoteButton'),
  audioModal: document.getElementById('audioModal'),
  photoModal: document.getElementById('photoModal'),
  photoCameraInput: document.getElementById('photoCameraInput'),
  photoGalleryInput: document.getElementById('photoGalleryInput'),
  photoSourceModal: document.getElementById('photoSourceModal'),
  noteAttachmentCount: document.getElementById('noteAttachmentCount'),
  noteAttachmentPreview: document.getElementById('noteAttachmentPreview'),
  addPhotoToNote: document.getElementById('addPhotoToNoteButton'),
  audioTitle: document.getElementById('audioTitle'),
  audioDescription: document.getElementById('audioDescription'),
  audioPreview: document.getElementById('audioPreview'),
  recordingStatus: document.getElementById('recordingStatus'),
  recordingTimer: document.getElementById('recordingTimer'),
  recordingHint: document.getElementById('recordingHint'),
  recordingOrb: document.getElementById('recordingOrb'),
  startRecording: document.getElementById('startRecordingButton'),
  stopRecording: document.getElementById('stopRecordingButton'),
  saveAudio: document.getElementById('saveAudioButton'),
  photoPreview: document.getElementById('photoPreview'),
  photoTitle: document.getElementById('photoTitle'),
  photoCategory: document.getElementById('photoCategory'),
  photoDescription: document.getElementById('photoDescription'),
  savePhoto: document.getElementById('savePhotoButton'),
  gate: document.getElementById('securityGate'),
  gateForm: document.getElementById('gateForm'),
  gateTitle: document.getElementById('gateTitle'),
  gateSubtitle: document.getElementById('gateSubtitle'),
  gatePassword: document.getElementById('gatePassword'),
  gateConfirm: document.getElementById('gateConfirmPassword'),
  gateConfirmWrap: document.getElementById('gateConfirmWrap'),
  gateSubmit: document.getElementById('gateSubmit'),
  gateError: document.getElementById('gateError'),
  gateBiometric: document.getElementById('gateBiometricButton'),
  settingsModal: document.getElementById('settingsModal'),
  biometricStatus: document.getElementById('biometricStatus'),
  autoBiometricToggle: document.getElementById('autoBiometricUnlockToggle'),
  autoBiometricHelp: document.getElementById('autoBiometricHelp'),
  appearanceTheme: document.getElementById('appearanceTheme'),
  appearanceAccent: document.getElementById('appearanceAccent'),
  appearanceDensity: document.getElementById('appearanceDensity'),
  notificationsStatus: document.getElementById('notificationsStatus'),
  enableNotifications: document.getElementById('enableNotificationsButton'),
  enableBiometric: document.getElementById('enableBiometricButton'),
  disableBiometric: document.getElementById('disableBiometricButton'),
  lockNow: document.getElementById('lockNowButton'),
  changePasswordModal: document.getElementById('changePasswordModal'),
  changePasswordForm: document.getElementById('changePasswordForm'),
  gateRestoreBackup: document.getElementById('gateRestoreBackupButton'),
  passwordModal: document.getElementById('passwordModal'),
  passwordForm: document.getElementById('passwordForm'),
  passwordTitle: document.getElementById('passwordRecordTitle'),
  passwordUsername: document.getElementById('passwordRecordUsername'),
  passwordValue: document.getElementById('passwordRecordValue'),
  passwordWebsite: document.getElementById('passwordRecordWebsite'),
  passwordNotes: document.getElementById('passwordRecordNotes'),
  togglePasswordValue: document.getElementById('togglePasswordRecordValue'),
  savePassword: document.getElementById('savePasswordRecordButton'),
  passwordDetailModal: document.getElementById('passwordDetailModal'),
  passwordDetailTitle: document.getElementById('passwordDetailTitle'),
  passwordDetailUsername: document.getElementById('passwordDetailUsername'),
  passwordDetailValue: document.getElementById('passwordDetailValue'),
  revealPasswordDetail: document.getElementById('revealPasswordDetail'),
  passwordDetailWebsiteWrap: document.getElementById('passwordDetailWebsiteWrap'),
  passwordDetailWebsite: document.getElementById('passwordDetailWebsite'),
  passwordDetailNotesWrap: document.getElementById('passwordDetailNotesWrap'),
  passwordDetailNotes: document.getElementById('passwordDetailNotes'),
  backupExportModal: document.getElementById('backupExportModal'),
  backupExportForm: document.getElementById('backupExportForm'),
  backupExportPassword: document.getElementById('backupExportPassword'),
  backupExportError: document.getElementById('backupExportError'),
  confirmBackupExport: document.getElementById('confirmBackupExport'),
  backupImportModal: document.getElementById('backupImportModal'),
  backupImportForm: document.getElementById('backupImportForm'),
  backupImportPassword: document.getElementById('backupImportPassword'),
  backupImportError: document.getElementById('backupImportError'),
  confirmBackupImport: document.getElementById('confirmBackupImport'),
  backupImportFileName: document.getElementById('backupImportFileName'),
  backupFileInput: document.getElementById('backupFileInput'),
  verifyBackup: document.getElementById('verifyBackupButton'),
  runSecurityAudit: document.getElementById('runSecurityAuditButton'),
  securityAuditModal: document.getElementById('securityAuditModal'),
  securityAuditResults: document.getElementById('securityAuditResults'),
  workspacePanel: document.getElementById('workspacePanel'),
  workspaceGrid: document.getElementById('workspaceGrid'),
  workspaceOpenCount: document.getElementById('workspaceOpenCount'),
  workspaceSplitButton: document.getElementById('workspaceSplitButton'),
  workspaceCloseAllButton: document.getElementById('workspaceCloseAllButton'),
  workspaceTabs: [document.getElementById('workspaceTabs0'), document.getElementById('workspaceTabs1')],
  workspaceContents: [document.getElementById('workspaceContent0'), document.getElementById('workspaceContent1')],
  workspaceTabSwitcher: document.getElementById('workspaceTabSwitcher'),
  workspaceTabSwitcherList: document.getElementById('workspaceTabSwitcherList'),
  mobileTabCount: document.getElementById('mobileTabCount')
};

let database;
let records = [];
let activeCategory = 'all';
let activeTagFilter = '';
let editingId = null;
let toastTimeout;
let activeObjectUrls = [];
let mediaRecorder = null;
let microphoneStream = null;
let audioChunks = [];
let recordedAudioBlob = null;
let recordedAudioUrl = null;
let recordingStartedAt = 0;
let recordingInterval = null;
let recordingLimitTimeout = null;
let pendingPhotoBlob = null;
let pendingPhotoUrl = null;
let pendingNotePhotoAttachments = [];
let pendingNotePhotoPreviewUrls = [];
let noteEditorSession = 0;
let notePhotoProcessing = false;
let photoPickerTarget = 'new';
let autoBiometricAttempted = false;
let autoBiometricAttemptToken = 0;
let biometricUnlockInProgress = false;
const APPEARANCE_STORAGE_KEY = 'bedrock-appearance-v1';
const ACCENT_PALETTE = {
  green: { main: '#c6ee87', secondary: '#a9d76a' },
  purple: { main: '#c7a6ff', secondary: '#ab85f0' },
  blue: { main: '#87cfff', secondary: '#62afea' },
  amber: { main: '#f1c878', secondary: '#dca94d' }
};
let vaultConfig = null;
let vaultCryptoKey = null;
let gateMode = 'setup';
let pageHiddenAt = 0;
let activePasswordRecordId = null;
let pendingBackupFile = null;
let backupImportMode = 'restore';
let securityAuditRunning = false;
let securityAuditReturnToSettings = false;
let searchDebounceTimer = null;
let reminderTimer = null;
let reminderDispatchRunning = false;
let pendingReminderRecordId = null;
const WORKSPACE_STORAGE_KEY = 'bedrock-workspace-v1';
let workspacePanes = [{ tabs: [], activeId: null }, { tabs: [], activeId: null }];
let workspaceSplit = false;
let activeWorkspacePane = 0;
let workspaceObjectUrls = [];

function readWorkspaceState() {
  try {
    const saved = JSON.parse(localStorage.getItem(WORKSPACE_STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return;
    workspacePanes = [0, 1].map(index => {
      const pane = saved.panes && saved.panes[index] || {};
      const tabs = Array.isArray(pane.tabs) ? pane.tabs.filter(id => typeof id === 'string').slice(0, 12) : [];
      return { tabs: [...new Set(tabs)], activeId: typeof pane.activeId === 'string' ? pane.activeId : tabs[tabs.length - 1] || null };
    });
    workspaceSplit = Boolean(saved.split);
    activeWorkspacePane = saved.activePane === 1 ? 1 : 0;
  } catch (_) {
    workspacePanes = [{ tabs: [], activeId: null }, { tabs: [], activeId: null }];
    workspaceSplit = false;
    activeWorkspacePane = 0;
  }
}

function saveWorkspaceState() {
  try {
    const safeState = {
      panes: workspacePanes.map(pane => ({ tabs: pane.tabs.slice(0, 12), activeId: pane.activeId })),
      split: workspaceSplit,
      activePane: activeWorkspacePane
    };
    localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(safeState));
  } catch (error) {
    console.warn('Çalışma alanı düzeni saklanamadı:', error);
  }
}

readWorkspaceState();

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Bu tarayıcı yerel kayıt alanını desteklemiyor.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
      // v2: Media blobs were stored inside each record.
      // v3: Record payloads are encrypted; vault metadata has its own store.
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error || new Error('Veritabanı açılamadı.'));
    request.onblocked = () => reject(new Error('Bedrock başka bir sekmede güncelleniyor. Diğer sekmeyi kapatıp tekrar dene.'));
  });
}

function storeRequest(mode, operation) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let request;
    try { request = operation(store); }
    catch (error) { reject(error); return; }
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = () => reject(transaction.error || new Error('Kayıt işlemi tamamlanamadı.'));
    transaction.onabort = () => reject(transaction.error || new Error('Kayıt işlemi iptal edildi.'));
  });
}

async function persistEncryptedRecord(record) {
  const existingEnvelope = await storeRequest('readonly', store => store.get(record.id));
  const encryptedRecord = await encryptRecord(record, vaultCryptoKey, existingEnvelope || null);
  await storeRequest('readwrite', store => store.put(encryptedRecord));
}

function upsertRecordInMemory(record) {
  const index = records.findIndex(item => item.id === record.id);
  if (index >= 0) records[index] = record;
  else records.push(record);
  records.sort((a, b) => b.updatedAt - a.updatedAt);
  renderRecords();
  renderWorkspace();
  scheduleNextReminder();
  if (!document.hidden) window.setTimeout(processDueReminders, 250);
}

function removeRecordsInMemory(ids) {
  const removed = new Set(ids);
  records = records.filter(record => !removed.has(record.id));
  for (const pane of workspacePanes) {
    pane.tabs = pane.tabs.filter(id => !removed.has(id));
    if (!pane.tabs.includes(pane.activeId)) pane.activeId = pane.tabs[pane.tabs.length - 1] || null;
  }
  saveWorkspaceState();
  renderRecords();
  renderWorkspace();
  scheduleNextReminder();
}

async function loadRecords() {
  if (!vaultCryptoKey) throw new Error('Kasa kilitli.');
  const stored = await storeRequest('readonly', store => store.getAll());
  const decrypted = [];
  // Decrypt in small batches so several large audio/photo attachments do not all
  // expand in memory at once on lower-memory Android phones.
  for (let index = 0; index < stored.length; index += 6) {
    const batch = stored.slice(index, index + 6);
    decrypted.push(...await Promise.all(batch.map(item => decryptRecord(item, vaultCryptoKey))));
  }
  records = decrypted;
  records.sort((a, b) => b.updatedAt - a.updatedAt);
  renderRecords();
  renderWorkspace();
  // Rebuild local reminder timers after every vault unlock / app reload.
  // The scheduler is page-bound; it is not an OS alarm while the PWA is closed.
  scheduleNextReminder();
}

function getMeta(key) {
  return new Promise((resolve, reject) => {
    const tx = database.transaction(META_STORE, 'readonly');
    const request = tx.objectStore(META_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error('Güvenlik ayarları okunamadı.'));
  });
}

function saveMeta(value) {
  return new Promise((resolve, reject) => {
    const tx = database.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Güvenlik ayarları kaydedilemedi.'));
    tx.onabort = () => reject(tx.error || new Error('Güvenlik ayarları kaydedilemedi.'));
  });
}

function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derivePasswordWrappingKey(password, salt, iterations = PBKDF2_ITERATIONS) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptBytes(bytes, key, additionalData) {
  const iv = randomBytes(12);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: encoder.encode(additionalData), tagLength: 128 },
    key,
    bytes
  );
  return { iv, cipher };
}

async function decryptBytes(envelope, key, additionalData) {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: envelope.iv, additionalData: encoder.encode(additionalData), tagLength: 128 },
    key,
    envelope.cipher
  );
}

function normalizeTags(value) {
  const source = Array.isArray(value) ? value : (typeof value === 'string' ? value.split(/[,;\n]/) : []);
  const result = [];
  const seen = new Set();
  for (const raw of source) {
    const tag = String(raw || '').trim().replace(/^#+/, '').trim().replace(/\s+/g, ' ').slice(0, 24);
    const key = tag.toLocaleLowerCase('tr-TR');
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
    if (result.length >= 12) break;
  }
  return result;
}

function parseTagsInput(value) {
  return normalizeTags(String(value || '').split(/[,;\n]/));
}

function tagsToInput(tags) {
  return normalizeTags(tags).join(', ');
}

function toDateTimeLocal(timestamp) {
  if (!Number.isFinite(timestamp)) return '';
  const localDate = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function parseReminderInput(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function formatReminderDate(timestamp) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(timestamp));
}

async function encryptRecord(record, key, existingEnvelope = null) {
  const metadata = {
    title: record.title,
    body: record.body,
    category: record.category,
    credential: record.category === 'password' ? {
      username: record.credential && record.credential.username ? record.credential.username : '',
      password: record.credential && record.credential.password ? record.credential.password : '',
      website: record.credential && record.credential.website ? record.credential.website : ''
    } : null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    tags: normalizeTags(record.tags),
    favorite: Boolean(record.favorite),
    deletedAt: Number.isFinite(record.deletedAt) ? record.deletedAt : null,
    archivedAt: Number.isFinite(record.archivedAt) ? record.archivedAt : null,
    reminderAt: Number.isFinite(record.reminderAt) ? record.reminderAt : null,
    reminderNotifiedAt: Number.isFinite(record.reminderNotifiedAt) ? record.reminderNotifiedAt : null
  };
  const encryptedMetadata = await encryptBytes(encoder.encode(JSON.stringify(metadata)), key, `bedrock-record:${record.id}:meta`);
  const attachments = [];
  const reusableAttachments = new Map((existingEnvelope && Array.isArray(existingEnvelope.attachments) ? existingEnvelope.attachments : []).map(item => [item.id, item]));
  for (const attachment of (record.attachments || [])) {
    const previous = reusableAttachments.get(attachment.id);
    if (previous && previous.kind === attachment.kind && previous.name === attachment.name && previous.mimeType === attachment.mimeType) {
      attachments.push(previous);
      continue;
    }
    const blob = attachment.blob instanceof Blob ? attachment.blob : new Blob([attachment.blob || new ArrayBuffer(0)], { type: attachment.mimeType || '' });
    const cipher = await encryptBytes(await blob.arrayBuffer(), key, `bedrock-record:${record.id}:attachment:${attachment.id}`);
    attachments.push({
      id: attachment.id,
      kind: attachment.kind,
      name: attachment.name,
      mimeType: attachment.mimeType || blob.type || 'application/octet-stream',
      createdAt: attachment.createdAt || Date.now(),
      iv: cipher.iv,
      cipher: cipher.cipher
    });
  }
  return {
    id: record.id,
    format: VAULT_FORMAT,
    metaIv: encryptedMetadata.iv,
    metaCipher: encryptedMetadata.cipher,
    attachments
  };
}

async function decryptRecord(envelope, key) {
  if (!envelope || envelope.format !== VAULT_FORMAT) {
    throw new Error('Şifrelenmemiş veya tanınmayan bir kayıt bulundu. Güvenlik nedeniyle kasa açılamadı.');
  }
  const metadataBytes = await decryptBytes({ iv: envelope.metaIv, cipher: envelope.metaCipher }, key, `bedrock-record:${envelope.id}:meta`);
  const metadata = JSON.parse(decoder.decode(metadataBytes));
  // v0.7 adds encrypted archive and reminder metadata. Older records receive safe defaults.
  metadata.tags = normalizeTags(metadata.tags);
  metadata.favorite = Boolean(metadata.favorite);
  metadata.deletedAt = Number.isFinite(metadata.deletedAt) ? metadata.deletedAt : null;
  metadata.archivedAt = Number.isFinite(metadata.archivedAt) ? metadata.archivedAt : null;
  metadata.reminderAt = Number.isFinite(metadata.reminderAt) ? metadata.reminderAt : null;
  metadata.reminderNotifiedAt = Number.isFinite(metadata.reminderNotifiedAt) ? metadata.reminderNotifiedAt : null;
  const attachments = [];
  for (const item of (envelope.attachments || [])) {
    const bytes = await decryptBytes({ iv: item.iv, cipher: item.cipher }, key, `bedrock-record:${envelope.id}:attachment:${item.id}`);
    attachments.push({
      id: item.id,
      kind: item.kind,
      name: item.name,
      mimeType: item.mimeType,
      createdAt: item.createdAt,
      blob: new Blob([bytes], { type: item.mimeType || 'application/octet-stream' })
    });
  }
  return { id: envelope.id, ...metadata, attachments };
}

async function makeVaultConfig(password, rawVaultKey) {
  const salt = randomBytes(16);
  const wrappingKey = await derivePasswordWrappingKey(password, salt);
  const wrapped = await encryptBytes(rawVaultKey, wrappingKey, 'bedrock-vault-key-v1');
  return {
    key: 'vaultConfig',
    version: 1,
    kdf: 'PBKDF2-SHA-256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    wrapIv: bytesToBase64(wrapped.iv),
    wrappedKey: bytesToBase64(new Uint8Array(wrapped.cipher)),
    biometric: null,
    autoBiometricUnlock: false,
    createdAt: Date.now()
  };
}

async function unwrapVaultKey(config, password) {
  const wrappingKey = await derivePasswordWrappingKey(password, base64ToBytes(config.salt), config.iterations);
  const rawKey = await decryptBytes({ iv: base64ToBytes(config.wrapIv), cipher: base64ToBytes(config.wrappedKey) }, wrappingKey, 'bedrock-vault-key-v1');
  try {
    return await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  } finally {
    new Uint8Array(rawKey).fill(0);
  }
}

async function commitNewVault(config, key) {
  const existing = await storeRequest('readonly', store => store.getAll());
  if (existing.some(item => item.format === VAULT_FORMAT)) {
    throw new Error('Şifrelenmiş kayıtlar var ancak kasa ayarları bulunamadı. Yeni kasa oluşturmak güvenli değil.');
  }
  const encrypted = [];
  for (const record of existing) encrypted.push(await encryptRecord(record, key));
  await new Promise((resolve, reject) => {
    const tx = database.transaction([STORE_NAME, META_STORE], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const item of encrypted) store.put(item);
    tx.objectStore(META_STORE).put(config);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('İlk güvenli kasa oluşturulamadı.'));
    tx.onabort = () => reject(tx.error || new Error('İlk güvenli kasa oluşturulamadı.'));
  });
}

function setGateMode(mode) {
  gateMode = mode;
  document.body.classList.add('vault-locked');
  elements.gate.hidden = false;
  elements.gateError.textContent = '';
  elements.gatePassword.value = '';
  elements.gateConfirm.value = '';
  elements.gateConfirmWrap.hidden = mode !== 'setup';
  elements.gateConfirm.required = mode === 'setup';
  elements.gatePassword.autocomplete = mode === 'setup' ? 'new-password' : 'current-password';
  elements.gateBiometric.hidden = mode !== 'unlock' || !vaultConfig || !vaultConfig.biometric;
  elements.gateRestoreBackup.hidden = mode !== 'setup' && mode !== 'recovery';
  elements.gateForm.hidden = mode === 'recovery';
  if (mode === 'recovery') {
    elements.gateTitle.textContent = 'Mevcut kasa verileri bulundu.';
    elements.gateSubtitle.textContent = 'Şifrelenmiş kayıtlar var ancak kasa anahtar ayarı bu adreste bulunamadı. Yeni kasa oluşturma; ilk kullandığın adresi aç veya şifreli yedeğini geri yükle.';
    elements.gateSubmit.hidden = true;
  } else if (mode === 'setup') {
    elements.gateSubmit.hidden = false;
    elements.gateTitle.textContent = 'Kişisel kasanı oluştur.';
    elements.gateSubtitle.textContent = 'Bir ana parola belirle. Bedrock kayıtlarını bu parola ile cihazında şifreleyecek.';
    elements.gateSubmit.textContent = 'Güvenli kasayı oluştur';
  } else {
    elements.gateSubmit.hidden = false;
    elements.gateTitle.textContent = 'Bedrock kilitli.';
    elements.gateSubtitle.textContent = 'Kayıtlarını açmak için ana parolanı gir.';
    elements.gateSubmit.textContent = 'Kasayı aç';
  }
  if (!(mode === 'unlock' && vaultConfig && vaultConfig.biometric && vaultConfig.autoBiometricUnlock)) {
    window.setTimeout(() => elements.gatePassword.focus(), 80);
  }
  if (mode === 'unlock') scheduleAutomaticBiometricUnlock();
}

function scheduleAutomaticBiometricUnlock() {
  const token = ++autoBiometricAttemptToken;
  autoBiometricAttempted = false;
  if (!vaultConfig || !vaultConfig.biometric || !vaultConfig.autoBiometricUnlock) return;
  window.setTimeout(() => {
    if (token !== autoBiometricAttemptToken || autoBiometricAttempted || gateMode !== 'unlock' || elements.gate.hidden || document.hidden) return;
    autoBiometricAttempted = true;
    unlockWithBiometric({ automatic: true });
  }, 650);
}

async function unlockWithPassword(password) {
  const key = await unwrapVaultKey(vaultConfig, password);
  vaultCryptoKey = key;
  try {
    await loadRecords();
  } catch (error) {
    vaultCryptoKey = null;
    throw error;
  }
  document.body.classList.remove('vault-locked');
  elements.gate.hidden = true;
  elements.gatePassword.value = '';
  elements.gateConfirm.value = '';
  updateBiometricSettings();
  updateNotificationSettings();
  openPendingReminderRecord();
}

async function setupVault(password) {
  const rawKey = randomBytes(32);
  try {
    const key = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
    const config = await makeVaultConfig(password, rawKey);
    await commitNewVault(config, key);
    vaultConfig = config;
    vaultCryptoKey = key;
    await loadRecords();
    document.body.classList.remove('vault-locked');
    elements.gate.hidden = true;
    updateBiometricSettings();
    updateNotificationSettings();
    showToast('Bedrock kasan şifrelendi ve hazır.');
  } finally {
    rawKey.fill(0);
  }
}

function readAppearancePreferences() {
  const defaults = { theme: 'dark', accent: 'green', density: 'comfortable' };
  try {
    const stored = JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) || '{}');
    return {
      theme: stored.theme === 'light' ? 'light' : 'dark',
      accent: ACCENT_PALETTE[stored.accent] ? stored.accent : 'green',
      density: stored.density === 'compact' ? 'compact' : 'comfortable'
    };
  } catch (_) { return defaults; }
}

function applyAppearancePreferences(preferences = readAppearancePreferences()) {
  const root = document.documentElement;
  const palette = ACCENT_PALETTE[preferences.accent] || ACCENT_PALETTE.green;
  root.dataset.theme = preferences.theme === 'light' ? 'light' : 'dark';
  root.dataset.density = preferences.density === 'compact' ? 'compact' : 'comfortable';
  root.dataset.accent = preferences.accent in ACCENT_PALETTE ? preferences.accent : 'green';
  root.style.setProperty('--accent', palette.main);
  root.style.setProperty('--accent-2', palette.secondary);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = preferences.theme === 'light' ? '#f3f5f7' : '#11151b';
  if (elements.appearanceTheme) elements.appearanceTheme.value = root.dataset.theme;
  if (elements.appearanceAccent) elements.appearanceAccent.value = root.dataset.accent;
  if (elements.appearanceDensity) elements.appearanceDensity.value = root.dataset.density;
}

function saveAppearancePreferences() {
  const preferences = {
    theme: elements.appearanceTheme.value === 'light' ? 'light' : 'dark',
    accent: ACCENT_PALETTE[elements.appearanceAccent.value] ? elements.appearanceAccent.value : 'green',
    density: elements.appearanceDensity.value === 'compact' ? 'compact' : 'comfortable'
  };
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(preferences));
    applyAppearancePreferences(preferences);
    showToast('Görünüm ayarları kaydedildi.');
  } catch (_) {
    applyAppearancePreferences(preferences);
    showToast('Görünüm uygulandı ancak tarayıcı tercihi kaydedemedi.');
  }
}

function updateBiometricSettings() {
  const enabled = Boolean(vaultConfig && vaultConfig.biometric);
  const autoEnabled = Boolean(enabled && vaultConfig.autoBiometricUnlock);
  elements.biometricStatus.textContent = enabled
    ? 'Bu cihazda biyometrik hızlı açma etkin.'
    : 'Kapalı. Ana parola her açılışta kullanılacak.';
  elements.enableBiometric.hidden = enabled;
  elements.disableBiometric.hidden = !enabled;
  elements.gateBiometric.hidden = !enabled || !document.body.classList.contains('vault-locked');
  elements.autoBiometricToggle.checked = autoEnabled;
  elements.autoBiometricToggle.disabled = !enabled;
  elements.autoBiometricHelp.textContent = enabled
    ? 'Bedrock açıldığında cihaz doğrulamasını otomatik başlat.'
    : 'Etkinleştirmek için önce biyometrik kilidi kur.';
}

function bytesFromExtension(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return null;
}

async function deriveBiometricWrappingKey(prfOutput, salt) {
  const material = await crypto.subtle.importKey('raw', prfOutput, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: encoder.encode('Bedrock biometric vault key v1') },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function getPrfOutput(credentialId, prfSalt) {
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: randomBytes(32),
      allowCredentials: [{ type: 'public-key', id: credentialId }],
      userVerification: 'required',
      timeout: 60000,
      extensions: { prf: { eval: { first: prfSalt } } }
    }
  });
  if (!assertion) throw new Error('Biyometrik doğrulama tamamlanmadı.');
  const result = assertion.getClientExtensionResults();
  const prfOutput = result && result.prf && result.prf.results && bytesFromExtension(result.prf.results.first);
  if (!prfOutput || prfOutput.length !== 32) {
    throw new Error('Bu cihaz veya tarayıcı biyometrik anahtar desteği sunmuyor. Ana parolanı kullan.');
  }
  return prfOutput;
}

async function enableBiometricUnlock() {
  if (!vaultCryptoKey || !window.isSecureContext || !navigator.credentials || !window.PublicKeyCredential) {
    showToast('Biyometrik kilit için desteklenen HTTPS ortamı gerekiyor.');
    return;
  }
  elements.enableBiometric.disabled = true;
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) throw new Error('Bu cihazda kullanılabilir biyometrik doğrulayıcı bulunamadı.');
    }
    const challenge = randomBytes(32);
    const prfSalt = randomBytes(32);
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Bedrock', id: location.hostname },
        user: { id: randomBytes(16), name: 'bedrock-local-user', displayName: 'Bedrock kullanıcısı' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
        timeout: 60000,
        attestation: 'none',
        extensions: { prf: { eval: { first: prfSalt } } }
      }
    });
    // Some authenticators cannot evaluate PRF during registration but can during assertion.
    // Confirm actual support with a get() operation instead of relying only on create() output.
    const prfOutput = await getPrfOutput(credential.rawId, prfSalt);
    const wrappingKey = await deriveBiometricWrappingKey(prfOutput, prfSalt);
    const rawVaultKey = await crypto.subtle.exportKey('raw', vaultCryptoKey);
    try {
      const wrapped = await encryptBytes(rawVaultKey, wrappingKey, 'bedrock-biometric-key-v1');
      vaultConfig.biometric = {
        credentialId: bytesToBase64(new Uint8Array(credential.rawId)),
        prfSalt: bytesToBase64(prfSalt),
        wrapIv: bytesToBase64(wrapped.iv),
        wrappedKey: bytesToBase64(new Uint8Array(wrapped.cipher))
      };
      await saveMeta(vaultConfig);
    } finally {
      new Uint8Array(rawVaultKey).fill(0);
      prfOutput.fill(0);
    }
    updateBiometricSettings();
    showToast('Biyometrik hızlı açma etkinleştirildi.');
  } catch (error) {
    console.error('Biyometrik kurulum:', error);
    showToast(error.message || 'Biyometrik kilit etkinleştirilemedi.');
  } finally {
    elements.enableBiometric.disabled = false;
  }
}

async function unlockWithBiometric(options = {}) {
  const automatic = Boolean(options && options.automatic === true);
  if (!vaultConfig || !vaultConfig.biometric || biometricUnlockInProgress) return;
  biometricUnlockInProgress = true;
  elements.gateBiometric.disabled = true;
  elements.gateError.textContent = automatic ? 'Otomatik biyometrik doğrulama başlatılıyor…' : 'Cihaz doğrulaması bekleniyor…';
  try {
    const biometric = vaultConfig.biometric;
    const prfSalt = base64ToBytes(biometric.prfSalt);
    const credentialId = base64ToBytes(biometric.credentialId);
    const prfOutput = await getPrfOutput(credentialId, prfSalt);
    const wrappingKey = await deriveBiometricWrappingKey(prfOutput, prfSalt);
    try {
      const rawKey = await decryptBytes(
        { iv: base64ToBytes(biometric.wrapIv), cipher: base64ToBytes(biometric.wrappedKey) },
        wrappingKey,
        'bedrock-biometric-key-v1'
      );
      vaultCryptoKey = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
      new Uint8Array(rawKey).fill(0);
      await loadRecords();
      document.body.classList.remove('vault-locked');
      elements.gate.hidden = true;
      elements.gateError.textContent = '';
      updateBiometricSettings();
      updateNotificationSettings();
      openPendingReminderRecord();
    } finally {
      prfOutput.fill(0);
    }
  } catch (error) {
    vaultCryptoKey = null;
    elements.gateError.textContent = automatic
      ? 'Otomatik biyometrik giriş başlatılamadı. Parmak izi düğmesine dokunabilir veya ana parolanı girebilirsin.'
      : (error.message || 'Biyometrik doğrulama başarısız. Ana parolanı kullan.');
  } finally {
    biometricUnlockInProgress = false;
    elements.gateBiometric.disabled = false;
  }
}

async function changeMasterPassword(event) {
  event.preventDefault();
  const current = document.getElementById('currentMasterPassword').value;
  const next = document.getElementById('newMasterPassword').value;
  const confirm = document.getElementById('confirmMasterPassword').value;
  const message = document.getElementById('changePasswordError');
  message.textContent = '';
  if (next.length < 12) { message.textContent = 'Yeni parola en az 12 karakter olmalı.'; return; }
  if (next !== confirm) { message.textContent = 'Yeni parola ve tekrarı eşleşmiyor.'; return; }
  try {
    const verifiedKey = await unwrapVaultKey(vaultConfig, current);
    const rawKey = await crypto.subtle.exportKey('raw', verifiedKey);
    try {
      const newConfig = await makeVaultConfig(next, rawKey);
      // A password rotation clears the old biometric wrapper. Re-enable it afterward.
      vaultConfig = newConfig;
      await saveMeta(vaultConfig);
    } finally {
      new Uint8Array(rawKey).fill(0);
    }
    elements.changePasswordForm.reset();
    elements.changePasswordModal.hidden = true;
    vaultConfig = await getMeta('vaultConfig');
    updateBiometricSettings();
    showToast('Ana parola değiştirildi. Biyometrik kilidi yeniden etkinleştirebilirsin.');
  } catch (error) {
    message.textContent = 'Mevcut parola yanlış veya işlem tamamlanamadı.';
  }
}

function clearUnlockedSession() {
  window.clearTimeout(reminderTimer);
  reminderTimer = null;
  vaultCryptoKey = null;
  records = [];
  releaseRenderedObjectUrls();
  releaseWorkspaceObjectUrls();
  elements.workspacePanel.hidden = true;
  elements.workspaceTabs.forEach(node => node.replaceChildren());
  elements.workspaceContents.forEach(node => node.replaceChildren());
  elements.search.value = '';
  elements.dateFilter.value = 'all';
  elements.contentFilter.value = 'all';
  elements.sortFilter.value = 'newest';
  activeTagFilter = '';
  activeCategory = 'all';
  updateFilterButtons();
  elements.list.replaceChildren();
  elements.count.textContent = 'KİLİTLİ';
  elements.allCount.textContent = '0';
  elements.form.reset();
  clearNotePhotoDraft();
  elements.modal.hidden = true;
  elements.audioModal.hidden = true;
  elements.photoModal.hidden = true;
  elements.settingsModal.hidden = true;
  elements.changePasswordModal.hidden = true;
  elements.changePasswordForm.reset();
  elements.passwordModal.hidden = true;
  elements.passwordDetailModal.hidden = true;
  elements.backupExportModal.hidden = true;
  elements.backupImportModal.hidden = true;
  elements.passwordForm.reset();
  elements.backupExportForm.reset();
  elements.backupImportForm.reset();
  elements.passwordDetailValue.value = '';
  elements.passwordDetailUsername.value = '';
  pendingBackupFile = null;
  activePasswordRecordId = null;
  document.body.classList.remove('modal-open');
  closePhotoModal();
  resetAudioModal();
}

function lockVault() {
  if (!vaultCryptoKey) return;
  clearUnlockedSession();
  setGateMode('unlock');
  showToast('Bedrock kilitlendi.');
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeSearch(value) {
  return String(value || '').toLocaleLowerCase('tr-TR').trim();
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(timestamp));
}

function categoryName(category) {
  if (category === 'object') return 'Eşya konumu';
  if (category === 'password') return 'Parola';
  return 'Genel not';
}

function iconMarkup(category) {
  if (category === 'object') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 8 7.5 4.3L19.5 8M12 12.3V21"/></svg>';
  }
  if (category === 'password') {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5h14v15H5zM8 8h8M8 12h8M8 16h5"/></svg>';
}

function rememberObjectUrl(blob) {
  const url = URL.createObjectURL(blob);
  activeObjectUrls.push(url);
  return url;
}

function releaseRenderedObjectUrls() {
  for (const url of activeObjectUrls) URL.revokeObjectURL(url);
  activeObjectUrls = [];
}

function createAttachmentView(attachment) {
  const wrapper = document.createElement('div');
  wrapper.className = 'attachment-item';
  const url = rememberObjectUrl(attachment.blob);

  if (attachment.kind === 'image') {
    const link = document.createElement('a');
    link.className = 'attachment-image-link';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.setAttribute('aria-label', `${attachment.name || 'Fotoğraf'} görselini aç`);
    const image = document.createElement('img');
    image.className = 'attachment-image';
    image.src = url;
    image.alt = attachment.name || 'Kaydedilmiş fotoğraf';
    image.loading = 'lazy';
    image.decoding = 'async';
    link.append(image);
    wrapper.append(link);
  } else if (attachment.kind === 'audio') {
    const audioWrap = document.createElement('div');
    audioWrap.className = 'attachment-audio';
    const label = document.createElement('span');
    label.className = 'attachment-audio-label';
    label.textContent = attachment.name || 'Ses kaydı';
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'metadata';
    audio.src = url;
    audio.setAttribute('aria-label', attachment.name || 'Ses kaydı oynatıcı');
    audioWrap.append(label, audio);
    wrapper.append(audioWrap);
  }
  return wrapper;
}

function activateTagFilter(tag) {
  activeTagFilter = activeTagFilter.toLocaleLowerCase('tr-TR') === String(tag).toLocaleLowerCase('tr-TR') ? '' : String(tag);
  renderRecords();
}

function createTagChip(tag, isFilter = false) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = isFilter ? 'tag-filter-chip' : 'record-tag';
  chip.textContent = `#${tag}`;
  chip.dataset.tagFilter = tag;
  chip.setAttribute('aria-pressed', String(activeTagFilter.toLocaleLowerCase('tr-TR') === tag.toLocaleLowerCase('tr-TR')));
  if (activeTagFilter.toLocaleLowerCase('tr-TR') === tag.toLocaleLowerCase('tr-TR')) chip.classList.add('active');
  if (!isFilter) chip.addEventListener('click', () => activateTagFilter(tag));
  return chip;
}

function createRecordAction(label, title, glyph, onClick, extraClass = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `record-action ${extraClass}`.trim();
  button.setAttribute('aria-label', label);
  button.title = title;
  if (glyph === 'favorite') {
    button.textContent = '★';
  } else {
    button.innerHTML = glyph;
  }
  button.addEventListener('click', onClick);
  return button;
}

function releaseWorkspaceObjectUrls() {
  for (const url of workspaceObjectUrls) URL.revokeObjectURL(url);
  workspaceObjectUrls = [];
}

function makeWorkspaceIcon(name) {
  const paths = {
    open: '<path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    edit: '<path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    archive: '<path d="M4 7h16v13H4zM3 4h18v3H3zM9 12h6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/>',
    restore: '<path d="M4 11a8 8 0 1 1 2.2 5.5M4 5v6h6"/><path d="M12 8v4l2.5 1.5"/>',
    key: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    split: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M12 4v16"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.open}</svg>`;
}

function createWorkspaceAction(label, icon, onClick, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `workspace-action ${className}`.trim();
  button.setAttribute('aria-label', label);
  button.title = label;
  button.innerHTML = makeWorkspaceIcon(icon);
  button.addEventListener('click', event => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function closeWorkspaceTab(paneIndex, recordId) {
  const pane = workspacePanes[paneIndex];
  if (!pane) return;
  const index = pane.tabs.indexOf(recordId);
  if (index < 0) return;
  pane.tabs.splice(index, 1);
  if (pane.activeId === recordId) pane.activeId = pane.tabs[Math.min(index, pane.tabs.length - 1)] || null;
  if (!workspacePanes[0].tabs.length && !workspacePanes[1].tabs.length) {
    workspaceSplit = false;
    activeWorkspacePane = 0;
  }
  saveWorkspaceState();
  renderWorkspace();
}

function openWorkspaceTab(recordId, paneIndex = activeWorkspacePane, shouldScroll = true) {
  const record = records.find(item => item.id === recordId);
  if (!record) return;
  const targetPane = workspaceSplit && window.matchMedia('(min-width: 860px)').matches ? (paneIndex === 1 ? 1 : 0) : 0;
  const pane = workspacePanes[targetPane];
  if (!pane.tabs.includes(recordId)) {
    pane.tabs.push(recordId);
    if (pane.tabs.length > 12) pane.tabs.shift();
  }
  pane.activeId = recordId;
  activeWorkspacePane = targetPane;
  saveWorkspaceState();
  renderWorkspace();
  if (shouldScroll) window.setTimeout(() => elements.workspacePanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

function createWorkspaceTab(paneIndex, record) {
  const wrapper = document.createElement('div');
  wrapper.className = 'workspace-tab-item';
  const select = document.createElement('button');
  select.type = 'button';
  select.className = 'workspace-tab-select';
  select.dataset.workspaceRecord = record.id;
  select.setAttribute('role', 'tab');
  select.setAttribute('aria-selected', String(workspacePanes[paneIndex].activeId === record.id));
  select.title = record.title;
  const icon = document.createElement('span');
  icon.className = 'workspace-tab-icon';
  icon.innerHTML = iconMarkup(record.category);
  const title = document.createElement('span');
  title.className = 'workspace-tab-title';
  title.textContent = record.title || 'Adsız kayıt';
  select.append(icon, title);
  if (workspacePanes[paneIndex].activeId === record.id) { select.classList.add('is-active'); wrapper.classList.add('is-active'); }
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'workspace-tab-close';
  close.dataset.workspaceClose = record.id;
  close.setAttribute('aria-label', `${record.title} sekmesini kapat`);
  close.title = 'Sekmeyi kapat';
  close.innerHTML = makeWorkspaceIcon('close');
  wrapper.append(select, close);
  return wrapper;
}

function createWorkspaceAttachment(attachment) {
  const wrapper = document.createElement('div');
  wrapper.className = 'workspace-attachment';
  const url = URL.createObjectURL(attachment.blob);
  workspaceObjectUrls.push(url);
  if (attachment.kind === 'image') {
    const image = document.createElement('img');
    image.className = 'workspace-image';
    image.src = url;
    image.alt = attachment.name || 'Kayıt fotoğrafı';
    image.loading = 'lazy';
    image.decoding = 'async';
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.append(image);
    wrapper.append(link);
  } else if (attachment.kind === 'audio') {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'metadata';
    audio.src = url;
    const label = document.createElement('span');
    label.textContent = attachment.name || 'Ses kaydı';
    wrapper.append(label, audio);
  }
  return wrapper;
}

function renderWorkspacePane(paneIndex) {
  const paneElement = document.querySelector(`[data-workspace-pane="${paneIndex}"]`);
  const tabsElement = elements.workspaceTabs[paneIndex];
  const contentElement = elements.workspaceContents[paneIndex];
  const pane = workspacePanes[paneIndex];
  const splitVisible = workspaceSplit && window.matchMedia('(min-width: 860px)').matches;
  paneElement.hidden = paneIndex === 1 && !splitVisible;
  paneElement.classList.toggle('is-active', activeWorkspacePane === paneIndex);
  tabsElement.replaceChildren();
  contentElement.replaceChildren();

  const paneRecords = pane.tabs.map(id => records.find(item => item.id === id)).filter(Boolean);
  pane.tabs = paneRecords.map(item => item.id);
  if (!pane.tabs.includes(pane.activeId)) pane.activeId = pane.tabs[pane.tabs.length - 1] || null;
  for (const record of paneRecords) tabsElement.append(createWorkspaceTab(paneIndex, record));

  const record = records.find(item => item.id === pane.activeId);
  if (!record) {
    const empty = document.createElement('div');
    empty.className = 'workspace-empty';
    empty.innerHTML = `<div class="workspace-empty-icon">${makeWorkspaceIcon('open')}</div><strong>${paneIndex === 1 ? 'İkinci panel hazır' : 'Çalışma alanı hazır'}</strong><p>Kütüphaneden bir kayda dokunarak burada aç.</p>`;
    contentElement.append(empty);
    return;
  }

  const article = document.createElement('article');
  article.className = 'workspace-note';
  const header = document.createElement('div');
  header.className = 'workspace-note-header';
  const headingBlock = document.createElement('div');
  headingBlock.className = 'workspace-note-heading';
  const eyebrow = document.createElement('div');
  eyebrow.className = 'workspace-note-type';
  eyebrow.textContent = `${categoryName(record.category)}${record.archivedAt ? ' · Arşiv' : ''}${record.deletedAt ? ' · Çöp kutusu' : ''}`;
  const title = document.createElement('h2');
  title.textContent = record.title || 'Adsız kayıt';
  const date = document.createElement('div');
  date.className = 'workspace-note-date';
  date.textContent = `Son güncelleme · ${formatDate(record.updatedAt)}`;
  headingBlock.append(eyebrow, title, date);
  const actions = document.createElement('div');
  actions.className = 'workspace-note-actions';
  actions.append(createWorkspaceAction('Favorilerden çıkar / favorilere ekle', 'star', () => toggleFavorite(record), record.favorite ? 'is-favorite' : ''));
  if (record.category === 'password') {
    actions.append(createWorkspaceAction('Giriş bilgilerini aç', 'key', () => openPasswordDetails(record)));
    actions.append(createWorkspaceAction('Düzenle', 'edit', () => openPasswordEditor(record)));
  } else {
    actions.append(createWorkspaceAction('Düzenle', 'edit', () => openEditor(record)));
  }
  if (record.deletedAt) {
    actions.append(createWorkspaceAction('Geri yükle', 'restore', () => restoreRecord(record)));
  } else if (record.archivedAt) {
    actions.append(createWorkspaceAction('Arşivden çıkar', 'restore', () => unarchiveRecord(record)));
    actions.append(createWorkspaceAction('Çöp kutusuna taşı', 'trash', () => deleteRecord(record)));
  } else {
    actions.append(createWorkspaceAction('Arşivle', 'archive', () => archiveRecord(record)));
    actions.append(createWorkspaceAction('Çöp kutusuna taşı', 'trash', () => deleteRecord(record)));
  }
  header.append(headingBlock, actions);
  article.append(header);

  if (record.category === 'password') {
    const privateCard = document.createElement('div');
    privateCard.className = 'workspace-private-card';
    privateCard.innerHTML = `<span class="workspace-private-icon">${makeWorkspaceIcon('key')}</span><div><strong>Şifreli giriş kaydı</strong><p>Kullanıcı adı ve parola ayrı güvenli görünümde açılır.</p></div>`;
    privateCard.append(createWorkspaceAction('Giriş bilgilerini görüntüle', 'open', () => openPasswordDetails(record)));
    article.append(privateCard);
  }

  const body = document.createElement('div');
  body.className = 'workspace-note-body';
  body.textContent = record.body || (record.category === 'password' ? '' : 'Bu kayıtta henüz açıklama yok.');
  article.append(body);

  const tags = normalizeTags(record.tags);
  if (tags.length) {
    const tagList = document.createElement('div');
    tagList.className = 'workspace-note-tags';
    tags.forEach(tag => {
      const tagButton = document.createElement('button');
      tagButton.type = 'button';
      tagButton.textContent = `#${tag}`;
      tagButton.addEventListener('click', () => {
        activeTagFilter = tag;
        activeCategory = 'all';
        updateFilterButtons();
        renderRecords();
        window.setTimeout(() => document.querySelector('.records-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      });
      tagList.append(tagButton);
    });
    article.append(tagList);
  }

  const attachments = Array.isArray(record.attachments) ? record.attachments : [];
  if (attachments.length) {
    const attachmentGrid = document.createElement('div');
    attachmentGrid.className = 'workspace-attachments';
    attachments.forEach(attachment => attachmentGrid.append(createWorkspaceAttachment(attachment)));
    article.append(attachmentGrid);
  }
  contentElement.append(article);
}

function renderWorkspace() {
  if (!elements.workspacePanel) return;
  const validIds = new Set(records.map(record => record.id));
  for (const pane of workspacePanes) {
    pane.tabs = pane.tabs.filter(id => validIds.has(id));
    if (!pane.tabs.includes(pane.activeId)) pane.activeId = pane.tabs[pane.tabs.length - 1] || null;
  }
  const canSplit = window.matchMedia('(min-width: 860px)').matches;
  // If a workspace saved on desktop is opened on a phone, merge both tab groups
  // into the primary pane so no open note becomes inaccessible on mobile.
  if (!canSplit && workspaceSplit) {
    for (const id of workspacePanes[1].tabs) {
      if (!workspacePanes[0].tabs.includes(id)) workspacePanes[0].tabs.push(id);
    }
    if (workspacePanes[1].activeId) workspacePanes[0].activeId = workspacePanes[1].activeId;
    workspacePanes[1] = { tabs: [], activeId: null };
    workspaceSplit = false;
    activeWorkspacePane = 0;
  }
  const tabCount = workspacePanes.reduce((total, pane) => total + pane.tabs.length, 0);
  elements.mobileTabCount.textContent = String(tabCount);
  elements.workspaceOpenCount.textContent = String(tabCount);
  elements.workspacePanel.hidden = tabCount === 0;
  if (activeWorkspacePane === 1 && !workspaceSplit) activeWorkspacePane = 0;
  const isSplitVisible = workspaceSplit && canSplit;
  elements.workspaceGrid.classList.toggle('is-split', isSplitVisible);
  elements.workspaceSplitButton.classList.toggle('is-active', workspaceSplit);
  elements.workspaceSplitButton.setAttribute('aria-pressed', String(workspaceSplit));
  elements.workspaceSplitButton.title = workspaceSplit ? 'Bölünmüş görünümü kapat' : 'İkinci paneli aç';
  releaseWorkspaceObjectUrls();
  renderWorkspacePane(0);
  renderWorkspacePane(1);
  saveWorkspaceState();
}

function toggleWorkspaceSplit() {
  if (!window.matchMedia('(min-width: 860px)').matches) {
    showToast('Bölünmüş görünüm geniş ekranlarda kullanılabilir.');
    return;
  }
  if (!workspaceSplit) {
    workspaceSplit = true;
    const activeRecord = records.find(record => record.id === workspacePanes[activeWorkspacePane].activeId)
      || records.find(record => record.id === workspacePanes[0].activeId);
    if (activeRecord && !workspacePanes[1].tabs.length) {
      workspacePanes[1].tabs.push(activeRecord.id);
      workspacePanes[1].activeId = activeRecord.id;
    }
    activeWorkspacePane = 1;
  } else {
    for (const id of workspacePanes[1].tabs) {
      if (!workspacePanes[0].tabs.includes(id)) workspacePanes[0].tabs.push(id);
    }
    if (workspacePanes[1].activeId) workspacePanes[0].activeId = workspacePanes[1].activeId;
    workspacePanes[1] = { tabs: [], activeId: null };
    workspaceSplit = false;
    activeWorkspacePane = 0;
  }
  saveWorkspaceState();
  renderWorkspace();
}

function closeAllWorkspaceTabs() {
  if (!workspacePanes[0].tabs.length && !workspacePanes[1].tabs.length) return;
  workspacePanes = [{ tabs: [], activeId: null }, { tabs: [], activeId: null }];
  workspaceSplit = false;
  activeWorkspacePane = 0;
  saveWorkspaceState();
  renderWorkspace();
}

function renderWorkspaceTabSwitcher() {
  const container = elements.workspaceTabSwitcherList;
  container.replaceChildren();
  const seen = new Set();
  for (let paneIndex = 0; paneIndex < workspacePanes.length; paneIndex += 1) {
    for (const recordId of workspacePanes[paneIndex].tabs) {
      if (seen.has(recordId)) continue;
      seen.add(recordId);
      const record = records.find(item => item.id === recordId);
      if (!record) continue;
      const row = document.createElement('div');
      row.className = 'workspace-switcher-row';
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'workspace-switcher-open';
      open.textContent = record.title || 'Adsız kayıt';
      open.addEventListener('click', () => {
        activeWorkspacePane = paneIndex;
        workspacePanes[paneIndex].activeId = record.id;
        saveWorkspaceState();
        renderWorkspace();
        elements.workspaceTabSwitcher.hidden = true;
        document.body.classList.remove('modal-open');
        elements.workspacePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'workspace-switcher-close';
      close.setAttribute('aria-label', `${record.title} sekmesini kapat`);
      close.innerHTML = makeWorkspaceIcon('close');
      close.addEventListener('click', () => {
        closeWorkspaceTab(paneIndex, record.id);
        renderWorkspaceTabSwitcher();
      });
      row.append(open, close);
      container.append(row);
    }
  }
  if (!container.childElementCount) {
    const empty = document.createElement('p');
    empty.className = 'workspace-switcher-empty';
    empty.textContent = 'Henüz açık sekme yok. Bir kayda dokunarak açabilirsin.';
    container.append(empty);
  }
}

function createRecordCard(record) {
  const card = document.createElement('article');
  const isTrashed = Boolean(record.deletedAt);
  const isArchived = Boolean(record.archivedAt) && !isTrashed;
  card.className = `record-card${isTrashed ? ' is-trashed' : ''}${isArchived ? ' is-archived' : ''}`;
  card.dataset.recordId = record.id;

  const symbol = document.createElement('div');
  symbol.className = 'record-symbol';
  symbol.innerHTML = iconMarkup(record.category);

  const main = document.createElement('div');
  main.className = 'record-main';
  main.dataset.openRecord = record.id;
  main.title = 'Çalışma alanında aç';
  const title = document.createElement('h3');
  title.className = 'record-title';
  title.textContent = record.title;
  const preview = document.createElement('p');
  preview.className = 'record-preview';
  preview.textContent = record.category === 'password'
    ? 'Giriş bilgileri şifreli olarak saklanıyor.'
    : (record.body || 'Açıklama eklenmedi.');
  const meta = document.createElement('div');
  meta.className = 'record-meta';
  const category = document.createElement('span');
  category.textContent = categoryName(record.category);
  const dot = document.createElement('span');
  dot.className = 'meta-dot';
  const date = document.createElement('span');
  date.textContent = formatDate(record.updatedAt);
  meta.append(category, dot, date);

  if (isTrashed || isArchived) {
    const statusDot = document.createElement('span');
    statusDot.className = 'meta-dot';
    const statusLabel = document.createElement('span');
    statusLabel.textContent = isTrashed ? `Çöp kutusu · ${formatDate(record.deletedAt)}` : `Arşiv · ${formatDate(record.archivedAt)}`;
    meta.append(statusDot, statusLabel);
  }
  if (record.reminderAt && !isTrashed && !isArchived) {
    const reminderDot = document.createElement('span');
    reminderDot.className = 'meta-dot';
    const reminderLabel = document.createElement('span');
    reminderLabel.className = 'reminder-meta';
    const isDue = record.reminderAt <= Date.now();
    reminderLabel.textContent = `${record.reminderNotifiedAt ? '✓ Hatırlatıldı' : isDue ? '⏰ Hatırlatma zamanı' : '◷ Hatırlatma'} · ${formatReminderDate(record.reminderAt)}`;
    meta.append(reminderDot, reminderLabel);
  }

  const attachments = Array.isArray(record.attachments) ? record.attachments : [];
  if (attachments.length) {
    const mediaDot = document.createElement('span');
    mediaDot.className = 'meta-dot';
    const mediaCount = document.createElement('span');
    const imageCount = attachments.filter(item => item.kind === 'image').length;
    const audioCount = attachments.filter(item => item.kind === 'audio').length;
    mediaCount.textContent = [imageCount ? `${imageCount} fotoğraf` : '', audioCount ? `${audioCount} ses` : ''].filter(Boolean).join(' · ');
    meta.append(mediaDot, mediaCount);
  }
  main.append(title, preview, meta);

  const tags = normalizeTags(record.tags);
  if (tags.length) {
    const tagWrap = document.createElement('div');
    tagWrap.className = 'record-tags';
    for (const tag of tags) tagWrap.append(createTagChip(tag));
    main.append(tagWrap);
  }

  if (attachments.length) {
    const media = document.createElement('div');
    media.className = 'record-attachments';
    for (const attachment of attachments) media.append(createAttachmentView(attachment));
    main.append(media);
  }

  const actions = document.createElement('div');
  actions.className = 'record-actions';

  actions.append(createRecordAction(`${record.title} kaydını çalışma alanında aç`, 'Çalışma alanında aç', '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>', () => openWorkspaceTab(record.id), 'open-workspace-action'));

  if (record.category === 'password' && !isTrashed) {
    const viewButton = createRecordAction(
      `${record.title} giriş bilgilerini görüntüle`,
      'Giriş bilgilerini görüntüle',
      '<svg viewBox="0 0 24 24"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
      () => openPasswordDetails(record)
    );
    actions.append(viewButton);
  }

  if (isTrashed) {
    const restoreButton = createRecordAction(
      `${record.title} kaydını geri yükle`,
      'Geri yükle',
      '<svg viewBox="0 0 24 24"><path d="M4 11a8 8 0 1 1 2.2 5.5M4 5v6h6"/><path d="M12 8v4l2.5 1.5"/></svg>',
      () => restoreRecord(record), 'restore-action'
    );
    const permanentButton = createRecordAction(
      `${record.title} kaydını kalıcı sil`,
      'Kalıcı sil',
      '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>',
      () => permanentlyDeleteRecord(record), 'permanent-delete-action'
    );
    actions.append(restoreButton, permanentButton);
  } else if (isArchived) {
    const unarchiveButton = createRecordAction(
      `${record.title} kaydını arşivden çıkar`, 'Arşivden çıkar',
      '<svg viewBox="0 0 24 24"><path d="M4 7h16v13H4zM3 4h18v3H3zM9 12h6"/></svg>',
      () => unarchiveRecord(record), 'restore-action'
    );
    const deleteButton = createRecordAction(
      `${record.title} kaydını çöp kutusuna taşı`, 'Çöp kutusuna taşı',
      '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>',
      () => deleteRecord(record)
    );
    actions.append(unarchiveButton, deleteButton);
  } else {
    const favoriteButton = createRecordAction(
      record.favorite ? `${record.title} favorilerden çıkar` : `${record.title} favorilere ekle`,
      record.favorite ? 'Favorilerden çıkar' : 'Favorilere ekle',
      'favorite', () => toggleFavorite(record),
      `favorite-action${record.favorite ? ' is-favorite' : ''}`
    );
    const editButton = createRecordAction(
      `${record.title} kaydını düzenle`, 'Düzenle',
      '<svg viewBox="0 0 24 24"><path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z"/></svg>',
      () => record.category === 'password' ? openPasswordEditor(record) : openEditor(record)
    );
    const archiveButton = createRecordAction(
      `${record.title} kaydını arşivle`, 'Arşivle',
      '<svg viewBox="0 0 24 24"><path d="M4 7h16v13H4zM3 4h18v3H3zM9 12h6"/></svg>',
      () => archiveRecord(record), 'archive-action'
    );
    const deleteButton = createRecordAction(
      `${record.title} kaydını çöp kutusuna taşı`, 'Çöp kutusuna taşı',
      '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>',
      () => deleteRecord(record)
    );
    actions.append(favoriteButton, editButton, archiveButton, deleteButton);
  }

  card.append(symbol, main, actions);
  return card;
}

function renderTagFilters(scopeRecords) {
  const unique = new Map();
  for (const record of scopeRecords) {
    for (const tag of normalizeTags(record.tags)) {
      const key = tag.toLocaleLowerCase('tr-TR');
      if (!unique.has(key)) unique.set(key, tag);
    }
  }
  const tags = [...unique.values()].sort((a, b) => a.localeCompare(b, 'tr-TR')).slice(0, 24);
  elements.tagFilters.replaceChildren();
  elements.tagFilters.hidden = tags.length === 0;
  if (!tags.length) return;
  const label = document.createElement('span');
  label.className = 'tag-filter-label';
  label.textContent = 'ETİKETLER';
  elements.tagFilters.append(label);
  const allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.className = `tag-filter-chip${activeTagFilter ? '' : ' active'}`;
  allButton.textContent = 'Tümü';
  allButton.setAttribute('aria-pressed', String(!activeTagFilter));
  allButton.addEventListener('click', () => { activeTagFilter = ''; renderRecords(); });
  elements.tagFilters.append(allButton);
  for (const tag of tags) elements.tagFilters.append(createTagChip(tag, true));
}

function recordMatchesContentFilter(record, filter) {
  const attachments = Array.isArray(record.attachments) ? record.attachments : [];
  const hasImage = attachments.some(item => item.kind === 'image');
  const hasAudio = attachments.some(item => item.kind === 'audio');
  if (filter === 'text') return record.category !== 'password' && Boolean(String(record.body || '').trim());
  if (filter === 'photo') return hasImage;
  if (filter === 'audio') return hasAudio;
  if (filter === 'media') return hasImage || hasAudio;
  if (filter === 'password') return record.category === 'password';
  return true;
}

function recordMatchesDateFilter(record, filter, now = Date.now()) {
  if (filter === 'all') return true;
  const timestamp = Number(record.updatedAt) || Number(record.createdAt) || 0;
  const age = now - timestamp;
  if (filter === 'today') {
    const date = new Date(timestamp);
    const today = new Date(now);
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  }
  if (filter === '7days') return age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
  if (filter === '30days') return age >= 0 && age <= 30 * 24 * 60 * 60 * 1000;
  if (filter === 'older') return age > 30 * 24 * 60 * 60 * 1000;
  return true;
}

function updateAdvancedFilterSummary() {
  const count = [elements.dateFilter.value !== 'all', elements.contentFilter.value !== 'all', elements.sortFilter.value !== 'newest'].filter(Boolean).length;
  elements.advancedFilterSummary.textContent = count ? `${count} etkin filtre` : 'İsteğe bağlı';
}

function renderRecords() {
  releaseRenderedObjectUrls();
  const query = escapeSearch(elements.search.value);
  const showingTrash = activeCategory === 'trash';
  const showingArchive = activeCategory === 'archive';
  const scopeRecords = records.filter(record => {
    if (showingTrash) return Boolean(record.deletedAt);
    if (record.deletedAt) return false;
    if (showingArchive) return Boolean(record.archivedAt);
    return !record.archivedAt;
  });
  renderTagFilters(scopeRecords);

  const now = Date.now();
  const filtered = scopeRecords.filter(record => {
    let matchesView = true;
    if (activeCategory === 'favorites') matchesView = Boolean(record.favorite) && !record.archivedAt;
    else if (activeCategory !== 'all' && activeCategory !== 'trash' && activeCategory !== 'archive') matchesView = record.category === activeCategory;
    const attachmentNames = (record.attachments || []).map(item => item.name || '').join(' ');
    const credentialText = record.category === 'password'
      ? `${record.credential && record.credential.username || ''} ${record.credential && record.credential.website || ''}`
      : '';
    const searchable = escapeSearch(`${record.title} ${record.body} ${credentialText} ${categoryName(record.category)} ${attachmentNames} ${normalizeTags(record.tags).join(' ')}`);
    const matchesTag = !activeTagFilter || normalizeTags(record.tags).some(tag => tag.toLocaleLowerCase('tr-TR') === activeTagFilter.toLocaleLowerCase('tr-TR'));
    const matchesContent = recordMatchesContentFilter(record, elements.contentFilter.value);
    const matchesDate = recordMatchesDateFilter(record, elements.dateFilter.value, now);
    return matchesView && matchesTag && matchesContent && matchesDate && (!query || searchable.includes(query));
  });

  const activeRecords = records.filter(record => !record.deletedAt && !record.archivedAt);
  const favoriteRecords = activeRecords.filter(record => record.favorite);
  const trashRecords = records.filter(record => Boolean(record.deletedAt));
  const archiveRecords = records.filter(record => !record.deletedAt && Boolean(record.archivedAt));
  elements.count.textContent = `${filtered.length} KAYIT`;
  elements.allCount.textContent = String(activeRecords.length);
  elements.favoriteCount.textContent = String(favoriteRecords.length);
  elements.trashCount.textContent = String(trashRecords.length);
  elements.archiveCount.textContent = String(archiveRecords.length);
  elements.emptyTrash.hidden = !showingTrash || trashRecords.length === 0;
  updateAdvancedFilterSummary();

  if (elements.sortFilter.value === 'oldest') filtered.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
  else if (elements.sortFilter.value === 'titleAsc') filtered.sort((a, b) => String(a.title).localeCompare(String(b.title), 'tr-TR'));
  else if (elements.sortFilter.value === 'titleDesc') filtered.sort((a, b) => String(b.title).localeCompare(String(a.title), 'tr-TR'));
  else filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  const heading = document.getElementById('recordsHeading');
  heading.textContent = activeCategory === 'favorites' ? 'Favorilerin'
    : showingTrash ? 'Çöp kutusu'
    : showingArchive ? 'Arşiv'
    : activeCategory === 'all' ? 'Kayıtların' : categoryName(activeCategory);
  elements.list.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const icon = document.createElement('div');
    icon.className = 'empty-icon';
    icon.innerHTML = showingTrash
      ? '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7"/></svg>'
      : showingArchive
        ? '<svg viewBox="0 0 24 24"><path d="M4 7h16v13H4zM3 4h18v3H3zM9 12h6"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M6 3.5h8l4 4V20H6z"/><path d="M14 3.5V8h4M9 12h6M9 16h6"/></svg>';
    const headingText = document.createElement('h3');
    const paragraph = document.createElement('p');
    const button = document.createElement('button');
    button.className = 'text-action';
    button.type = 'button';
    const anyAdvanced = query || activeTagFilter || elements.dateFilter.value !== 'all' || elements.contentFilter.value !== 'all' || elements.sortFilter.value !== 'newest';
    if (anyAdvanced || (activeCategory !== 'all' && activeCategory !== 'trash' && activeCategory !== 'archive' && activeCategory !== 'favorites') || activeCategory === 'favorites') {
      headingText.textContent = activeCategory === 'favorites' && !favoriteRecords.length ? 'Henüz favorin yok' : 'Burada henüz bir kayıt yok';
      paragraph.textContent = activeCategory === 'favorites' && !favoriteRecords.length ? 'Beğendiğin kayıtların yanındaki yıldız simgesine dokun.' : 'Aramanı veya seçtiğin filtreleri değiştirebilirsin.';
      button.textContent = 'Filtreleri sıfırla';
      button.addEventListener('click', clearAllFilters);
    } else if (showingTrash || showingArchive) {
      headingText.textContent = showingTrash ? 'Çöp kutun boş' : 'Arşivin boş';
      paragraph.textContent = showingTrash ? 'Sildiğin kayıtlar burada görünür. İstersen daha sonra geri yükleyebilirsin.' : 'Arşivlediğin kayıtlar burada görünür. İstediğinde tekrar kayıtlarına alabilirsin.';
      button.textContent = 'Kayıtlarıma dön';
      button.addEventListener('click', () => { activeCategory = 'all'; activeTagFilter = ''; updateFilterButtons(); renderRecords(); });
    } else {
      headingText.textContent = 'Henüz bir kaydın yok';
      paragraph.textContent = 'İlk notunu ekleyerek Bedrock’u doldurmaya başla.';
      button.textContent = 'İlk kaydını oluştur ↗';
      button.addEventListener('click', () => openEditor());
    }
    empty.append(icon, headingText, paragraph, button);
    elements.list.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const record of filtered) fragment.append(createRecordCard(record));
  elements.list.append(fragment);
}

function clearAllFilters() {
  activeCategory = 'all';
  activeTagFilter = '';
  elements.search.value = '';
  elements.dateFilter.value = 'all';
  elements.contentFilter.value = 'all';
  elements.sortFilter.value = 'newest';
  updateFilterButtons();
  renderRecords();
}

function updateFilterButtons() {
  elements.filters.querySelectorAll('[data-category]').forEach(button => {
    const isActive = button.dataset.category === activeCategory;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function showToast(message) {
  window.clearTimeout(toastTimeout);
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  toastTimeout = window.setTimeout(() => elements.toast.classList.remove('show'), 3000);
}

function clearNotePhotoDraft() {
  noteEditorSession += 1;
  notePhotoProcessing = false;
  elements.addPhotoToNote.disabled = false;
  elements.saveButton.disabled = false;
  for (const url of pendingNotePhotoPreviewUrls) URL.revokeObjectURL(url);
  pendingNotePhotoPreviewUrls = [];
  pendingNotePhotoAttachments = [];
  elements.noteAttachmentPreview.replaceChildren();
  elements.noteAttachmentPreview.hidden = true;
  elements.noteAttachmentCount.textContent = 'Bu kayda henüz fotoğraf eklenmedi.';
}

function renderNotePhotoDraft(record = null) {
  for (const url of pendingNotePhotoPreviewUrls) URL.revokeObjectURL(url);
  pendingNotePhotoPreviewUrls = [];
  elements.noteAttachmentPreview.replaceChildren();
  const savedImages = (record && Array.isArray(record.attachments) ? record.attachments : []).filter(item => item.kind === 'image');
  const savedAudio = (record && Array.isArray(record.attachments) ? record.attachments : []).filter(item => item.kind === 'audio');
  const totalImages = savedImages.length + pendingNotePhotoAttachments.length;
  elements.noteAttachmentCount.textContent = `${savedImages.length} kayıtlı fotoğraf${savedAudio.length ? ` · ${savedAudio.length} ses kaydı` : ''}${pendingNotePhotoAttachments.length ? ` · ${pendingNotePhotoAttachments.length} yeni fotoğraf (kaydetmen gerekiyor)` : ''}`;
  elements.noteAttachmentPreview.hidden = totalImages === 0;
  for (const attachment of [...savedImages, ...pendingNotePhotoAttachments]) {
    const url = URL.createObjectURL(attachment.blob);
    pendingNotePhotoPreviewUrls.push(url);
    const item = document.createElement('div');
    item.className = 'note-attachment-thumb';
    const image = document.createElement('img');
    image.src = url;
    image.alt = attachment.name || 'Fotoğraf eki';
    const label = document.createElement('span');
    label.textContent = attachment.name || 'Fotoğraf';
    item.append(image, label);
    elements.noteAttachmentPreview.append(item);
  }
}

function openEditor(record = null, forcedCategory = null) {
  clearNotePhotoDraft();
  editingId = record ? record.id : null;
  elements.form.reset();
  elements.modalTitle.textContent = record ? 'Kaydını düzenle.' : 'Aklında kalmasın.';
  elements.title.value = record ? record.title : '';
  elements.category.value = 'note';
  elements.body.value = record ? record.body : '';
  elements.noteTags.value = '';
  const drawer = document.getElementById('editorFileDrawer');
  if (drawer) drawer.hidden = true;
  const toggle = document.getElementById('editorFilesToggle');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  renderEditorFiles();
  elements.noteReminder.value = record && record.reminderAt ? toDateTimeLocal(record.reminderAt) : '';
  renderNotePhotoDraft(record);
  elements.modal.hidden = false;
  document.body.classList.add('modal-open');
  window.setTimeout(() => elements.body.focus(), 40);
}

function closeEditor() {
  elements.modal.hidden = true;
  if (elements.photoSourceModal.hidden && elements.photoModal.hidden) document.body.classList.remove('modal-open');
  editingId = null;
  clearNotePhotoDraft();
}

function openPasswordEditor(record = null) {
  activePasswordRecordId = record ? record.id : null;
  elements.passwordForm.reset();
  elements.passwordTitle.value = record ? record.title : '';
  elements.passwordUsername.value = record && record.credential ? record.credential.username || '' : '';
  elements.passwordValue.value = record && record.credential ? record.credential.password || '' : '';
  elements.passwordWebsite.value = record && record.credential ? record.credential.website || '' : '';
  elements.passwordNotes.value = record ? record.body || '' : '';
  elements.passwordTags.value = tagsToInput(record ? record.tags : []);
  elements.passwordModal.querySelector('h2').textContent = record ? 'Parola kaydını düzenle.' : 'Giriş bilgilerini sakla.';
  elements.togglePasswordValue.textContent = 'Göster';
  elements.passwordValue.type = 'password';
  elements.passwordModal.hidden = false;
  document.body.classList.add('modal-open');
  window.setTimeout(() => elements.passwordTitle.focus(), 40);
}

function closePasswordEditor() {
  elements.passwordModal.hidden = true;
  document.body.classList.remove('modal-open');
  elements.passwordForm.reset();
  elements.passwordValue.type = 'password';
  elements.togglePasswordValue.textContent = 'Göster';
  activePasswordRecordId = null;
}

function openPasswordDetails(record) {
  activePasswordRecordId = record.id;
  const credential = record.credential || {};
  elements.passwordDetailTitle.textContent = record.title;
  elements.passwordDetailUsername.value = credential.username || '';
  elements.passwordDetailValue.value = credential.password || '';
  elements.passwordDetailValue.type = 'password';
  elements.revealPasswordDetail.textContent = 'Göster';
  const website = safeWebsiteUrl(credential.website || '');
  elements.passwordDetailWebsiteWrap.hidden = !website;
  if (website) {
    elements.passwordDetailWebsite.href = website;
    elements.passwordDetailWebsite.textContent = credential.website;
  } else {
    elements.passwordDetailWebsite.removeAttribute('href');
    elements.passwordDetailWebsite.textContent = '';
  }
  elements.passwordDetailNotesWrap.hidden = !record.body;
  elements.passwordDetailNotes.textContent = record.body || '';
  elements.passwordDetailModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closePasswordDetails() {
  elements.passwordDetailModal.hidden = true;
  document.body.classList.remove('modal-open');
  elements.passwordDetailUsername.value = '';
  elements.passwordDetailValue.value = '';
  elements.passwordDetailNotes.textContent = '';
  elements.passwordDetailWebsite.removeAttribute('href');
  elements.passwordDetailWebsite.textContent = '';
  activePasswordRecordId = null;
}

function safeWebsiteUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch (_) {
    return '';
  }
}

async function copySensitiveValue(value, label) {
  if (!value) { showToast(`${label} boş.`); return; }
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard API kullanılamıyor.');
    await navigator.clipboard.writeText(value);
    showToast(`${label} panoya kopyalandı.`);
  } catch (_) {
    showToast('Panoya kopyalama izni yok. HTTPS bağlantısını ve tarayıcı izinlerini kontrol et.');
  }
}

async function savePasswordRecord(event) {
  event.preventDefault();
  const title = elements.passwordTitle.value.trim();
  const password = elements.passwordValue.value;
  if (!title || !password) { showToast('Hizmet adı ve parola gerekli.'); return; }
  const now = Date.now();
  const existing = activePasswordRecordId ? records.find(item => item.id === activePasswordRecordId) : null;
  const credential = {
    username: elements.passwordUsername.value.trim(),
    password,
    website: elements.passwordWebsite.value.trim()
  };
  const record = {
    id: activePasswordRecordId || makeId(),
    title,
    body: elements.passwordNotes.value.trim(),
    category: 'password',
    credential,
    tags: parseTagsInput(elements.passwordTags.value),
    favorite: existing ? Boolean(existing.favorite) : false,
    deletedAt: existing ? (existing.deletedAt || null) : null,
    archivedAt: existing ? (existing.archivedAt || null) : null,
    reminderAt: existing ? (existing.reminderAt || null) : null,
    reminderNotifiedAt: existing ? (existing.reminderNotifiedAt || null) : null,
    attachments: existing && Array.isArray(existing.attachments) ? existing.attachments : [],
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now
  };
  elements.savePassword.disabled = true;
  try {
    await persistEncryptedRecord(record);
    upsertRecordInMemory(record);
    closePasswordEditor();
    showToast(existing ? 'Parola kaydı güncellendi.' : 'Parola kaydı şifreli olarak eklendi.');
  } catch (error) {
    showToast(storageErrorMessage(error));
  } finally {
    elements.savePassword.disabled = false;
  }
}

function openBackupExport() {
  elements.backupExportForm.reset();
  elements.backupExportError.textContent = '';
  elements.backupExportModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeBackupExport() {
  elements.backupExportModal.hidden = true;
  elements.backupExportForm.reset();
  elements.backupExportError.textContent = '';
  document.body.classList.remove('modal-open');
}

function encodeBinaryForBackup(value) {
  if (value instanceof ArrayBuffer) return bytesToBase64(new Uint8Array(value));
  if (ArrayBuffer.isView(value)) return bytesToBase64(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
  throw new Error('Yedekte beklenmeyen bir veri biçimi bulundu.');
}

function decodeBackupBase64(value, label, minBytes = 1, maxBytes = BACKUP_MAX_BYTES) {
  if (typeof value !== 'string' || !value || value.length > Math.ceil(maxBytes * 4 / 3) + 8 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw new Error(`${label} alanı geçersiz.`);
  }
  const bytes = base64ToBytes(value);
  if (bytes.byteLength < minBytes || bytes.byteLength > maxBytes) throw new Error(`${label} boyutu geçersiz.`);
  return bytes;
}

function encodeRecordForBackup(record) {
  return {
    id: record.id,
    format: record.format,
    metaIv: encodeBinaryForBackup(record.metaIv),
    metaCipher: encodeBinaryForBackup(record.metaCipher),
    attachments: (record.attachments || []).map(item => ({
      id: item.id,
      kind: item.kind,
      name: item.name,
      mimeType: item.mimeType,
      createdAt: item.createdAt,
      iv: encodeBinaryForBackup(item.iv),
      cipher: encodeBinaryForBackup(item.cipher)
    }))
  };
}

function validateRecordEnvelopeShape(record) {
  if (!record || typeof record.id !== 'string' || record.id.length < 1 || record.id.length > 160 || record.format !== VAULT_FORMAT || !Array.isArray(record.attachments)) {
    throw new Error('Yedekte geçersiz bir kayıt bulundu.');
  }
  if (record.attachments.length > BACKUP_MAX_ATTACHMENTS_PER_RECORD) throw new Error('Bir kayıtta izin verilenden fazla ek var.');
  const decoded = {
    id: record.id,
    format: record.format,
    metaIv: decodeBackupBase64(record.metaIv, 'Kayıt başlığı IV', 12, 12),
    metaCipher: decodeBackupBase64(record.metaCipher, 'Kayıt başlığı', 16, BACKUP_MAX_METADATA_BYTES),
    attachments: []
  };
  const attachmentIds = new Set();
  for (const item of record.attachments) {
    if (!item || typeof item.id !== 'string' || item.id.length < 1 || item.id.length > 160 || !['image', 'audio'].includes(item.kind)) {
      throw new Error('Yedekte geçersiz bir medya eki bulundu.');
    }
    if (attachmentIds.has(item.id)) throw new Error('Yedekte yinelenen medya eki kimliği bulundu.');
    attachmentIds.add(item.id);
    const name = String(item.name || '');
    const mimeType = String(item.mimeType || 'application/octet-stream');
    if (name.length > 512 || mimeType.length > 160) throw new Error('Yedekte medya bilgisi beklenenden uzun.');
    const createdAt = Number(item.createdAt);
    if (!Number.isFinite(createdAt) || createdAt < 0) throw new Error('Yedekte medya tarihi geçersiz.');
    decoded.attachments.push({
      id: item.id,
      kind: item.kind,
      name,
      mimeType,
      createdAt,
      iv: decodeBackupBase64(item.iv, 'Medya IV', 12, 12),
      cipher: decodeBackupBase64(item.cipher, 'Şifreli medya', 16, BACKUP_MAX_BYTES)
    });
  }
  return decoded;
}

function validateVaultConfigForBackup(config) {
  if (!config || config.key !== 'vaultConfig' || config.version !== 1 || config.kdf !== 'PBKDF2-SHA-256' || !Number.isInteger(config.iterations) || config.iterations < 100000 || config.iterations > 1000000) {
    throw new Error('Yedekte kasa anahtarı bulunamadı veya şifreleme ayarları geçersiz.');
  }
  const salt = decodeBackupBase64(config.salt, 'Kasa tuzu', 16, 16);
  const wrapIv = decodeBackupBase64(config.wrapIv, 'Kasa anahtarı IV', 12, 12);
  const wrappedKey = decodeBackupBase64(config.wrappedKey, 'Şifreli kasa anahtarı', 48, 256);
  if (salt.length !== 16 || wrapIv.length !== 12 || wrappedKey.length < 48) throw new Error('Yedekteki kasa anahtarı verisi bozuk.');
  return { ...config, biometric: null, autoBiometricUnlock: false };
}

async function verifyEncryptedRecordCollection(encryptedRecords, key) {
  if (!Array.isArray(encryptedRecords) || encryptedRecords.length > BACKUP_MAX_RECORDS) throw new Error('Kayıt listesi geçersiz veya sınırı aşıyor.');
  const recordIds = new Set();
  let attachmentCount = 0;
  for (const envelope of encryptedRecords) {
    if (!envelope || typeof envelope.id !== 'string' || recordIds.has(envelope.id)) throw new Error('Yedekte yinelenen veya geçersiz kayıt kimliği bulundu.');
    recordIds.add(envelope.id);
    if (envelope.format !== VAULT_FORMAT || !Array.isArray(envelope.attachments) || envelope.attachments.length > BACKUP_MAX_ATTACHMENTS_PER_RECORD) throw new Error('Yedekte geçersiz bir kayıt zarfı bulundu.');

    const metadataBytes = await decryptBytes({ iv: envelope.metaIv, cipher: envelope.metaCipher }, key, `bedrock-record:${envelope.id}:meta`);
    if (metadataBytes.byteLength > BACKUP_MAX_METADATA_BYTES) throw new Error('Bir kaydın şifreli metaverisi izin verilen boyutu aşıyor.');
    let metadata;
    try { metadata = JSON.parse(decoder.decode(metadataBytes)); }
    catch (_) { throw new Error('Bir kaydın metaverisi okunamıyor.'); }
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || !['note', 'object', 'password'].includes(metadata.category)) {
      throw new Error('Yedekte geçersiz kayıt bilgisi bulundu.');
    }
    if (typeof metadata.title !== 'string' || metadata.title.length > 1000 || typeof metadata.body !== 'string' || metadata.body.length > 100000) {
      throw new Error('Yedekte başlık veya açıklama alanı geçersiz.');
    }
    if (!Number.isFinite(metadata.createdAt) || !Number.isFinite(metadata.updatedAt)) throw new Error('Yedekte kayıt tarihi geçersiz.');
    if (metadata.category === 'password') {
      if (!metadata.credential || typeof metadata.credential !== 'object' || typeof metadata.credential.password !== 'string') throw new Error('Yedekte parola kaydı eksik veya bozuk.');
    }

    const attachmentIds = new Set();
    for (const item of envelope.attachments) {
      if (!item || typeof item.id !== 'string' || attachmentIds.has(item.id) || !['image', 'audio'].includes(item.kind)) throw new Error('Yedekte geçersiz medya eki bulundu.');
      attachmentIds.add(item.id);
      // Decrypt one attachment at a time. This authenticates each AES-GCM payload
      // without retaining all expanded media in memory on low-memory phones.
      const bytes = await decryptBytes({ iv: item.iv, cipher: item.cipher }, key, `bedrock-record:${envelope.id}:attachment:${item.id}`);
      if (!bytes || bytes.byteLength === 0) throw new Error('Yedekte boş veya bozuk medya eki bulundu.');
      attachmentCount += 1;
    }
  }
  return { recordCount: encryptedRecords.length, attachmentCount };
}

function backupV2AdditionalData(envelope) {
  return `${BACKUP_FORMAT_V2}|${envelope.version}|${envelope.kdf}|${envelope.iterations}`;
}

async function createEncryptedBackup(password) {
  // Re-unwrap and verify the vault before export. This also detects a corrupt local record
  // instead of producing a backup that cannot later be restored.
  const exportKey = await unwrapVaultKey(vaultConfig, password);
  const storedRecords = await storeRequest('readonly', store => store.getAll());
  await verifyEncryptedRecordCollection(storedRecords, exportKey);
  const payload = {
    format: BACKUP_PAYLOAD_FORMAT_V2,
    version: 2,
    appVersion: APP_VERSION,
    exportedAt: Date.now(),
    vaultConfig: { ...vaultConfig, biometric: null, autoBiometricUnlock: false },
    records: storedRecords.map(encodeRecordForBackup)
  };
  const plaintext = encoder.encode(JSON.stringify(payload));
  const salt = randomBytes(16);
  const envelope = {
    format: BACKUP_FORMAT_V2,
    version: 2,
    kdf: 'PBKDF2-SHA-256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt)
  };
  const wrappingKey = await derivePasswordWrappingKey(password, salt, envelope.iterations);
  const encrypted = await encryptBytes(plaintext, wrappingKey, backupV2AdditionalData(envelope));
  envelope.iv = bytesToBase64(encrypted.iv);
  envelope.cipher = bytesToBase64(new Uint8Array(encrypted.cipher));
  const json = JSON.stringify(envelope);
  const blob = new Blob([json], { type: 'application/vnd.bedrock.backup+json' });
  if (blob.size > BACKUP_MAX_BYTES) throw new Error('Yedek dosyası 100 MB sınırını aşıyor. Büyük medya kayıtlarını azaltıp tekrar dene.');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bedrock-backup-${new Date().toISOString().slice(0, 10)}.bedrock`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

async function handleBackupExport(event) {
  event.preventDefault();
  const password = elements.backupExportPassword.value;
  if (!password) { elements.backupExportError.textContent = 'Ana parolanı gir.'; return; }
  elements.confirmBackupExport.disabled = true;
  elements.backupExportError.textContent = '';
  try {
    await createEncryptedBackup(password);
    closeBackupExport();
    showToast('Şifreli Bedrock yedeği oluşturuldu. Dosyayı güvenli bir yerde sakla.');
  } catch (error) {
    console.error('Bedrock yedek oluşturma:', error);
    elements.backupExportError.textContent = error.name === 'OperationError'
      ? 'Ana parola yanlış veya yerel kayıtlardan biri doğrulanamadı.'
      : (error.message || 'Yedek oluşturulamadı.');
  } finally {
    elements.confirmBackupExport.disabled = false;
  }
}

function chooseBackupFile(mode = 'restore') {
  backupImportMode = mode === 'verify' ? 'verify' : 'restore';
  elements.backupFileInput.value = '';
  elements.backupFileInput.click();
}

function handleBackupFileChosen(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (file.size > BACKUP_MAX_BYTES) {
    showToast('Yedek dosyası 100 MB sınırını aşıyor.');
    return;
  }
  if (file.size < 40) {
    showToast('Bu dosya geçerli bir Bedrock yedeği gibi görünmüyor.');
    return;
  }
  pendingBackupFile = file;
  elements.backupImportFileName.textContent = file.name;
  elements.backupImportPassword.value = '';
  elements.backupImportError.textContent = '';
  const verifyOnly = backupImportMode === 'verify';
  elements.settingsModal.hidden = true;
  document.getElementById('backupImportTitle').textContent = verifyOnly ? 'Yedeği doğrula.' : 'Yedeği aç.';
  document.getElementById('backupImportIntro').textContent = verifyOnly
    ? 'Dosyanın parolasını, kayıtlarını ve ekli medyalarını kontrol edeceğiz. Bu işlem mevcut kasayı değiştirmez.'
    : 'Yedek açılmadan önce tüm kayıtlar ve ekler doğrulanır. Geri yükleme mevcut kasanın yerine geçer.';
  elements.confirmBackupImport.textContent = verifyOnly ? 'Yedeği doğrula' : 'Yedeği geri yükle';
  elements.backupImportModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeBackupImport() {
  elements.backupImportModal.hidden = true;
  elements.backupImportForm.reset();
  elements.backupImportError.textContent = '';
  pendingBackupFile = null;
  backupImportMode = 'restore';
  document.getElementById('backupImportTitle').textContent = 'Yedeği aç.';
  document.getElementById('backupImportIntro').textContent = 'Yedek açılmadan önce tüm kayıtlar ve ekler doğrulanır. Geri yükleme mevcut kasanın yerine geçer.';
  elements.confirmBackupImport.textContent = 'Yedeği geri yükle';
  document.body.classList.remove('modal-open');
}

async function readAndVerifyBackup(file, password) {
  if (!(file instanceof Blob) || file.size < 40 || file.size > BACKUP_MAX_BYTES) throw new Error('Yedek dosyası boyutu geçersiz.');
  let envelope;
  try { envelope = JSON.parse(await file.text()); }
  catch (_) { throw new Error('Dosya JSON biçiminde okunamadı.'); }
  const isV1 = envelope && envelope.format === BACKUP_FORMAT && envelope.version === 1;
  const isV2 = envelope && envelope.format === BACKUP_FORMAT_V2 && envelope.version === 2;
  if ((!isV1 && !isV2) || envelope.kdf !== 'PBKDF2-SHA-256') throw new Error('Bu dosya desteklenen bir Bedrock yedeği değil.');
  const iterations = Number(envelope.iterations);
  if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000) throw new Error('Yedek şifreleme ayarları geçersiz.');
  const salt = decodeBackupBase64(envelope.salt, 'Yedek tuzu', 16, 16);
  const iv = decodeBackupBase64(envelope.iv, 'Yedek IV', 12, 12);
  const cipher = decodeBackupBase64(envelope.cipher, 'Şifreli yedek içeriği', 16, BACKUP_MAX_BYTES);
  const key = await derivePasswordWrappingKey(password, salt, iterations);
  const aad = isV2 ? backupV2AdditionalData(envelope) : BACKUP_FORMAT;
  const plaintext = await decryptBytes({ iv, cipher }, key, aad);
  if (plaintext.byteLength > BACKUP_MAX_BYTES) throw new Error('Yedek içeriği izin verilen boyutu aşıyor.');
  let payload;
  try { payload = JSON.parse(decoder.decode(plaintext)); }
  catch (_) { throw new Error('Şifreli yedek içeriği okunamadı.'); }
  const expectedPayloadFormat = isV2 ? BACKUP_PAYLOAD_FORMAT_V2 : BACKUP_PAYLOAD_FORMAT;
  const expectedPayloadVersion = isV2 ? 2 : 1;
  if (!payload || payload.format !== expectedPayloadFormat || payload.version !== expectedPayloadVersion || !Array.isArray(payload.records) || payload.records.length > BACKUP_MAX_RECORDS) {
    throw new Error('Yedek içeriği geçersiz veya desteklenmiyor.');
  }
  const restoredConfig = validateVaultConfigForBackup(payload.vaultConfig);
  const importedVaultKey = await unwrapVaultKey(restoredConfig, password);
  const decodedRecords = payload.records.map(validateRecordEnvelopeShape);
  const integrity = await verifyEncryptedRecordCollection(decodedRecords, importedVaultKey);
  return {
    formatVersion: expectedPayloadVersion,
    exportedAt: Number(payload.exportedAt) || null,
    decodedRecords,
    restoredConfig,
    integrity
  };
}

async function restoreEncryptedBackup(event) {
  event.preventDefault();
  if (!pendingBackupFile) { elements.backupImportError.textContent = 'Önce yedek dosyası seç.'; return; }
  const password = elements.backupImportPassword.value;
  if (!password) { elements.backupImportError.textContent = 'Yedek parolasını gir.'; return; }
  elements.confirmBackupImport.disabled = true;
  elements.backupImportError.textContent = '';
  try {
    // Fully authenticate the outer backup, the wrapped vault key, every record,
    // and every media attachment before touching the existing IndexedDB data.
    const verified = await readAndVerifyBackup(pendingBackupFile, password);
    if (backupImportMode === 'verify') {
      closeBackupImport();
      showToast(`Yedek doğrulandı: ${verified.integrity.recordCount} kayıt, ${verified.integrity.attachmentCount} medya eki. Mevcut kasan değiştirilmedi.`);
      return;
    }
    const dateText = verified.exportedAt ? new Date(verified.exportedAt).toLocaleString('tr-TR') : 'tarih bilgisi yok';
    const warning = `${verified.integrity.recordCount} kayıt ve ${verified.integrity.attachmentCount} medya eki içeren yedek doğrulandı (${dateText}).\n\nBu cihazdaki mevcut Bedrock kayıtlarının tamamı silinip yedekteki kayıtlarla değiştirilecek. Devam etmeden önce mevcut kasanın yedeğini aldığından emin ol.\n\nGeri yüklemeye devam edilsin mi?`;
    if (!window.confirm(warning)) return;
    await new Promise((resolve, reject) => {
      const tx = database.transaction([STORE_NAME, META_STORE], 'readwrite');
      const recordStore = tx.objectStore(STORE_NAME);
      const metaStore = tx.objectStore(META_STORE);
      recordStore.clear();
      for (const record of verified.decodedRecords) recordStore.put(record);
      metaStore.clear();
      metaStore.put(verified.restoredConfig);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Yedek geri yüklenemedi.'));
      tx.onabort = () => reject(tx.error || new Error('Yedek geri yüklenemedi.'));
    });
    vaultConfig = verified.restoredConfig;
    clearUnlockedSession();
    setGateMode('unlock');
    closeBackupImport();
    showToast('Yedek geri yüklendi. Kasanı yedeğin ana parolasıyla aç. Biyometrik giriş güvenlik için sıfırlandı.');
  } catch (error) {
    console.error('Bedrock yedek doğrulama/geri yükleme:', error);
    elements.backupImportError.textContent = error.name === 'OperationError'
      ? 'Parola yanlış veya yedek dosyasının şifreli verisi bozuk.'
      : (error.message || 'Yedek doğrulanamadı. Mevcut kasa değiştirilmedi.');
  } finally {
    elements.confirmBackupImport.disabled = false;
  }
}

function openSecurityAudit() {
  elements.securityAuditResults.replaceChildren();
  securityAuditReturnToSettings = !elements.settingsModal.hidden;
  if (securityAuditReturnToSettings) elements.settingsModal.hidden = true;
  elements.securityAuditModal.hidden = false;
  document.body.classList.add('modal-open');
  runSecurityAudit();
}

function closeSecurityAudit() {
  elements.securityAuditModal.hidden = true;
  if (securityAuditReturnToSettings) {
    elements.settingsModal.hidden = false;
    securityAuditReturnToSettings = false;
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
}

function appendAuditResult(title, detail, passed, type = 'check') {
  const item = document.createElement('div');
  item.className = `audit-item ${passed ? 'is-pass' : 'is-fail'}`;
  const icon = document.createElement('span');
  icon.className = 'audit-icon';
  icon.textContent = type === 'info' ? 'i' : (passed ? '✓' : '×');
  const copy = document.createElement('div');
  copy.className = 'audit-copy';
  const heading = document.createElement('strong');
  heading.textContent = title;
  const description = document.createElement('p');
  description.textContent = detail;
  copy.append(heading, description);
  item.append(icon, copy);
  elements.securityAuditResults.append(item);
}

async function runSecurityAudit() {
  if (securityAuditRunning) return;
  securityAuditRunning = true;
  elements.runSecurityAudit.disabled = true;
  let passed = 0;
  let failed = 0;
  const recordResult = (title, detail, ok, type = 'check') => {
    appendAuditResult(title, detail, ok, type);
    if (type !== 'info') ok ? passed += 1 : failed += 1;
  };
  try {
    const secure = window.isSecureContext && Boolean(crypto && crypto.subtle);
    recordResult('Güvenli bağlantı ve Web Crypto', secure ? 'HTTPS/güvenli bağlam ve Web Crypto API kullanılabilir.' : 'Güvenli bağlam veya Web Crypto API bulunamadı.', secure);

    try {
      const testRawKey = randomBytes(32);
      const testKey = await crypto.subtle.importKey('raw', testRawKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
      const sample = encoder.encode('Bedrock security self-test');
      const encrypted = await encryptBytes(sample, testKey, 'bedrock-self-test-v1');
      const decrypted = await decryptBytes(encrypted, testKey, 'bedrock-self-test-v1');
      const roundTripOk = decoder.decode(decrypted) === 'Bedrock security self-test';
      recordResult('AES-GCM şifrele/aç testi', 'Geçici test verisi başarıyla şifrelendi ve çözüldü.', roundTripOk);
      const tamperedCipher = new Uint8Array(encrypted.cipher.slice(0));
      tamperedCipher[0] ^= 1;
      let tamperRejected = false;
      try { await decryptBytes({ iv: encrypted.iv, cipher: tamperedCipher }, testKey, 'bedrock-self-test-v1'); }
      catch (_) { tamperRejected = true; }
      recordResult('Değiştirilmiş veri reddi', tamperRejected ? 'AES-GCM değiştirilmiş şifreli veriyi reddetti.' : 'Değiştirilmiş veri reddedilmedi.', tamperRejected);
      testRawKey.fill(0);
    } catch (error) {
      recordResult('AES-GCM kontrolleri', error.message || 'Kriptografi testi çalıştırılamadı.', false);
    }

    try {
      const config = await getMeta('vaultConfig');
      const configOk = Boolean(config && config.key === 'vaultConfig' && config.kdf === 'PBKDF2-SHA-256' && vaultCryptoKey);
      recordResult('Kasa anahtarı ayarları', configOk ? `Kasa ayarı mevcut; PBKDF2 yineleme sayısı: ${config.iterations}.` : 'Kasa ayarı eksik veya oturum anahtarı yok.', configOk);
    } catch (error) {
      recordResult('Kasa anahtarı ayarları', error.message || 'Kasa ayarı okunamadı.', false);
    }

    try {
      const stored = await storeRequest('readonly', store => store.getAll());
      const integrity = await verifyEncryptedRecordCollection(stored, vaultCryptoKey);
      recordResult('Yerel kayıt bütünlüğü', `${integrity.recordCount} kayıt ve ${integrity.attachmentCount} medya eki başarıyla doğrulandı.`, true);
    } catch (error) {
      recordResult('Yerel kayıt bütünlüğü', error.message || 'Bir veya daha fazla kayıt doğrulanamadı.', false);
    }

    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = Number(estimate.usage) || 0;
        const quota = Number(estimate.quota) || 0;
        const detail = quota ? `Yaklaşık ${formatBytes(used)} kullanılıyor; tahmini sınır ${formatBytes(quota)}.` : `Yaklaşık ${formatBytes(used)} kullanılıyor.`;
        recordResult('Cihaz depolama durumu', detail, true, 'info');
      } catch (_) {
        recordResult('Cihaz depolama durumu', 'Tarayıcı depolama tahmini vermedi.', true, 'info');
      }
    } else {
      recordResult('Cihaz depolama durumu', 'Bu tarayıcı depolama tahmini API’sini sunmuyor.', true, 'info');
    }

    const summary = document.createElement('p');
    summary.className = `audit-summary ${failed ? 'has-failures' : 'all-passed'}`;
    summary.textContent = failed ? `${passed} kontrol başarılı, ${failed} kontrol başarısız. Başarısız sonuçları düzeltmeden yedeğe güvenme.` : `${passed} güvenlik kontrolü başarılı. Bu sonuç bağımsız profesyonel güvenlik denetimi değildir.`;
    elements.securityAuditResults.prepend(summary);
  } finally {
    securityAuditRunning = false;
    elements.runSecurityAudit.disabled = false;
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const tier = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, tier)).toFixed(tier ? 1 : 0)} ${units[tier]}`;
}

async function optimizePhotoBlob(file) {
  if (!window.createImageBitmap || !document.createElement('canvas').toBlob) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_IMAGE_EDGE / longest);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) { bitmap.close(); return file; }
    // JPEG has no transparency; use a neutral background for transparent source images.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const optimized = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', IMAGE_JPEG_QUALITY));
    canvas.width = 1;
    canvas.height = 1;
    return optimized && optimized.size < file.size ? optimized : file;
  } catch (error) {
    console.warn('Fotoğraf sıkıştırılamadı, özgün dosya kullanılacak:', error);
    return file;
  }
}

function extractHashtags(text) {
  const matches = [...String(text || '').matchAll(/(?:^|\s)#([\p{L}\p{N}_-]{1,32})/gu)];
  return [...new Set(matches.map(match => match[1].toLocaleLowerCase('tr-TR')))].slice(0, 12);
}

function renderEditorFiles() {
  const list = document.getElementById('editorFileList');
  if (!list) return;
  const query = (document.getElementById('editorFileSearch')?.value || '').trim().toLocaleLowerCase('tr-TR');
  const filter = document.querySelector('#editorFileFilters [data-file-filter].active')?.dataset.fileFilter || 'all';
  let items = records.filter(record => !record.deletedAt && record.category !== 'password');
  if (filter === 'tagged') items = items.filter(record => Array.isArray(record.tags) && record.tags.length);
  if (filter === 'recent') items = items.filter(record => record.id !== editingId).sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 20);
  if (query) items = items.filter(record => `${record.title} ${record.body} ${(record.tags || []).join(' ')}`.toLocaleLowerCase('tr-TR').includes(query));
  items.sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  list.replaceChildren();
  if (!items.length) { const empty = document.createElement('p'); empty.className = 'editor-file-empty'; empty.textContent = 'Eşleşen not bulunamadı.'; list.append(empty); return; }
  for (const record of items) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'editor-file-item';
    const title = document.createElement('strong'); title.textContent = record.title || 'Başlıksız not';
    const preview = document.createElement('span'); preview.textContent = (record.body || '').slice(0, 90).replace(/\s+/g, ' ');
    button.append(title, preview);
    button.addEventListener('click', () => { closeEditor(); openEditor(record); });
    list.append(button);
  }
}

async function saveRecord(event) {
  event.preventDefault();
  if (notePhotoProcessing) { showToast('Fotoğraflar hazırlanıyor. Kaydetmeden önce tamamlanmasını bekle.'); return; }
  const body = elements.body.value.trim();
  const title = elements.title.value.trim() || body.split('\n').map(line => line.trim()).find(Boolean)?.slice(0, 80) || `Not ${new Date().toLocaleDateString('tr-TR')}`;
  elements.title.value = title;
  const category = 'note';
  if (!title) { elements.body.focus(); return; }

  const now = Date.now();
  const existing = editingId ? records.find(item => item.id === editingId) : null;
  const reminderAt = parseReminderInput(elements.noteReminder.value);
  if (elements.noteReminder.value && !reminderAt) {
    showToast('Hatırlatma tarihi okunamadı.');
    return;
  }
  if (reminderAt && reminderAt <= now && !(existing && existing.reminderAt === reminderAt)) {
    showToast('Hatırlatma zamanı gelecekte olmalı.');
    return;
  }

  elements.saveButton.disabled = true;
  const record = {
    id: editingId || makeId(),
    title,
    body,
    category: 'note',
    tags: extractHashtags(`${title}\n${body}`),
    favorite: existing ? Boolean(existing.favorite) : false,
    deletedAt: existing ? (existing.deletedAt || null) : null,
    archivedAt: existing ? (existing.archivedAt || null) : null,
    reminderAt,
    reminderNotifiedAt: existing && existing.reminderAt === reminderAt ? (existing.reminderNotifiedAt || null) : null,
    attachments: [...(existing && Array.isArray(existing.attachments) ? existing.attachments : []), ...pendingNotePhotoAttachments],
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now
  };

  try {
    await persistEncryptedRecord(record);
    upsertRecordInMemory(record);
    closeEditor();
    showToast(existing ? 'Kayıt güncellendi.' : 'Kayıt Bedrock’a eklendi.');
    if (reminderAt && 'Notification' in window && Notification.permission === 'default') {
      showToast('Hatırlatma kaydedildi. Bildirim iznini Ayarlar’dan açabilirsin.');
    }
  } catch (error) {
    showToast(storageErrorMessage(error));
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function saveMediaRecord({ title, body, category, attachment, tags = [] }) {
  const now = Date.now();
  const record = {
    id: makeId(), title: title.trim(), body: body.trim(),
    category: category === 'object' ? 'object' : 'note',
    tags: normalizeTags(tags), favorite: false, deletedAt: null, archivedAt: null,
    reminderAt: null, reminderNotifiedAt: null,
    attachments: [attachment], createdAt: now, updatedAt: now
  };
  const encryptedRecord = await encryptRecord(record, vaultCryptoKey);
  await storeRequest('readwrite', store => store.put(encryptedRecord));
  upsertRecordInMemory(record);
}

function storageErrorMessage(error) {
  if (error && (error.name === 'QuotaExceededError' || error.name === 'UnknownError')) {
    return 'Telefonun tarayıcı depolama alanı dolmuş olabilir. Biraz yer açıp tekrar dene.';
  }
  return error && error.message ? error.message : 'Kayıt kaydedilemedi.';
}

async function toggleFavorite(record) {
  try {
    const updated = { ...record, favorite: !record.favorite, updatedAt: Date.now() };
    await persistEncryptedRecord(updated);
    upsertRecordInMemory(updated);
    showToast(updated.favorite ? 'Favorilere eklendi.' : 'Favorilerden çıkarıldı.');
  } catch (error) {
    showToast(storageErrorMessage(error));
  }
}

async function deleteRecord(record) {
  const confirmed = window.confirm(`“${record.title}” kaydı çöp kutusuna taşınsın mı? Kayıt ve ekleri geri yükleyebilmen için saklanacak.`);
  if (!confirmed) return;
  try {
    const now = Date.now();
    const updated = { ...record, deletedAt: now, updatedAt: now };
    await persistEncryptedRecord(updated);
    upsertRecordInMemory(updated);
    showToast('Kayıt çöp kutusuna taşındı.');
  } catch (error) {
    showToast(storageErrorMessage(error));
  }
}

async function archiveRecord(record) {
  try {
    const updated = { ...record, archivedAt: Date.now(), updatedAt: Date.now() };
    await persistEncryptedRecord(updated);
    upsertRecordInMemory(updated);
    showToast('Kayıt arşivlendi.');
  } catch (error) {
    showToast(storageErrorMessage(error));
  }
}

async function unarchiveRecord(record) {
  try {
    const updated = { ...record, archivedAt: null, updatedAt: Date.now() };
    await persistEncryptedRecord(updated);
    upsertRecordInMemory(updated);
    showToast('Kayıt arşivden çıkarıldı.');
  } catch (error) {
    showToast(storageErrorMessage(error));
  }
}

async function restoreRecord(record) {
  try {
    const updated = { ...record, deletedAt: null, updatedAt: Date.now() };
    await persistEncryptedRecord(updated);
    upsertRecordInMemory(updated);
    showToast('Kayıt geri yüklendi.');
  } catch (error) {
    showToast(storageErrorMessage(error));
  }
}

async function permanentlyDeleteRecord(record) {
  const confirmed = window.confirm(`“${record.title}” kaydı ve ekleri kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`);
  if (!confirmed) return;
  try {
    await storeRequest('readwrite', store => store.delete(record.id));
    removeRecordsInMemory([record.id]);
    showToast('Kayıt kalıcı olarak silindi.');
  } catch (error) {
    showToast(storageErrorMessage(error));
  }
}

async function emptyTrash() {
  const trashed = records.filter(record => Boolean(record.deletedAt));
  if (!trashed.length) return;
  const confirmed = window.confirm(`Çöp kutusundaki ${trashed.length} kayıt ve tüm ekleri kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`);
  if (!confirmed) return;
  try {
    await storeRequest('readwrite', store => {
      for (const record of trashed) store.delete(record.id);
      return null;
    });
    removeRecordsInMemory(trashed.map(record => record.id));
    showToast('Çöp kutusu boşaltıldı.');
  } catch (error) {
    showToast(storageErrorMessage(error));
  }
}

function resetAudioModal() {
  stopRecordingTimer();
  stopMicrophoneTracks();
  mediaRecorder = null;
  audioChunks = [];
  recordedAudioBlob = null;
  if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
  recordedAudioUrl = null;
  elements.audioPreview.removeAttribute('src');
  elements.audioPreview.load();
  elements.audioPreview.hidden = true;
  elements.audioTitle.value = '';
  elements.audioDescription.value = '';
  elements.audioTags.value = '';
  elements.recordingStatus.textContent = 'Kayda hazır';
  elements.recordingTimer.textContent = '00:00';
  elements.recordingHint.textContent = 'Başlamak için kayıt düğmesine dokun.';
  elements.recordingOrb.classList.remove('is-recording');
  elements.startRecording.disabled = false;
  elements.stopRecording.disabled = true;
  elements.saveAudio.disabled = true;
}

function openAudioModal() {
  resetAudioModal();
  elements.audioModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeAudioModal() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    const recorderToClose = mediaRecorder;
    mediaRecorder = null;
    try { recorderToClose.stop(); } catch (_) { /* recorder may already be stopping */ }
  }
  resetAudioModal();
  elements.audioModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function stopMicrophoneTracks() {
  if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => track.stop());
    microphoneStream = null;
  }
}

function stopRecordingTimer() {
  if (recordingInterval) window.clearInterval(recordingInterval);
  if (recordingLimitTimeout) window.clearTimeout(recordingLimitTimeout);
  recordingInterval = null;
  recordingLimitTimeout = null;
}

function formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function updateRecordingTimer() {
  elements.recordingTimer.textContent = formatDuration(Date.now() - recordingStartedAt);
}

async function startAudioRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    showToast('Bu tarayıcı ses kaydını desteklemiyor. Android Chrome ile HTTPS üzerinden açmayı dene.');
    return;
  }
  elements.startRecording.disabled = true;
  recordedAudioBlob = null;
  if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
  recordedAudioUrl = null;
  elements.audioPreview.removeAttribute('src');
  elements.audioPreview.load();
  elements.audioPreview.hidden = true;
  elements.saveAudio.disabled = true;
  elements.recordingStatus.textContent = 'Mikrofon izni bekleniyor…';
  try {
    microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    const mimeType = typeof MediaRecorder.isTypeSupported === 'function' ? mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) : ''; 
    mediaRecorder = mimeType ? new MediaRecorder(microphoneStream, { mimeType }) : new MediaRecorder(microphoneStream);
    const currentRecorder = mediaRecorder;
    const recorderChunks = [];
    currentRecorder.addEventListener('dataavailable', event => {
      if (event.data && event.data.size > 0) recorderChunks.push(event.data);
    });
    currentRecorder.addEventListener('stop', () => {
      stopMicrophoneTracks();
      stopRecordingTimer();
      // Closing the dialog discards the recorder; ignore its delayed stop event.
      if (mediaRecorder !== currentRecorder) return;
      const actualType = currentRecorder.mimeType || 'audio/webm';
      recordedAudioBlob = new Blob(recorderChunks, { type: actualType });
      if (!recordedAudioBlob.size) {
        elements.recordingStatus.textContent = 'Kayıt alınamadı';
        elements.recordingHint.textContent = 'Tekrar deneyebilirsin.';
        elements.startRecording.disabled = false;
        elements.saveAudio.disabled = true;
        return;
      }
      recordedAudioUrl = URL.createObjectURL(recordedAudioBlob);
      elements.audioPreview.src = recordedAudioUrl;
      elements.audioPreview.hidden = false;
      elements.recordingStatus.textContent = 'Kayıt tamamlandı';
      elements.recordingHint.textContent = 'Dinleyebilir veya Bedrock’a kaydedebilirsin.';
      elements.recordingOrb.classList.remove('is-recording');
      elements.startRecording.disabled = false;
      elements.stopRecording.disabled = true;
      elements.saveAudio.disabled = false;
      if (!elements.audioTitle.value.trim()) {
        elements.audioTitle.value = `Sesli not · ${new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date())}`;
      }
    }, { once: true });
    currentRecorder.addEventListener('error', () => {
      stopMicrophoneTracks();
      stopRecordingTimer();
      if (mediaRecorder !== currentRecorder) return;
      elements.recordingStatus.textContent = 'Kayıt sırasında hata oluştu';
      elements.recordingHint.textContent = 'Tekrar kayıt başlatmayı dene.';
      elements.startRecording.disabled = false;
      elements.stopRecording.disabled = true;
      showToast('Ses kaydı başlatılamadı.');
    });
    mediaRecorder.start(250);
    recordingStartedAt = Date.now();
    elements.recordingStatus.textContent = 'Kayıt yapılıyor';
    elements.recordingHint.textContent = 'Konuşabilirsin. Bitirince kaydı durdur.';
    elements.recordingOrb.classList.add('is-recording');
    elements.startRecording.disabled = true;
    elements.stopRecording.disabled = false;
    elements.saveAudio.disabled = true;
    updateRecordingTimer();
    recordingInterval = window.setInterval(updateRecordingTimer, 500);
    recordingLimitTimeout = window.setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        showToast('Güvenlik ve depolama için 10 dakikalık kayıt sınırına ulaşıldı.');
      }
    }, MAX_AUDIO_MILLISECONDS);
  } catch (error) {
    stopMicrophoneTracks();
    elements.startRecording.disabled = false;
    elements.recordingStatus.textContent = 'Mikrofon açılamadı';
    elements.recordingHint.textContent = 'Tarayıcı ayarlarından Bedrock için mikrofon izni ver.';
    showToast(error && error.name === 'NotAllowedError' ? 'Mikrofon izni verilmedi.' : 'Mikrofona erişilemedi. HTTPS bağlantısını ve cihaz iznini kontrol et.');
  }
}

function stopAudioRecording() {
  if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
  elements.stopRecording.disabled = true;
  elements.recordingStatus.textContent = 'Kayıt tamamlanıyor…';
  mediaRecorder.stop();
}

async function saveAudioRecording() {
  if (!recordedAudioBlob) return;
  const title = elements.audioTitle.value.trim();
  if (!title) {
    elements.audioTitle.focus();
    showToast('Ses kaydına bir başlık yaz.');
    return;
  }
  elements.saveAudio.disabled = true;
  const extension = recordedAudioBlob.type.includes('mp4') ? 'm4a' : 'webm';
  const attachment = {
    id: makeId(), kind: 'audio', name: `${title}.${extension}`,
    mimeType: recordedAudioBlob.type || 'audio/webm', blob: recordedAudioBlob, createdAt: Date.now()
  };
  try {
    await saveMediaRecord({ title, body: elements.audioDescription.value, category: 'note', attachment, tags: parseTagsInput(elements.audioTags.value) });
    closeAudioModal();
    showToast('Ses kaydı Bedrock’a kaydedildi.');
  } catch (error) {
    elements.saveAudio.disabled = false;
    showToast(storageErrorMessage(error));
  }
}

function openPhotoPicker(target = 'new') {
  photoPickerTarget = target;
  elements.photoSourceModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closePhotoSourcePicker() {
  elements.photoSourceModal.hidden = true;
  if (elements.modal.hidden && elements.photoModal.hidden && elements.audioModal.hidden && elements.settingsModal.hidden) {
    document.body.classList.remove('modal-open');
  }
}

// v0.9.1 accidentally referenced this function without defining it. That
// ReferenceError interrupted initEvents(), leaving every listener registered
// after the photo-modal wiring inactive (settings, biometrics, photo inputs,
// and the note form submit handler). Keep cleanup centralized and idempotent.
function closePhotoModal() {
  elements.photoModal.hidden = true;
  if (pendingPhotoUrl) {
    try { URL.revokeObjectURL(pendingPhotoUrl); } catch (_) { /* already released */ }
  }
  pendingPhotoUrl = null;
  pendingPhotoBlob = null;
  if (elements.photoPreview) elements.photoPreview.removeAttribute('src');
  if (elements.photoTitle) elements.photoTitle.value = '';
  if (elements.photoDescription) elements.photoDescription.value = '';
  if (elements.photoTags) elements.photoTags.value = '';
  if (elements.savePhoto) elements.savePhoto.disabled = false;
  if (elements.photoSourceModal.hidden && elements.modal.hidden && elements.audioModal.hidden && elements.settingsModal.hidden) {
    document.body.classList.remove('modal-open');
  }
}

function choosePhotoSource(source) {
  closePhotoSourcePicker();
  const input = source === 'camera' ? elements.photoCameraInput : elements.photoGalleryInput;
  if (source === 'gallery') input.multiple = photoPickerTarget === 'note';
  input.value = '';
  input.click();
}

function validatePhotoFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    showToast('Yalnızca fotoğraf dosyaları eklenebilir.');
    return false;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    showToast('Fotoğraf 18 MB sınırını aşıyor. Daha küçük bir fotoğraf seç.');
    return false;
  }
  return true;
}

async function handlePhotosForNote(files) {
  const validFiles = Array.from(files || []).filter(validatePhotoFile);
  if (!validFiles.length || notePhotoProcessing) return;
  const session = noteEditorSession;
  const maxCount = 250;
  const existingCount = (editingId ? records.find(item => item.id === editingId)?.attachments || [] : []).length;
  if (existingCount + pendingNotePhotoAttachments.length + validFiles.length > maxCount) {
    showToast('Bir kayda en fazla 250 medya eki eklenebilir.');
    return;
  }
  notePhotoProcessing = true;
  elements.addPhotoToNote.disabled = true;
  elements.saveButton.disabled = true;
  try {
    for (const file of validFiles) {
      const optimizedPhoto = await optimizePhotoBlob(file);
      if (session !== noteEditorSession) return;
      const extension = (optimizedPhoto.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      pendingNotePhotoAttachments.push({
        id: makeId(), kind: 'image', name: `Fotoğraf-${new Date().toISOString().slice(0, 10)}.${extension}`,
        mimeType: optimizedPhoto.type || file.type, blob: optimizedPhoto, createdAt: Date.now()
      });
    }
    if (session !== noteEditorSession) return;
    const existing = editingId ? records.find(item => item.id === editingId) : null;
    renderNotePhotoDraft(existing);
    showToast(`${validFiles.length} fotoğraf nota eklendi. Kalıcı olması için Kaydet'e bas.`);
  } catch (error) {
    if (session === noteEditorSession) showToast(storageErrorMessage(error));
  } finally {
    if (session === noteEditorSession) {
      notePhotoProcessing = false;
      elements.addPhotoToNote.disabled = false;
      elements.saveButton.disabled = false;
    }
  }
}

function handlePhotoSelected(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  if (photoPickerTarget === 'note') {
    handlePhotosForNote(files);
    event.target.value = '';
    return;
  }
  const file = files[0];
  event.target.value = '';
  if (!validatePhotoFile(file)) return;
  pendingPhotoBlob = file;
  pendingPhotoUrl = URL.createObjectURL(file);
  elements.photoPreview.src = pendingPhotoUrl;
  elements.photoTitle.value = `Fotoğraf · ${new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date())}`;
  elements.photoModal.hidden = false;
  document.body.classList.add('modal-open');
}

async function savePhotoRecord() {
  if (!pendingPhotoBlob) return;
  const title = elements.photoTitle.value.trim();
  if (!title) {
    elements.photoTitle.focus();
    showToast('Fotoğrafa bir başlık yaz.');
    return;
  }
  elements.savePhoto.disabled = true;
  try {
    const optimizedPhoto = await optimizePhotoBlob(pendingPhotoBlob);
    const extension = (optimizedPhoto.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
    const attachment = {
      id: makeId(), kind: 'image', name: `${title}.${extension}`,
      mimeType: optimizedPhoto.type || pendingPhotoBlob.type, blob: optimizedPhoto, createdAt: Date.now()
    };
    await saveMediaRecord({ title, body: elements.photoDescription.value, category: elements.photoCategory.value, attachment, tags: parseTagsInput(elements.photoTags.value) });
    closePhotoModal();
    showToast('Fotoğraf Bedrock’a kaydedildi.');
  } catch (error) {
    elements.savePhoto.disabled = false;
    showToast(storageErrorMessage(error));
  }
}

function bindGateFormEarly() {
  // Bind the security form before wiring optional UI controls. If any later
  // control fails to initialize, the form must never fall back to a native
  // GET submission (which reloads the page and looks like a vault-creation loop).
  elements.gateForm.addEventListener('submit', async event => {
    event.preventDefault();
    event.stopPropagation();
    if (!database) {
      elements.gateError.textContent = 'Bedrock henüz hazırlanıyor. Birkaç saniye sonra tekrar dene.';
      return;
    }
    const password = elements.gatePassword.value;
    elements.gateError.textContent = '';
    if (gateMode === 'recovery') {
      elements.gateError.textContent = 'Yeni kasa oluşturulamaz. Şifreli yedekten geri yükle veya ilk kullandığın adresi aç.';
      return;
    }
    if (gateMode === 'setup') {
      if (password.length < 12) { elements.gateError.textContent = 'Ana parola en az 12 karakter olmalı.'; return; }
      if (password !== elements.gateConfirm.value) { elements.gateError.textContent = 'Parolalar eşleşmiyor.'; return; }
    } else if (!password) { elements.gateError.textContent = 'Ana parolanı gir.'; return; }
    elements.gateSubmit.disabled = true;
    try {
      if (gateMode === 'setup') await setupVault(password);
      else await unlockWithPassword(password);
    } catch (error) {
      console.error('Bedrock kasa formu:', error);
      elements.gateError.textContent = gateMode === 'setup'
        ? (error.message || 'Kasa oluşturulamadı.')
        : 'Ana parola yanlış veya kayıtlar açılamadı. Kasanın verileri değiştirilmedi.';
    } finally {
      elements.gateSubmit.disabled = false;
    }
  });
}

function initEvents() {
  document.getElementById('newNoteButton').addEventListener('click', () => openEditor());
  const filesToggle = document.getElementById('editorFilesToggle');
  const filesDrawer = document.getElementById('editorFileDrawer');
  const closeFiles = document.getElementById('editorFilesClose');
  const setFilesOpen = open => { if (!filesDrawer || !filesToggle) return; filesDrawer.hidden = !open; filesToggle.setAttribute('aria-expanded', String(open)); if (open) renderEditorFiles(); };
  filesToggle?.addEventListener('click', () => setFilesOpen(filesDrawer.hidden));
  closeFiles?.addEventListener('click', () => setFilesOpen(false));
  document.getElementById('editorSaveIcon')?.addEventListener('click', () => elements.form.requestSubmit());
  document.getElementById('editorFileSearch')?.addEventListener('input', renderEditorFiles);
  document.getElementById('editorFileFilters')?.addEventListener('click', event => {
    const button = event.target.closest('[data-file-filter]'); if (!button) return;
    document.querySelectorAll('#editorFileFilters [data-file-filter]').forEach(item => item.classList.toggle('active', item === button));
    renderEditorFiles();
  });
  document.getElementById('emptyAddButton').addEventListener('click', () => openEditor());
  elements.list.addEventListener('click', event => {
    if (event.target.closest('.record-action, .record-tag, a, audio, button')) return;
    const main = event.target.closest('[data-open-record]');
    if (main) { const record = records.find(item => item.id === main.dataset.openRecord); if (record) openEditor(record); }
  });
  elements.workspacePanel.addEventListener('click', event => {
    const closeButton = event.target.closest('[data-workspace-close]');
    if (closeButton) {
      const paneElement = closeButton.closest('[data-workspace-pane]');
      closeWorkspaceTab(Number(paneElement.dataset.workspacePane), closeButton.dataset.workspaceClose);
      return;
    }
    const tabButton = event.target.closest('[data-workspace-record]');
    if (tabButton) {
      const paneElement = tabButton.closest('[data-workspace-pane]');
      const paneIndex = Number(paneElement.dataset.workspacePane);
      activeWorkspacePane = paneIndex;
      workspacePanes[paneIndex].activeId = tabButton.dataset.workspaceRecord;
      saveWorkspaceState();
      renderWorkspace();
      return;
    }
    const paneElement = event.target.closest('[data-workspace-pane]');
    if (paneElement) {
      activeWorkspacePane = Number(paneElement.dataset.workspacePane);
      elements.workspaceGrid.querySelectorAll('.workspace-pane').forEach((pane, index) => pane.classList.toggle('is-active', index === activeWorkspacePane));
      saveWorkspaceState();
    }
  });
  elements.workspaceSplitButton.addEventListener('click', toggleWorkspaceSplit);
  elements.workspaceCloseAllButton.addEventListener('click', closeAllWorkspaceTabs);
  document.getElementById('mobileNavTabs').addEventListener('click', () => {
    if (!workspacePanes[0].tabs.length && !workspacePanes[1].tabs.length) {
      showToast('Açık sekme yok. Bir kayda dokunarak çalışma alanında aç.');
      return;
    }
    renderWorkspaceTabSwitcher();
    elements.workspaceTabSwitcher.hidden = false;
    document.body.classList.add('modal-open');
  });
  document.getElementById('closeWorkspaceTabSwitcher').addEventListener('click', () => {
    elements.workspaceTabSwitcher.hidden = true;
    document.body.classList.remove('modal-open');
  });
  elements.workspaceTabSwitcher.addEventListener('click', event => {
    if (event.target === elements.workspaceTabSwitcher) {
      elements.workspaceTabSwitcher.hidden = true;
      document.body.classList.remove('modal-open');
    }
  });
  document.querySelectorAll('.close-modal').forEach(button => button.addEventListener('click', closeEditor));
  document.querySelectorAll('.close-audio-modal').forEach(button => button.addEventListener('click', closeAudioModal));
  document.querySelectorAll('.close-photo-modal').forEach(button => button.addEventListener('click', closePhotoModal));
  elements.modal.addEventListener('click', event => { if (event.target === elements.modal) closeEditor(); });
  elements.audioModal.addEventListener('click', event => { if (event.target === elements.audioModal) closeAudioModal(); });
  elements.photoModal.addEventListener('click', event => { if (event.target === elements.photoModal) closePhotoModal(); });
  elements.form.addEventListener('submit', saveRecord);
  elements.search.addEventListener('input', () => {
    window.clearTimeout(searchDebounceTimer);
    searchDebounceTimer = window.setTimeout(renderRecords, 120);
  });
  [elements.dateFilter, elements.contentFilter, elements.sortFilter].forEach(control => {
    control.addEventListener('change', renderRecords);
  });
  elements.clearAdvancedFilters.addEventListener('click', clearAllFilters);
  elements.photoCameraInput.addEventListener('change', handlePhotoSelected);
  elements.photoGalleryInput.addEventListener('change', handlePhotoSelected);
  document.getElementById('choosePhotoCameraButton').addEventListener('click', () => choosePhotoSource('camera'));
  document.getElementById('choosePhotoGalleryButton').addEventListener('click', () => choosePhotoSource('gallery'));
  document.getElementById('closePhotoSourceButton').addEventListener('click', closePhotoSourcePicker);
  document.getElementById('cancelPhotoSourceButton').addEventListener('click', closePhotoSourcePicker);
  elements.photoSourceModal.addEventListener('click', event => { if (event.target === elements.photoSourceModal) closePhotoSourcePicker(); });
  elements.addPhotoToNote.addEventListener('click', () => openPhotoPicker('note'));
  
  elements.startRecording.addEventListener('click', startAudioRecording);
  elements.stopRecording.addEventListener('click', stopAudioRecording);
  elements.saveAudio.addEventListener('click', saveAudioRecording);
  elements.savePhoto.addEventListener('click', savePhotoRecord);
  elements.filters.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    activeTagFilter = '';
    updateFilterButtons();
    renderRecords();
  });
  // Favorites, trash and the built-in categories share one view filter.
  elements.tagFilters.addEventListener('click', event => {
    const button = event.target.closest('[data-tag-filter]');
    if (button) activateTagFilter(button.dataset.tagFilter);
  });
  elements.emptyTrash.addEventListener('click', emptyTrash);
  const openSettings = () => {
    updateBiometricSettings();
    updateNotificationSettings();
    applyAppearancePreferences(readAppearancePreferences());
    elements.settingsModal.hidden = false;
    document.body.classList.add('modal-open');
  };
  document.getElementById('settingsButton').addEventListener('click', openSettings);
  elements.enableNotifications.addEventListener('click', enableReminderNotifications);
  elements.passwordForm.addEventListener('submit', savePasswordRecord);
  document.querySelectorAll('.close-password-modal').forEach(button => button.addEventListener('click', closePasswordEditor));
  elements.passwordModal.addEventListener('click', event => { if (event.target === elements.passwordModal) closePasswordEditor(); });
  elements.passwordDetailModal.addEventListener('click', event => { if (event.target === elements.passwordDetailModal) closePasswordDetails(); });
  document.querySelectorAll('.close-password-detail').forEach(button => button.addEventListener('click', closePasswordDetails));
  elements.togglePasswordValue.addEventListener('click', () => {
    const visible = elements.passwordValue.type === 'text';
    elements.passwordValue.type = visible ? 'password' : 'text';
    elements.togglePasswordValue.textContent = visible ? 'Göster' : 'Gizle';
  });
  elements.revealPasswordDetail.addEventListener('click', () => {
    const visible = elements.passwordDetailValue.type === 'text';
    elements.passwordDetailValue.type = visible ? 'password' : 'text';
    elements.revealPasswordDetail.textContent = visible ? 'Göster' : 'Gizle';
  });
  document.getElementById('copyPasswordUsername').addEventListener('click', () => copySensitiveValue(elements.passwordDetailUsername.value, 'Kullanıcı adı'));
  document.getElementById('copyPasswordValue').addEventListener('click', () => copySensitiveValue(elements.passwordDetailValue.value, 'Parola'));
  document.getElementById('editPasswordFromDetail').addEventListener('click', () => {
    const record = records.find(item => item.id === activePasswordRecordId);
    closePasswordDetails();
    if (record) openPasswordEditor(record);
  });
  document.getElementById('exportBackupButton').addEventListener('click', openBackupExport);
  document.getElementById('importBackupButton').addEventListener('click', () => chooseBackupFile('restore'));
  elements.verifyBackup.addEventListener('click', () => chooseBackupFile('verify'));
  elements.runSecurityAudit.addEventListener('click', openSecurityAudit);
  document.getElementById('closeSecurityAuditButton').addEventListener('click', closeSecurityAudit);
  document.getElementById('closeSecurityAuditFooter').addEventListener('click', closeSecurityAudit);
  elements.securityAuditModal.addEventListener('click', event => { if (event.target === elements.securityAuditModal) closeSecurityAudit(); });
  elements.gateRestoreBackup.addEventListener('click', () => chooseBackupFile('restore'));
  elements.backupFileInput.addEventListener('change', handleBackupFileChosen);
  elements.backupExportForm.addEventListener('submit', handleBackupExport);
  elements.backupImportForm.addEventListener('submit', restoreEncryptedBackup);
  document.querySelectorAll('.close-backup-export').forEach(button => button.addEventListener('click', closeBackupExport));
  document.querySelectorAll('.close-backup-import').forEach(button => button.addEventListener('click', closeBackupImport));
  elements.backupExportModal.addEventListener('click', event => { if (event.target === elements.backupExportModal) closeBackupExport(); });
  elements.backupImportModal.addEventListener('click', event => { if (event.target === elements.backupImportModal) closeBackupImport(); });
  document.getElementById('mobileNavHome').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('mobileNavSearch').addEventListener('click', () => {
    document.getElementById('recordsHeading').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => elements.search.focus({ preventScroll: true }), 250);
  });
  document.getElementById('mobileNavAdd').addEventListener('click', () => openEditor(null, 'note'));
  document.querySelectorAll('.close-settings-modal').forEach(button => button.addEventListener('click', () => {
    elements.settingsModal.hidden = true;
    document.body.classList.remove('modal-open');
  }));
  elements.settingsModal.addEventListener('click', event => { if (event.target === elements.settingsModal) { elements.settingsModal.hidden = true; document.body.classList.remove('modal-open'); } });
  elements.enableBiometric.addEventListener('click', enableBiometricUnlock);
  elements.autoBiometricToggle.addEventListener('change', async () => {
    if (!vaultConfig || !vaultConfig.biometric) {
      elements.autoBiometricToggle.checked = false;
      showToast('Önce biyometrik kilidi etkinleştir.');
      return;
    }
    vaultConfig.autoBiometricUnlock = elements.autoBiometricToggle.checked;
    try {
      await saveMeta(vaultConfig);
      updateBiometricSettings();
      showToast(vaultConfig.autoBiometricUnlock ? 'Açılışta otomatik biyometrik giriş açıldı.' : 'Otomatik biyometrik giriş kapatıldı.');
    } catch (error) {
      elements.autoBiometricToggle.checked = !elements.autoBiometricToggle.checked;
      showToast('Ayar kaydedilemedi.');
    }
  });
  [elements.appearanceTheme, elements.appearanceAccent, elements.appearanceDensity].forEach(control => control.addEventListener('change', saveAppearancePreferences));
  elements.disableBiometric.addEventListener('click', async () => {
    if (!window.confirm('Bedrock biyometrik hızlı açmayı kapatsın mı? Bundan sonra ana parola kullanılır.')) return;
    vaultConfig.biometric = null;
    vaultConfig.autoBiometricUnlock = false;
    await saveMeta(vaultConfig);
    updateBiometricSettings();
    showToast('Biyometrik hızlı açma kapatıldı.');
  });
  elements.lockNow.addEventListener('click', () => {
    elements.settingsModal.hidden = true;
    document.body.classList.remove('modal-open');
    lockVault();
  });
  document.getElementById('openChangePasswordButton').addEventListener('click', () => {
    elements.settingsModal.hidden = true;
    elements.changePasswordModal.hidden = false;
  });
  document.querySelectorAll('.close-change-password').forEach(button => button.addEventListener('click', () => {
    elements.changePasswordModal.hidden = true;
    document.body.classList.remove('modal-open');
    elements.changePasswordForm.reset();
  }));
  elements.changePasswordForm.addEventListener('submit', changeMasterPassword);
  elements.gateBiometric.addEventListener('click', unlockWithBiometric);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!elements.modal.hidden) closeEditor();
      if (!elements.audioModal.hidden) closeAudioModal();
      if (!elements.photoModal.hidden) closePhotoModal();
      if (!elements.photoSourceModal.hidden) closePhotoSourcePicker();
      if (!elements.settingsModal.hidden) { elements.settingsModal.hidden = true; document.body.classList.remove('modal-open'); }
      if (!elements.changePasswordModal.hidden) { elements.changePasswordModal.hidden = true; elements.changePasswordForm.reset(); document.body.classList.remove('modal-open'); }
      if (!elements.passwordModal.hidden) closePasswordEditor();
      if (!elements.passwordDetailModal.hidden) closePasswordDetails();
      if (!elements.backupExportModal.hidden) closeBackupExport();
      if (!elements.backupImportModal.hidden) closeBackupImport();
      if (!elements.securityAuditModal.hidden) closeSecurityAudit();
      if (!elements.workspaceTabSwitcher.hidden) { elements.workspaceTabSwitcher.hidden = true; document.body.classList.remove('modal-open'); }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      elements.search.focus();
    }
  });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'BEDROCK_OPEN_REMINDER' && event.data.recordId) {
        pendingReminderRecordId = event.data.recordId;
        openPendingReminderRecord();
      }
    });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pageHiddenAt = Date.now();
    else {
      if (pageHiddenAt && Date.now() - pageHiddenAt > 5 * 60 * 1000 && vaultCryptoKey) lockVault();
      pageHiddenAt = 0;
      if (vaultCryptoKey) { processDueReminders(); scheduleNextReminder(); }
      else if (gateMode === 'unlock' && !elements.gate.hidden) scheduleAutomaticBiometricUnlock();
    }
  });
  window.addEventListener('pagehide', () => {
    window.clearTimeout(reminderTimer);
    reminderTimer = null;
    stopRecordingTimer();
    stopMicrophoneTracks();
    releaseRenderedObjectUrls();
    releaseWorkspaceObjectUrls();
    // Also lock a page restored from the browser's back-forward cache.
    if (vaultCryptoKey) {
      clearUnlockedSession();
      setGateMode('unlock');
    }
  });
}

function openPendingReminderRecord() {
  if (!pendingReminderRecordId || !vaultCryptoKey) return;
  const record = records.find(item => item.id === pendingReminderRecordId);
  if (!record) {
    pendingReminderRecordId = null;
    return;
  }
  pendingReminderRecordId = null;
  activeCategory = record.deletedAt ? 'trash' : record.archivedAt ? 'archive' : 'all';
  activeTagFilter = '';
  elements.search.value = record.title;
  elements.dateFilter.value = 'all';
  elements.contentFilter.value = 'all';
  elements.sortFilter.value = 'newest';
  updateFilterButtons();
  renderRecords();
  window.setTimeout(() => {
    const card = elements.list.querySelector(`[data-record-id="${CSS.escape(record.id)}"]`);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function updateNotificationSettings() {
  const supported = 'Notification' in window && 'serviceWorker' in navigator;
  if (!supported) {
    elements.notificationsStatus.textContent = 'Bu tarayıcı bildirim API’sini desteklemiyor.';
    elements.enableNotifications.textContent = 'Bildirimler desteklenmiyor';
    elements.enableNotifications.disabled = true;
    return;
  }
  elements.enableNotifications.disabled = Notification.permission === 'granted';
  if (Notification.permission === 'granted') {
    elements.notificationsStatus.textContent = 'İzin verildi. Bedrock uygun olduğunda hatırlatma bildirimi gösterebilir.';
    elements.enableNotifications.textContent = 'Bildirimler etkin';
  } else if (Notification.permission === 'denied') {
    elements.notificationsStatus.textContent = 'Bildirim izni engellendi. Android/tarayıcı site ayarlarından izin vermelisin.';
    elements.enableNotifications.textContent = 'Site ayarlarını kontrol et';
    elements.enableNotifications.disabled = false;
  } else {
    elements.notificationsStatus.textContent = 'Henüz izin verilmedi. Hatırlatma kullanmak için etkinleştirebilirsin.';
    elements.enableNotifications.textContent = 'Hatırlatma bildirimlerini etkinleştir';
  }
}

async function enableReminderNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    showToast('Bu tarayıcı bildirimleri desteklemiyor.');
    updateNotificationSettings();
    return;
  }
  try {
    if (Notification.permission === 'denied') {
      showToast('Bildirim izni tarayıcı site ayarlarından açılmalı.');
      return;
    }
    const permission = await Notification.requestPermission();
    updateNotificationSettings();
    if (permission === 'granted') {
      showToast('Hatırlatma bildirimleri etkinleştirildi.');
      await processDueReminders();
      scheduleNextReminder();
    } else {
      showToast('Bildirim izni verilmedi. Hatırlatmalar Bedrock açıkken gösterilebilir.');
    }
  } catch (error) {
    updateNotificationSettings();
    showToast('Bildirim izni alınamadı. Tarayıcı izinlerini kontrol et.');
  }
}

async function deliverReminderNotification(record) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Bedrock hatırlatması', {
      body: `“${record.title}” için hatırlatma zamanı geldi.`,
      icon: './icons/bedrock-192.png',
      badge: './icons/bedrock-192.png',
      tag: `bedrock-reminder-${record.id}`,
      timestamp: record.reminderAt,
      data: { recordId: record.id },
      renotify: false
    });
    return true;
  } catch (error) {
    console.warn('Hatırlatma bildirimi gösterilemedi:', error);
    return false;
  }
}

async function processDueReminders() {
  if (!vaultCryptoKey || reminderDispatchRunning) return;
  reminderDispatchRunning = true;
  try {
    const now = Date.now();
    const due = records.filter(record => record.reminderAt && record.reminderAt <= now
      && !record.reminderNotifiedAt && !record.deletedAt && !record.archivedAt);
    for (const record of due) {
      let delivered = false;
      const notificationPermission = 'Notification' in window ? Notification.permission : 'denied';
      if (notificationPermission === 'granted') delivered = await deliverReminderNotification(record);
      if (!delivered && !document.hidden) {
        showToast(`Hatırlatma zamanı: ${record.title}`);
      }
      if (delivered || !document.hidden) {
        const updated = { ...record, reminderNotifiedAt: Date.now() };
        try {
          await persistEncryptedRecord(updated);
          const index = records.findIndex(item => item.id === updated.id);
          if (index >= 0) records[index] = updated;
        } catch (error) {
          console.warn('Hatırlatma durumu kaydedilemedi:', error);
        }
      }
    }
  } finally {
    reminderDispatchRunning = false;
    scheduleNextReminder();
  }
}

function scheduleNextReminder() {
  window.clearTimeout(reminderTimer);
  reminderTimer = null;
  if (!vaultCryptoKey) return;
  const now = Date.now();
  const overdue = records.some(record => record.reminderAt && record.reminderAt <= now && !record.reminderNotifiedAt && !record.deletedAt && !record.archivedAt);
  if (overdue && !document.hidden) {
    reminderTimer = window.setTimeout(() => { processDueReminders(); }, 250);
    return;
  }
  const next = records
    .filter(record => record.reminderAt && record.reminderAt > now && !record.reminderNotifiedAt && !record.deletedAt && !record.archivedAt)
    .sort((a, b) => a.reminderAt - b.reminderAt)[0];
  if (!next) return;
  const delay = Math.max(250, Math.min(next.reminderAt - now + 50, 2147483000));
  reminderTimer = window.setTimeout(() => { processDueReminders(); }, delay);
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
    // Check once when the app opens; avoid polling or background network traffic.
    if (navigator.onLine && registration && typeof registration.update === 'function') {
      registration.update().catch(() => {});
    }
  } catch (error) {
    console.warn('Çevrimdışı önbellek etkinleştirilemedi:', error);
  }
}

async function init() {
  // The gate handler is deliberately bound first so a later UI initialization
  // error can never trigger a native form navigation/reload.
  try {
    bindGateFormEarly();
  } catch (error) {
    console.error('Bedrock güvenlik formu başlatılamadı:', error);
    elements.gateError.textContent = 'Güvenlik formu başlatılamadı. Sayfayı yenileyip tekrar dene.';
  }
  try {
    applyAppearancePreferences(readAppearancePreferences());
    initEvents();
  } catch (error) {
    console.error('Bedrock arayüz başlatma hatası:', error);
    elements.gateError.textContent = 'Arayüzün bir bölümü yüklenemedi: ' + (error.message || 'bilinmeyen hata');
  }
  try {
    const currentUrl = new URL(window.location.href);
    pendingReminderRecordId = currentUrl.searchParams.get('reminder') || null;
    if (pendingReminderRecordId) {
      currentUrl.searchParams.delete('reminder');
      window.history.replaceState({}, '', currentUrl);
    }
  } catch (_) { pendingReminderRecordId = null; }
  try {
    if (!window.isSecureContext || !window.crypto || !window.crypto.subtle) {
      throw new Error('Güvenli kasa için Bedrock’u HTTPS üzerinden veya localhost üzerinde açmalısın.');
    }
    database = await openDatabase();
    vaultConfig = await getMeta('vaultConfig');
    if (vaultConfig && vaultConfig.key === 'vaultConfig' && vaultConfig.kdf === 'PBKDF2-SHA-256'
      && Number.isInteger(vaultConfig.iterations) && typeof vaultConfig.salt === 'string'
      && typeof vaultConfig.wrapIv === 'string' && typeof vaultConfig.wrappedKey === 'string') {
      setGateMode('unlock');
    } else {
      // Never offer a fresh vault over orphaned encrypted records. This can
      // happen when the app is opened under a different origin/profile or when
      // browser storage was partially removed. Recovery must be explicit.
      const stored = await storeRequest('readonly', store => store.getAll());
      const hasEncryptedRecords = stored.some(item => item && item.format === VAULT_FORMAT);
      if (hasEncryptedRecords) {
        setGateMode('recovery');
        elements.gateError.textContent = 'Mevcut şifrelenmiş kayıtlar bulundu. Yeni kasa oluşturma; eski adresi kontrol et veya .bedrock yedeğini geri yükle.';
      } else {
        setGateMode('setup');
        elements.gateSubtitle.textContent = 'Bu tarayıcı adresinde kasa ayarı bulunamadı. Daha önce Bedrock kullandıysan aynı HTTPS adresini ve tarayıcı profilini aç. Yeni kasa oluşturmak eski kasanı geri getirmez.';
      }
    }
    registerServiceWorker();
  } catch (error) {
    console.error(error);
    elements.gate.hidden = false;
    elements.gateTitle.textContent = 'Bedrock başlatılamadı.';
    elements.gateSubtitle.textContent = error.message || 'Tarayıcı bu güvenli depolama özelliklerini desteklemiyor.';
    elements.gateForm.hidden = true;
    elements.gateError.textContent = 'Bedrock’u HTTPS üzerinden veya localhost üzerinde aç.';
  }
}

init();
