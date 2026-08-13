import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudentLoginPayload } from '../types';
import {
  addAiEduStudent,
  AiEduConfigurationError,
  AiEduApiError,
  encryptWithZeroAccount,
  encryptV8Payload,
  getAiEduErrorMessage,
  normalizeAiEduPayload,
} from './aiEduApi';

const student: StudentLoginPayload = {
  school: '测试大学',
  studentNumber: '20260001',
  name: '测试用户',
  deviceId: '0123456789abcdef0123456789abcdef',
};

describe('AI education student API', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('maps the login form to the documented plaintext JSON with Unix seconds', () => {
    expect(normalizeAiEduPayload(student, () => 1_796_995_200_999)).toEqual({
      ts: 1_796_995_200,
      school: '测试大学',
      edu_no: '20260001',
      user_name: '测试用户',
      mid: '0123456789abcdef0123456789abcdef',
    });
  });

  it('rejects an invalid MID before sending the request', () => {
    expect(() => normalizeAiEduPayload({ ...student, deviceId: 'short-mid' })).toThrow(AiEduApiError);
    expect(() => normalizeAiEduPayload({ ...student, deviceId: '中文设备编号中文设备编号中文设备编号中文设备编号' })).toThrow('设备 ID 无效');
  });

  it('identifies a missing ZERO native encryptor as a configuration error', async () => {
    await expect(addAiEduStudent(student, {
      apiMode: 'production',
      encryptor: (plainText) => encryptWithZeroAccount(plainText, undefined),
    })).rejects.toBeInstanceOf(AiEduConfigurationError);
  });

  it('passes the complete JSON string to ZERO native encryption', async () => {
    const payload = { ts: 1_796_995_200, school: '测试大学' };
    const encryptor = vi.fn(async () => 'native-jb');
    await expect(encryptV8Payload(payload, encryptor)).resolves.toBe('native-jb');
    expect(encryptor).toHaveBeenCalledWith(JSON.stringify(payload));
  });

  it('wraps chrome.account360.OnEncryptValue as a promise', async () => {
    const OnEncryptValue = vi.fn((plainText: string, callback: (value: unknown) => void) => {
      expect(JSON.parse(plainText)).toEqual({ school: '测试大学' });
      callback(' encrypted-by-zero ');
    });
    await expect(encryptWithZeroAccount('{"school":"测试大学"}', { OnEncryptValue }))
      .resolves.toBe('encrypted-by-zero');
    expect(OnEncryptValue).toHaveBeenCalledOnce();
  });

  it('rejects an empty value returned by ZERO native encryption', async () => {
    const OnEncryptValue = (_plainText: string, callback: (value: unknown) => void) => callback('');
    await expect(encryptWithZeroAccount('{}', { OnEncryptValue }))
      .rejects.toThrow('生成学生信息加密参数失败');
  });

  it('posts jb as an URL-encoded form and accepts code 0 / flag 0', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
      const body = init?.body as URLSearchParams;
      expect(body.get('jb')).toBe('bmF0aXZlLWVuY3J5cHRlZC12YWx1ZQ==');
      return new Response(JSON.stringify({ code: 0, msg: 'ok', data: {}, flag: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await expect(addAiEduStudent(student, {
      apiMode: 'production',
      encryptor: async (plainText) => {
        expect(JSON.parse(plainText)).toMatchObject({
          ts: 1_796_995_200,
          school: '测试大学',
          edu_no: '20260001',
          user_name: '测试用户',
          mid: '0123456789abcdef0123456789abcdef',
        });
        return 'bmF0aXZlLWVuY3J5cHRlZC12YWx1ZQ==';
      },
      fetcher,
      now: () => 1_796_995_200_999,
    })).resolves.toMatchObject({ code: 0, flag: 0 });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('maps occupation responses to actionable login errors', async () => {
    const fetcher = vi.fn(async () => new Response(
      JSON.stringify({ code: 6, msg: '学生信息已被占用', data: null, flag: 5 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));
    await expect(addAiEduStudent(student, {
      apiMode: 'production',
      encryptor: async () => 'native-encrypted-value',
      fetcher,
    })).rejects.toMatchObject({ code: 6, flag: 5, message: '该学生信息已被其他设备占用' });
    expect(getAiEduErrorMessage({ code: 6, flag: 6, msg: '' })).toBe('当前设备已绑定其他学生信息');
  });

  it('supports local mock mode without exposing a network side effect', async () => {
    const fetcher = vi.fn();
    await expect(addAiEduStudent(student, { apiMode: 'mock', fetcher })).resolves.toEqual({
      code: 0,
      msg: 'ok',
      data: {},
      flag: 0,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
