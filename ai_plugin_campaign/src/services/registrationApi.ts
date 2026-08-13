import type { RegistrationPayload, RegistrationResult } from '../types';

export class RegistrationValidationError extends Error {
  constructor(public readonly fields: Partial<Record<keyof RegistrationPayload, string>>) {
    super('请检查报名信息');
    this.name = 'RegistrationValidationError';
  }
}

export function validateRegistration(payload: RegistrationPayload) {
  const fields: Partial<Record<keyof RegistrationPayload, string>> = {};

  if (payload.name.trim().length < 2) fields.name = '请填写真实姓名';
  if (!/^1\d{10}$/.test(payload.mobile.trim())) fields.mobile = '请输入 11 位手机号';
  if (payload.organization.trim().length < 2) fields.organization = '请填写学校或所在单位';
  if (!payload.track) fields.track = '请选择参赛赛道';
  if (payload.idea.trim().length < 10) fields.idea = '请用至少 10 个字介绍你的创意';
  if (!payload.acceptedTerms) fields.acceptedTerms = '请阅读并同意活动规则';

  if (Object.keys(fields).length > 0) throw new RegistrationValidationError(fields);
}

export async function submitRegistration(payload: RegistrationPayload): Promise<RegistrationResult> {
  validateRegistration(payload);

  const apiBase = import.meta.env.VITE_CAMPAIGN_API_BASE_URL?.trim();
  const useMock = import.meta.env.VITE_CAMPAIGN_API_MODE === 'mock' || !apiBase;

  if (useMock) {
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    return {
      registrationId: `AI${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      submittedAt: new Date().toISOString(),
    };
  }

  const response = await fetch(`${apiBase.replace(/\/$/, '')}/campaign/registrations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('报名提交失败，请稍后重试');
  return response.json() as Promise<RegistrationResult>;
}
