import type { ActivityProgress, CampaignSession, StudentLoginPayload, StudentProfile } from '../types';

export const CAMPAIGN_SESSION_KEY = 'zero.ai-plugin-campaign.session.v1';
export const CAMPAIGN_USERS_KEY = 'zero.ai-plugin-campaign.users.v1';

const STORAGE_ENVELOPE_VERSION = 1;
const STORAGE_KEY_CONTEXT = 'zero.ai-plugin-campaign.local-storage.v1';
const emptySession: CampaignSession = { profile: null, progress: {} };

interface EncryptedStorageEnvelope {
  v: typeof STORAGE_ENVELOPE_VERSION;
  alg: 'A256GCM';
  iv: string;
  data: string;
}

export class CampaignStorageError extends Error {
  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'CampaignStorageError';
  }
}

let mutationQueue: Promise<void> = Promise.resolve();

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function cloneEmptySession(): CampaignSession {
  return { profile: null, progress: {} };
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch (error) {
    throw new CampaignStorageError('本地学生信息密文格式无效', { cause: error });
  }
}

function isEncryptedEnvelope(value: unknown): value is EncryptedStorageEnvelope {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as Record<string, unknown>;
  return envelope.v === STORAGE_ENVELOPE_VERSION
    && envelope.alg === 'A256GCM'
    && typeof envelope.iv === 'string'
    && typeof envelope.data === 'string';
}

async function deriveStorageKey(deviceId: string) {
  if (!globalThis.crypto?.subtle) {
    throw new CampaignStorageError('当前浏览器不支持学生信息安全存储');
  }
  const keyMaterial = new TextEncoder().encode(`${STORAGE_KEY_CONTEXT}:${deviceId}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', keyMaterial);
  return globalThis.crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptValue(value: unknown, deviceId: string) {
  try {
    const key = await deriveStorageKey(deviceId);
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const plain = new TextEncoder().encode(JSON.stringify(value));
    const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain);
    const envelope: EncryptedStorageEnvelope = {
      v: STORAGE_ENVELOPE_VERSION,
      alg: 'A256GCM',
      iv: bytesToBase64(iv),
      data: bytesToBase64(new Uint8Array(encrypted)),
    };
    return JSON.stringify(envelope);
  } catch (error) {
    if (error instanceof CampaignStorageError) throw error;
    throw new CampaignStorageError('学生信息加密失败，请重试', { cause: error });
  }
}

async function decryptEnvelope<T>(envelope: EncryptedStorageEnvelope, deviceId: string): Promise<T> {
  try {
    const key = await deriveStorageKey(deviceId);
    const iv = base64ToBytes(envelope.iv);
    if (iv.length !== 12) throw new CampaignStorageError('本地学生信息密文 IV 无效');
    const ciphertext = base64ToBytes(envelope.data);
    const plain = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch (error) {
    if (error instanceof CampaignStorageError) throw error;
    throw new CampaignStorageError('本地学生信息解密失败', { cause: error });
  }
}

async function writeEncryptedValue(storageKey: string, value: unknown, deviceId: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(storageKey, await encryptValue(value, deviceId));
}

async function readEncryptedValue<T>(storageKey: string, deviceId: string, fallback: T): Promise<T> {
  if (!canUseStorage()) return fallback;
  const raw = localStorage.getItem(storageKey);
  if (!raw) return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error(`[Campaign Storage] ${storageKey} 不是有效 JSON`, error);
    return fallback;
  }

  if (isEncryptedEnvelope(parsed)) return decryptEnvelope<T>(parsed, deviceId);

  // 兼容旧版本明文数据：读取后立即使用同一 storage key 覆盖为 AES-GCM 密文。
  await writeEncryptedValue(storageKey, parsed, deviceId);
  return parsed as T;
}

function enqueueMutation<T>(task: () => Promise<T>) {
  const result = mutationQueue.then(task, task);
  mutationQueue = result.then(() => undefined, () => undefined);
  return result;
}

function normalizeSession(stored: CampaignSession | null | undefined): CampaignSession {
  if (!stored || typeof stored !== 'object') return cloneEmptySession();
  return {
    profile: stored.profile ?? null,
    progress: stored.progress ?? {},
  };
}

async function readSessionWithoutQueue(deviceId: string) {
  const stored = await readEncryptedValue<CampaignSession | null>(CAMPAIGN_SESSION_KEY, deviceId, null);
  return normalizeSession(stored);
}

async function readUsersWithoutQueue(deviceId: string) {
  const stored = await readEncryptedValue<Record<string, StudentProfile> | null>(CAMPAIGN_USERS_KEY, deviceId, null);
  return stored && typeof stored === 'object' ? stored : {};
}

export function createStudentKey(input: Pick<StudentLoginPayload, 'school' | 'name' | 'studentNumber' | 'deviceId'>) {
  return [input.school, input.name, input.studentNumber, input.deviceId]
    .map((part) => part.trim().toLocaleLowerCase('zh-CN'))
    .join('::');
}

function hasSameServerIdentity(
  profile: StudentProfile | null,
  payload: Pick<StudentLoginPayload, 'school' | 'studentNumber' | 'deviceId'>,
) {
  if (!profile) return false;
  return [profile.school, profile.studentNumber, profile.deviceId]
    .map((part) => part.trim().toLocaleLowerCase('zh-CN'))
    .join('::') === [payload.school, payload.studentNumber, payload.deviceId]
    .map((part) => part.trim().toLocaleLowerCase('zh-CN'))
    .join('::');
}

export async function readCampaignSession(deviceId: string): Promise<CampaignSession> {
  if (!canUseStorage()) return emptySession;
  await mutationQueue;
  const [session] = await Promise.all([
    readSessionWithoutQueue(deviceId),
    // 初始化时一并读取，促使旧版明文历史学生列表立即迁移为密文。
    readUsersWithoutQueue(deviceId),
  ]);
  return session;
}

export async function hasDuplicateStudent(payload: StudentLoginPayload) {
  if (!canUseStorage()) return false;
  await mutationQueue;
  const users = await readUsersWithoutQueue(payload.deviceId);
  return Boolean(users[createStudentKey(payload)]);
}

export function saveStudent(
  payload: StudentLoginPayload,
  options: { allowExisting?: boolean } = {},
): Promise<CampaignSession> {
  return enqueueMutation(async () => {
    const users = await readUsersWithoutQueue(payload.deviceId);
    if (!options.allowExisting && users[createStudentKey(payload)]) {
      throw new CampaignStorageError('该学生信息已在当前设备登录，请勿重复提交。');
    }
    const profile: StudentProfile = {
      ...payload,
      school: payload.school.trim(),
      name: payload.name.trim(),
      studentNumber: payload.studentNumber.trim(),
      loggedInAt: new Date().toISOString(),
    };
    const current = await readSessionWithoutQueue(payload.deviceId);
    const session: CampaignSession = {
      profile,
      progress: options.allowExisting && hasSameServerIdentity(current.profile, profile)
        ? current.progress
        : {},
    };
    users[createStudentKey(profile)] = profile;
    await Promise.all([
      writeEncryptedValue(CAMPAIGN_USERS_KEY, users, payload.deviceId),
      writeEncryptedValue(CAMPAIGN_SESSION_KEY, session, payload.deviceId),
    ]);
    return session;
  });
}

export function saveProgress(deviceId: string, progress: ActivityProgress): Promise<CampaignSession> {
  return enqueueMutation(async () => {
    const current = await readSessionWithoutQueue(deviceId);
    const next = { ...current, progress };
    await writeEncryptedValue(CAMPAIGN_SESSION_KEY, next, deviceId);
    return next;
  });
}

export function markProgress(
  deviceId: string,
  key: keyof ActivityProgress,
  at = new Date().toISOString(),
): Promise<CampaignSession> {
  return enqueueMutation(async () => {
    const current = await readSessionWithoutQueue(deviceId);
    const next = {
      ...current,
      progress: { ...current.progress, [key]: current.progress[key] ?? at },
    };
    await writeEncryptedValue(CAMPAIGN_SESSION_KEY, next, deviceId);
    return next;
  });
}

export function clearCampaignSession() {
  if (canUseStorage()) localStorage.removeItem(CAMPAIGN_SESSION_KEY);
}
