import { describe, expect, it } from 'vitest';
import type { RegistrationPayload } from '../types';
import { RegistrationValidationError, submitRegistration, validateRegistration } from './registrationApi';

const validPayload: RegistrationPayload = {
  name: '林川',
  mobile: '13800138000',
  organization: '未来大学',
  track: 'plugin',
  idea: '一个能理解浏览上下文并自动整理信息的智能插件。',
  acceptedTerms: true,
};

describe('registrationApi', () => {
  it('rejects incomplete registration data', () => {
    expect(() => validateRegistration({ ...validPayload, mobile: '123' })).toThrow(RegistrationValidationError);
  });

  it('returns a registration id in mock mode', async () => {
    const result = await submitRegistration(validPayload);
    expect(result.registrationId).toMatch(/^AI\d{4}-[A-Z0-9]{6}$/);
  });
});
