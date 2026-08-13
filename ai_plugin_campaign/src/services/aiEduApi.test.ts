import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudentLoginPayload } from '../types';
import {
  addAiEduStudent,
  AiEduApiError,
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

  it('creates Base64 AES-CBC data that decrypts back to the original JSON', async () => {
    const payload = { ts: 1_796_995_200, school: '测试大学' };
    const keyBytes = new TextEncoder().encode('1234567890abcdef');
    const ivBytes = new TextEncoder().encode('abcdef1234567890');
    const jb = await encryptV8Payload(payload, 'utf8:1234567890abcdef', 'utf8:abcdef1234567890');
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['decrypt']);
    const ciphertext = Uint8Array.from(atob(jb), (character) => character.charCodeAt(0));
    const plain = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: ivBytes }, key, ciphertext);
    expect(JSON.parse(new TextDecoder().decode(plain))).toEqual(payload);
  });

  it('posts jb as an URL-encoded form and accepts code 0 / flag 0', async () => {
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
      const body = init?.body as URLSearchParams;
      expect(body.get('jb')).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
      return new Response(JSON.stringify({ code: 0, msg: 'ok', data: {}, flag: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await expect(addAiEduStudent(student, {
      apiMode: 'production',
      protocolKey: 'utf8:1234567890abcdef',
      protocolIv: 'utf8:abcdef1234567890',
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
      protocolKey: 'utf8:1234567890abcdef',
      protocolIv: 'utf8:abcdef1234567890',
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
