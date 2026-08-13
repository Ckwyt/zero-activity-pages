import type { ActivityProgress, CampaignSession, StudentLoginPayload, StudentProfile } from '../types';

export const CAMPAIGN_SESSION_KEY = 'zero.ai-plugin-campaign.session.v1';
export const CAMPAIGN_USERS_KEY = 'zero.ai-plugin-campaign.users.v1';

const emptySession: CampaignSession = { profile: null, progress: {} };

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
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

export function readCampaignSession(): CampaignSession {
  if (!canUseStorage()) return emptySession;
  const stored = parseJson<CampaignSession | null>(localStorage.getItem(CAMPAIGN_SESSION_KEY), null);
  if (!stored || typeof stored !== 'object') return emptySession;
  return {
    profile: stored.profile ?? null,
    progress: stored.progress ?? {},
  };
}

export function hasDuplicateStudent(payload: StudentLoginPayload) {
  if (!canUseStorage()) return false;
  const users = parseJson<Record<string, StudentProfile>>(localStorage.getItem(CAMPAIGN_USERS_KEY), {});
  return Boolean(users[createStudentKey(payload)]);
}

export function saveStudent(payload: StudentLoginPayload, options: { allowExisting?: boolean } = {}): CampaignSession {
  if (!options.allowExisting && hasDuplicateStudent(payload)) {
    throw new Error('该学生信息已在当前设备登录，请勿重复提交。');
  }
  const profile: StudentProfile = {
    ...payload,
    school: payload.school.trim(),
    name: payload.name.trim(),
    studentNumber: payload.studentNumber.trim(),
    loggedInAt: new Date().toISOString(),
  };
  const current = readCampaignSession();
  const session: CampaignSession = {
    profile,
    progress: options.allowExisting && hasSameServerIdentity(current.profile, profile)
      ? current.progress
      : {},
  };
  if (canUseStorage()) {
    const users = parseJson<Record<string, StudentProfile>>(localStorage.getItem(CAMPAIGN_USERS_KEY), {});
    users[createStudentKey(profile)] = profile;
    localStorage.setItem(CAMPAIGN_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CAMPAIGN_SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function saveProgress(progress: ActivityProgress): CampaignSession {
  const current = readCampaignSession();
  const next = { ...current, progress };
  if (canUseStorage()) localStorage.setItem(CAMPAIGN_SESSION_KEY, JSON.stringify(next));
  return next;
}

export function markProgress(key: keyof ActivityProgress, at = new Date().toISOString()) {
  const current = readCampaignSession();
  return saveProgress({ ...current.progress, [key]: current.progress[key] ?? at });
}

export function clearCampaignSession() {
  if (canUseStorage()) localStorage.removeItem(CAMPAIGN_SESSION_KEY);
}
