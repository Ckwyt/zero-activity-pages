import { describe, expect, it, vi } from 'vitest';
import type { CampaignSession, StudentLoginPayload } from '../types';
import { submitStudentLogin } from './studentLogin';

const student: StudentLoginPayload = {
  school: '测试大学',
  studentNumber: '20260001',
  name: '测试用户',
  deviceId: '0123456789abcdef0123456789abcdef',
};

const savedSession: CampaignSession = {
  profile: { ...student, loggedInAt: '2026-08-14T00:00:00.000Z' },
  progress: {},
};

describe('student login persistence order', () => {
  it('does not write local student information when the API fails', async () => {
    const addStudent = vi.fn(async () => {
      throw new Error('学生信息已被占用');
    });
    const saveLocalStudent = vi.fn(async () => savedSession);

    await expect(submitStudentLogin(student, {
      addStudent,
      saveLocalStudent,
    })).rejects.toThrow('学生信息已被占用');

    expect(addStudent).toHaveBeenCalledOnce();
    expect(saveLocalStudent).not.toHaveBeenCalled();
  });

  it('writes local student information only after the API succeeds', async () => {
    const callOrder: string[] = [];
    const addStudent = vi.fn(async () => {
      callOrder.push('api-success');
      return { code: 0, msg: 'ok', data: {}, flag: 0 };
    });
    const saveLocalStudent = vi.fn(async () => {
      callOrder.push('local-save');
      return savedSession;
    });

    await expect(submitStudentLogin(student, {
      addStudent,
      saveLocalStudent,
    })).resolves.toBe(savedSession);

    expect(callOrder).toEqual(['api-success', 'local-save']);
    expect(saveLocalStudent).toHaveBeenCalledWith(student, { allowExisting: true });
  });
});
