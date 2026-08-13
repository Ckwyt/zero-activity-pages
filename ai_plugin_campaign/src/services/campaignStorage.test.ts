import { beforeEach, describe, expect, it } from 'vitest';
import {
  CAMPAIGN_SESSION_KEY,
  CAMPAIGN_USERS_KEY,
  createStudentKey,
  hasDuplicateStudent,
  markProgress,
  readCampaignSession,
  saveStudent,
} from './campaignStorage';
import type { CampaignSession } from '../types';

const student = {
  school: '未来大学',
  name: '林川',
  studentNumber: '2026001',
  deviceId: '0123456789abcdef0123456789abcdef',
};

function expectEncryptedStorage(storageKey: string) {
  const raw = localStorage.getItem(storageKey);
  expect(raw).not.toBeNull();
  expect(raw).not.toContain(student.name);
  expect(raw).not.toContain(student.studentNumber);
  expect(JSON.parse(raw ?? '')).toMatchObject({ v: 1, alg: 'A256GCM' });
}

describe('campaign encrypted local storage', () => {
  beforeEach(() => localStorage.clear());

  it('builds the duplicate key from all four user dimensions', () => {
    expect(createStudentKey(student)).toBe(`未来大学::林川::2026001::${student.deviceId}`);
  });

  it('encrypts the session and student history and can read them back', async () => {
    expect(await hasDuplicateStudent(student)).toBe(false);
    await saveStudent(student);

    expectEncryptedStorage(CAMPAIGN_SESSION_KEY);
    expectEncryptedStorage(CAMPAIGN_USERS_KEY);
    expect(await readCampaignSession(student.deviceId)).toMatchObject({ profile: student });
    expect(await hasDuplicateStudent(student)).toBe(true);
    await expect(saveStudent(student)).rejects.toThrow('请勿重复提交');
  });

  it('uses authenticated encryption so tampered data cannot be decrypted', async () => {
    await saveStudent(student);
    const envelope = JSON.parse(localStorage.getItem(CAMPAIGN_SESSION_KEY) ?? '');
    envelope.data = `${envelope.data.slice(0, -2)}AA`;
    localStorage.setItem(CAMPAIGN_SESSION_KEY, JSON.stringify(envelope));

    await expect(readCampaignSession(student.deviceId)).rejects.toThrow('解密失败');
  });

  it('migrates a legacy plaintext session to encrypted storage when first read', async () => {
    const legacySession: CampaignSession = {
      profile: { ...student, loggedInAt: '2026-08-13T00:00:00.000Z' },
      progress: { courseOpenedAt: '2026-08-13T01:00:00.000Z' },
    };
    localStorage.setItem(CAMPAIGN_SESSION_KEY, JSON.stringify(legacySession));

    expect(await readCampaignSession(student.deviceId)).toEqual(legacySession);
    expectEncryptedStorage(CAMPAIGN_SESSION_KEY);
  });

  it('migrates the legacy plaintext student history during initialization', async () => {
    const legacyProfile = { ...student, loggedInAt: '2026-08-13T00:00:00.000Z' };
    localStorage.setItem(CAMPAIGN_USERS_KEY, JSON.stringify({
      [createStudentKey(student)]: legacyProfile,
    }));

    await readCampaignSession(student.deviceId);
    expectEncryptedStorage(CAMPAIGN_USERS_KEY);
    expect(await hasDuplicateStudent(student)).toBe(true);
  });

  it('allows an API-confirmed student to refresh the local session and retain progress', async () => {
    await saveStudent(student);
    await markProgress(student.deviceId, 'courseOpenedAt', '2026-08-13T00:00:00.000Z');
    await expect(saveStudent({ ...student, name: '林川同学' }, { allowExisting: true })).resolves.toBeDefined();
    const stored = await readCampaignSession(student.deviceId);
    expect(stored.profile?.name).toBe('林川同学');
    expect(stored.progress.courseOpenedAt).toBe('2026-08-13T00:00:00.000Z');
    expectEncryptedStorage(CAMPAIGN_SESSION_KEY);
  });
});
