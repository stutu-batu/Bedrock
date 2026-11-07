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
const BACKUP_FORMAT = 'bedrock-backup-v1';
const BACKUP_PAYLOAD_FORMAT = 'bedrock-backup-payload-v1';
const BACKUP_MAX_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;
const IMAGE_JPEG_QUALITY = 0.82;

const elements = {
  list: document.getElementById('recordsList'),
  count: document.getElementById('recordCount'),
  allCount: document.getElementById('allCount'),
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
  photoInput: document.getElementById('photoInput'),
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
  backupFileInput: document.getElementById('backupFileInput')
};

let database;
let records = [];
let activeCategory = 'all';
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
let vaultConfig = null;
let vaultCryptoKey = null;
let gateMode = 'setup';
let pageHiddenAt = 0;
let activePasswordRecordId = null;
let pendingBackupFile = null;
let searchDebounceTimer = null;

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

async function encryptRecord(record, key) {
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
    updatedAt: record.updatedAt
  };
  const encryptedMetadata = await encryptBytes(encoder.encode(JSON.stringify(metadata)), key, `bedrock-record:${record.id}:meta`);
  const attachments = [];
  for (const attachment of (record.attachments || [])) {
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
  elements.gateRestoreBackup.hidden = mode !== 'setup';
  if (mode === 'setup') {
    elements.gateTitle.textContent = 'Kişisel kasanı oluştur.';
    elements.gateSubtitle.textContent = 'Bir ana parola belirle. Bedrock kayıtlarını bu parola ile cihazında şifreleyecek.';
    elements.gateSubmit.textContent = 'Güvenli kasayı oluştur';
  } else {
    elements.gateTitle.textContent = 'Bedrock kilitli.';
    elements.gateSubtitle.textContent = 'Kayıtlarını açmak için ana parolanı gir.';
    elements.gateSubmit.textContent = 'Kasayı aç';
  }
  window.setTimeout(() => elements.gatePassword.focus(), 80);
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
    showToast('Bedrock kasan şifrelendi ve hazır.');
  } finally {
    rawKey.fill(0);
  }
}

function updateBiometricSettings() {
  const enabled = Boolean(vaultConfig && vaultConfig.biometric);
  elements.biometricStatus.textContent = enabled
    ? 'Bu cihazda biyometrik hızlı açma etkin.'
    : 'Kapalı. Ana parola her açılışta kullanılacak.';
  elements.enableBiometric.hidden = enabled;
  elements.disableBiometric.hidden = !enabled;
  elements.gateBiometric.hidden = !enabled || !document.body.classList.contains('vault-locked');
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

async function unlockWithBiometric() {
  if (!vaultConfig || !vaultConfig.biometric) return;
  elements.gateBiometric.disabled = true;
  elements.gateError.textContent = 'Cihaz doğrulaması bekleniyor…';
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
    } finally {
      prfOutput.fill(0);
    }
  } catch (error) {
    vaultCryptoKey = null;
    elements.gateError.textContent = error.message || 'Biyometrik doğrulama başarısız. Ana parolanı kullan.';
  } finally {
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
  vaultCryptoKey = null;
  records = [];
  releaseRenderedObjectUrls();
  elements.search.value = '';
  activeCategory = 'all';
  updateFilterButtons();
  elements.list.replaceChildren();
  elements.count.textContent = 'KİLİTLİ';
  elements.allCount.textContent = '0';
  elements.form.reset();
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

function createRecordCard(record) {
  const card = document.createElement('article');
  card.className = 'record-card';

  const symbol = document.createElement('div');
  symbol.className = 'record-symbol';
  symbol.innerHTML = iconMarkup(record.category);

  const main = document.createElement('div');
  main.className = 'record-main';
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

  if (attachments.length) {
    const media = document.createElement('div');
    media.className = 'record-attachments';
    for (const attachment of attachments) media.append(createAttachmentView(attachment));
    main.append(media);
  }

  const actions = document.createElement('div');
  actions.className = 'record-actions';
  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'record-action';
  editButton.setAttribute('aria-label', `${record.title} kaydını düzenle`);
  editButton.title = 'Düzenle';
  editButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="m14 5 5 5M4 20l4.5-1 10.8-10.8a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z"/></svg>';
  editButton.addEventListener('click', () => record.category === 'password' ? openPasswordEditor(record) : openEditor(record));
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'record-action';
  deleteButton.setAttribute('aria-label', `${record.title} kaydını sil`);
  deleteButton.title = 'Sil';
  deleteButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>';
  deleteButton.addEventListener('click', () => deleteRecord(record));
  if (record.category === 'password') {
    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.className = 'record-action';
    viewButton.setAttribute('aria-label', `${record.title} giriş bilgilerini görüntüle`);
    viewButton.title = 'Giriş bilgilerini görüntüle';
    viewButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
    viewButton.addEventListener('click', () => openPasswordDetails(record));
    actions.append(viewButton);
  }
  actions.append(editButton, deleteButton);

  card.append(symbol, main, actions);
  return card;
}

function renderRecords() {
  releaseRenderedObjectUrls();
  const query = escapeSearch(elements.search.value);
  const filtered = records.filter(record => {
    const matchesCategory = activeCategory === 'all' || record.category === activeCategory;
    const attachmentNames = (record.attachments || []).map(item => item.name || '').join(' ');
    const credentialText = record.category === 'password'
      ? `${record.credential && record.credential.username || ''} ${record.credential && record.credential.website || ''}`
      : '';
    const searchable = escapeSearch(`${record.title} ${record.body} ${credentialText} ${categoryName(record.category)} ${attachmentNames}`);
    return matchesCategory && (!query || searchable.includes(query));
  });

  elements.count.textContent = `${records.length} KAYIT`;
  elements.allCount.textContent = String(records.length);
  elements.list.replaceChildren();

  if (filtered.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const icon = document.createElement('div');
    icon.className = 'empty-icon';
    icon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 3.5h8l4 4V20H6z"/><path d="M14 3.5V8h4M9 12h6M9 16h6"/></svg>';
    const heading = document.createElement('h3');
    const paragraph = document.createElement('p');
    const button = document.createElement('button');
    button.className = 'text-action';
    button.type = 'button';
    if (query || activeCategory !== 'all') {
      heading.textContent = 'Burada henüz bir kayıt yok';
      paragraph.textContent = 'Aramanı veya seçtiğin kategoriyi değiştirebilirsin.';
      button.textContent = 'Tüm kayıtları göster';
      button.addEventListener('click', () => {
        activeCategory = 'all';
        elements.search.value = '';
        updateFilterButtons();
        renderRecords();
      });
    } else {
      heading.textContent = 'Henüz bir kaydın yok';
      paragraph.textContent = 'İlk notunu ekleyerek Bedrock’u doldurmaya başla.';
      button.textContent = 'İlk kaydını oluştur ↗';
      button.addEventListener('click', () => openEditor());
    }
    empty.append(icon, heading, paragraph, button);
    elements.list.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const record of filtered) fragment.append(createRecordCard(record));
  elements.list.append(fragment);
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

function openEditor(record = null, forcedCategory = null) {
  editingId = record ? record.id : null;
  elements.form.reset();
  elements.modalTitle.textContent = record ? 'Kaydını düzenle.' : 'Aklında kalmasın.';
  elements.title.value = record ? record.title : '';
  elements.category.value = record ? record.category : (forcedCategory || 'note');
  elements.body.value = record ? record.body : '';
  elements.modal.hidden = false;
  document.body.classList.add('modal-open');
  window.setTimeout(() => elements.title.focus(), 40);
}

function closeEditor() {
  elements.modal.hidden = true;
  document.body.classList.remove('modal-open');
  editingId = null;
}

function openPasswordEditor(record = null) {
  activePasswordRecordId = record ? record.id : null;
  elements.passwordForm.reset();
  elements.passwordTitle.value = record ? record.title : '';
  elements.passwordUsername.value = record && record.credential ? record.credential.username || '' : '';
  elements.passwordValue.value = record && record.credential ? record.credential.password || '' : '';
  elements.passwordWebsite.value = record && record.credential ? record.credential.website || '' : '';
  elements.passwordNotes.value = record ? record.body || '' : '';
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
    attachments: existing && Array.isArray(existing.attachments) ? existing.attachments : [],
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now
  };
  elements.savePassword.disabled = true;
  try {
    const encryptedRecord = await encryptRecord(record, vaultCryptoKey);
    await storeRequest('readwrite', store => store.put(encryptedRecord));
    await loadRecords();
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

function decodeRecordFromBackup(record) {
  if (!record || typeof record.id !== 'string' || record.format !== VAULT_FORMAT || !Array.isArray(record.attachments)) {
    throw new Error('Yedekte geçersiz bir kayıt bulundu.');
  }
  const decoded = {
    id: record.id,
    format: record.format,
    metaIv: base64ToBytes(record.metaIv),
    metaCipher: base64ToBytes(record.metaCipher),
    attachments: record.attachments.map(item => {
      if (!item || typeof item.id !== 'string' || !['image', 'audio'].includes(item.kind)) throw new Error('Yedekte geçersiz bir ek bulundu.');
      return {
        id: item.id,
        kind: item.kind,
        name: String(item.name || ''),
        mimeType: String(item.mimeType || 'application/octet-stream'),
        createdAt: Number(item.createdAt) || Date.now(),
        iv: base64ToBytes(item.iv),
        cipher: base64ToBytes(item.cipher)
      };
    })
  };
  if (decoded.metaIv.length !== 12 || decoded.metaCipher.length < 16) throw new Error('Yedek dosyası bozuk veya eksik.');
  for (const item of decoded.attachments) if (item.iv.length !== 12 || item.cipher.length < 16) throw new Error('Yedek eki bozuk veya eksik.');
  return decoded;
}

async function createEncryptedBackup(password) {
  // Requiring the current vault password prevents exporting from a stale or unattended session.
  await unwrapVaultKey(vaultConfig, password);
  const storedRecords = await storeRequest('readonly', store => store.getAll());
  const payload = {
    format: BACKUP_PAYLOAD_FORMAT,
    version: 1,
    exportedAt: Date.now(),
    vaultConfig: { ...vaultConfig, biometric: null },
    records: storedRecords.map(encodeRecordForBackup)
  };
  const salt = randomBytes(16);
  const wrappingKey = await derivePasswordWrappingKey(password, salt, PBKDF2_ITERATIONS);
  const encrypted = await encryptBytes(encoder.encode(JSON.stringify(payload)), wrappingKey, BACKUP_FORMAT);
  const envelope = {
    format: BACKUP_FORMAT,
    version: 1,
    kdf: 'PBKDF2-SHA-256',
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(encrypted.iv),
    cipher: bytesToBase64(new Uint8Array(encrypted.cipher))
  };
  const blob = new Blob([JSON.stringify(envelope)], { type: 'application/vnd.bedrock.backup+json' });
  if (blob.size > BACKUP_MAX_BYTES) throw new Error('Yedek dosyası 100 MB sınırını aşıyor.');
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
    showToast('Şifreli Bedrock yedeği indirildi.');
  } catch (error) {
    elements.backupExportError.textContent = 'Ana parola yanlış veya yedek oluşturulamadı.';
  } finally {
    elements.confirmBackupExport.disabled = false;
  }
}

function chooseBackupFile() {
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
  elements.settingsModal.hidden = true;
  elements.backupImportModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeBackupImport() {
  elements.backupImportModal.hidden = true;
  elements.backupImportForm.reset();
  elements.backupImportError.textContent = '';
  pendingBackupFile = null;
  document.body.classList.remove('modal-open');
}

async function restoreEncryptedBackup(event) {
  event.preventDefault();
  if (!pendingBackupFile) { elements.backupImportError.textContent = 'Önce yedek dosyası seç.'; return; }
  const password = elements.backupImportPassword.value;
  if (!password) { elements.backupImportError.textContent = 'Yedek parolasını gir.'; return; }
  elements.confirmBackupImport.disabled = true;
  elements.backupImportError.textContent = '';
  try {
    const envelope = JSON.parse(await pendingBackupFile.text());
    if (!envelope || envelope.format !== BACKUP_FORMAT || envelope.version !== 1 || envelope.kdf !== 'PBKDF2-SHA-256') {
      throw new Error('Bu dosya Bedrock yedeği değil veya sürümü desteklenmiyor.');
    }
    const iterations = Number(envelope.iterations);
    if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 1000000) throw new Error('Yedek şifreleme ayarları geçersiz.');
    const key = await derivePasswordWrappingKey(password, base64ToBytes(envelope.salt), iterations);
    const plaintext = await decryptBytes({ iv: base64ToBytes(envelope.iv), cipher: base64ToBytes(envelope.cipher) }, key, BACKUP_FORMAT);
    const payload = JSON.parse(decoder.decode(plaintext));
    if (!payload || payload.format !== BACKUP_PAYLOAD_FORMAT || payload.version !== 1 || !Array.isArray(payload.records) || payload.records.length > 50000) {
      throw new Error('Yedek içeriği geçersiz.');
    }
    const config = payload.vaultConfig;
    if (!config || config.key !== 'vaultConfig' || config.version !== 1 || config.kdf !== 'PBKDF2-SHA-256' || !config.salt || !config.wrapIv || !config.wrappedKey || !Number.isInteger(config.iterations) || config.iterations < 100000 || config.iterations > 1000000) {
      throw new Error('Yedekte kasa anahtarı bulunamadı veya şifreleme ayarları geçersiz.');
    }
    if (base64ToBytes(config.salt).length !== 16 || base64ToBytes(config.wrapIv).length !== 12 || base64ToBytes(config.wrappedKey).length < 48) {
      throw new Error('Yedekteki kasa anahtarı verisi bozuk.');
    }
    const decodedRecords = payload.records.map(decodeRecordFromBackup);
    if (!window.confirm(`${decodedRecords.length} kayıt içeren yedek geri yüklenecek. Bu cihazdaki mevcut Bedrock kayıtlarının tamamı silinip yedekteki kayıtlarla değiştirilecek. Devam edilsin mi?`)) return;
    const restoredConfig = { ...config, biometric: null };
    await new Promise((resolve, reject) => {
      const tx = database.transaction([STORE_NAME, META_STORE], 'readwrite');
      const recordStore = tx.objectStore(STORE_NAME);
      const metaStore = tx.objectStore(META_STORE);
      recordStore.clear();
      for (const record of decodedRecords) recordStore.put(record);
      metaStore.clear();
      metaStore.put(restoredConfig);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Yedek geri yüklenemedi.'));
      tx.onabort = () => reject(tx.error || new Error('Yedek geri yüklenemedi.'));
    });
    vaultConfig = restoredConfig;
    clearUnlockedSession();
    setGateMode('unlock');
    closeBackupImport();
    showToast('Yedek geri yüklendi. Kasanı yedeğin ana parolasıyla aç.');
  } catch (error) {
    console.error('Bedrock yedek geri yükleme:', error);
    elements.backupImportError.textContent = error.name === 'OperationError'
      ? 'Yedek parolası yanlış veya dosya bozuk.'
      : (error.message || 'Yedek geri yüklenemedi.');
  } finally {
    elements.confirmBackupImport.disabled = false;
  }
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

async function saveRecord(event) {
  event.preventDefault();
  const title = elements.title.value.trim();
  const body = elements.body.value.trim();
  const category = elements.category.value;
  if (!title) {
    elements.title.focus();
    return;
  }

  elements.saveButton.disabled = true;
  const now = Date.now();
  const existing = editingId ? records.find(item => item.id === editingId) : null;
  const record = {
    id: editingId || makeId(),
    title,
    body,
    category: category === 'object' ? 'object' : 'note',
    attachments: existing && Array.isArray(existing.attachments) ? existing.attachments : [],
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now
  };

  try {
    const encryptedRecord = await encryptRecord(record, vaultCryptoKey);
    await storeRequest('readwrite', store => store.put(encryptedRecord));
    await loadRecords();
    closeEditor();
    showToast(existing ? 'Kayıt güncellendi.' : 'Kayıt Bedrock’a eklendi.');
  } catch (error) {
    showToast(storageErrorMessage(error));
  } finally {
    elements.saveButton.disabled = false;
  }
}

async function saveMediaRecord({ title, body, category, attachment }) {
  const now = Date.now();
  const record = {
    id: makeId(), title: title.trim(), body: body.trim(),
    category: category === 'object' ? 'object' : 'note',
    attachments: [attachment], createdAt: now, updatedAt: now
  };
  const encryptedRecord = await encryptRecord(record, vaultCryptoKey);
  await storeRequest('readwrite', store => store.put(encryptedRecord));
  await loadRecords();
}

function storageErrorMessage(error) {
  if (error && (error.name === 'QuotaExceededError' || error.name === 'UnknownError')) {
    return 'Telefonun tarayıcı depolama alanı dolmuş olabilir. Biraz yer açıp tekrar dene.';
  }
  return error && error.message ? error.message : 'Kayıt kaydedilemedi.';
}

async function deleteRecord(record) {
  const confirmed = window.confirm(`“${record.title}” kaydı silinsin mi? Ekli fotoğraf ve sesler de silinir. Bu işlem geri alınamaz.`);
  if (!confirmed) return;
  try {
    await storeRequest('readwrite', store => store.delete(record.id));
    await loadRecords();
    showToast('Kayıt ve ekleri silindi.');
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
    await saveMediaRecord({ title, body: elements.audioDescription.value, category: 'note', attachment });
    closeAudioModal();
    showToast('Ses kaydı Bedrock’a kaydedildi.');
  } catch (error) {
    elements.saveAudio.disabled = false;
    showToast(storageErrorMessage(error));
  }
}

function openPhotoPicker() {
  elements.photoInput.value = '';
  elements.photoInput.click();
}

function closePhotoModal() {
  elements.photoModal.hidden = true;
  document.body.classList.remove('modal-open');
  if (pendingPhotoUrl) URL.revokeObjectURL(pendingPhotoUrl);
  pendingPhotoUrl = null;
  pendingPhotoBlob = null;
  elements.photoPreview.removeAttribute('src');
  elements.photoTitle.value = '';
  elements.photoDescription.value = '';
  elements.photoCategory.value = 'object';
  elements.savePhoto.disabled = false;
}

function handlePhotoSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('Lütfen bir fotoğraf dosyası seç.');
    return;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    showToast('Fotoğraf 18 MB sınırını aşıyor. Daha küçük bir fotoğraf seç.');
    return;
  }
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
    await saveMediaRecord({ title, body: elements.photoDescription.value, category: elements.photoCategory.value, attachment });
    closePhotoModal();
    showToast('Fotoğraf Bedrock’a kaydedildi.');
  } catch (error) {
    elements.savePhoto.disabled = false;
    showToast(storageErrorMessage(error));
  }
}

function initEvents() {
  document.getElementById('newNoteButton').addEventListener('click', () => openEditor(null, 'note'));
  document.getElementById('newObjectButton').addEventListener('click', () => openEditor(null, 'object'));
  document.getElementById('newPasswordButton').addEventListener('click', () => openPasswordEditor());
  document.getElementById('newAudioButton').addEventListener('click', openAudioModal);
  document.getElementById('newPhotoButton').addEventListener('click', openPhotoPicker);
  document.getElementById('emptyAddButton').addEventListener('click', () => openEditor());
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
  elements.photoInput.addEventListener('change', handlePhotoSelected);
  elements.startRecording.addEventListener('click', startAudioRecording);
  elements.stopRecording.addEventListener('click', stopAudioRecording);
  elements.saveAudio.addEventListener('click', saveAudioRecording);
  elements.savePhoto.addEventListener('click', savePhotoRecord);
  elements.filters.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    updateFilterButtons();
    renderRecords();
  });
  // The password category is handled by the shared category-filter listener.
  const openSettings = () => {
    updateBiometricSettings();
    elements.settingsModal.hidden = false;
    document.body.classList.add('modal-open');
  };
  document.getElementById('settingsButton').addEventListener('click', openSettings);
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
  document.getElementById('importBackupButton').addEventListener('click', chooseBackupFile);
  elements.gateRestoreBackup.addEventListener('click', chooseBackupFile);
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
  elements.disableBiometric.addEventListener('click', async () => {
    if (!window.confirm('Bedrock biyometrik hızlı açmayı kapatsın mı? Bundan sonra ana parola kullanılır.')) return;
    vaultConfig.biometric = null;
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
  elements.gateForm.addEventListener('submit', async event => {
    event.preventDefault();
    const password = elements.gatePassword.value;
    elements.gateError.textContent = '';
    if (gateMode === 'setup') {
      if (password.length < 12) { elements.gateError.textContent = 'Ana parola en az 12 karakter olmalı.'; return; }
      if (password !== elements.gateConfirm.value) { elements.gateError.textContent = 'Parolalar eşleşmiyor.'; return; }
    } else if (!password) { elements.gateError.textContent = 'Ana parolanı gir.'; return; }
    elements.gateSubmit.disabled = true;
    try {
      if (gateMode === 'setup') await setupVault(password);
      else await unlockWithPassword(password);
    } catch (error) {
      elements.gateError.textContent = gateMode === 'setup' ? (error.message || 'Kasa oluşturulamadı.') : 'Ana parola yanlış veya kayıtlar açılamadı.';
    } finally {
      elements.gateSubmit.disabled = false;
    }
  });
  elements.gateBiometric.addEventListener('click', unlockWithBiometric);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!elements.modal.hidden) closeEditor();
      if (!elements.audioModal.hidden) closeAudioModal();
      if (!elements.photoModal.hidden) closePhotoModal();
      if (!elements.settingsModal.hidden) { elements.settingsModal.hidden = true; document.body.classList.remove('modal-open'); }
      if (!elements.changePasswordModal.hidden) { elements.changePasswordModal.hidden = true; elements.changePasswordForm.reset(); document.body.classList.remove('modal-open'); }
      if (!elements.passwordModal.hidden) closePasswordEditor();
      if (!elements.passwordDetailModal.hidden) closePasswordDetails();
      if (!elements.backupExportModal.hidden) closeBackupExport();
      if (!elements.backupImportModal.hidden) closeBackupImport();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      elements.search.focus();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pageHiddenAt = Date.now();
    else if (pageHiddenAt && Date.now() - pageHiddenAt > 5 * 60 * 1000 && vaultCryptoKey) lockVault();
    if (!document.hidden) pageHiddenAt = 0;
  });
  window.addEventListener('pagehide', () => {
    stopRecordingTimer();
    stopMicrophoneTracks();
    releaseRenderedObjectUrls();
    // Also lock a page restored from the browser's back-forward cache.
    if (vaultCryptoKey) {
      clearUnlockedSession();
      setGateMode('unlock');
    }
  });
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
  initEvents();
  try {
    if (!window.isSecureContext || !window.crypto || !window.crypto.subtle) {
      throw new Error('Güvenli kasa için Bedrock’u HTTPS üzerinden veya localhost üzerinde açmalısın.');
    }
    database = await openDatabase();
    vaultConfig = await getMeta('vaultConfig');
    setGateMode(vaultConfig ? 'unlock' : 'setup');
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
