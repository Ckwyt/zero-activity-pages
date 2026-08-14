import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudentLoginPayload } from '../types';
import {
  addAiEduStudent,
  AiEduApiError,
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

  it('posts the plaintext JSON in jb to the V1 form endpoint', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe('https://user.zbrowser.cn/v1/ai/edu/add');
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
      const body = init?.body as URLSearchParams;
      expect(JSON.parse(body.get('jb') ?? '')).toEqual({
        ts: 1_796_995_200,
        school: '测试大学',
        edu_no: '20260001',
        user_name: '测试用户',
        mid: '0123456789abcdef0123456789abcdef',
      });
      return new Response(JSON.stringify({ code: 0, msg: 'ok', data: {}, flag: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await expect(addAiEduStudent(student, {
      apiMode: 'production',
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
      fetcher,
    })).rejects.toMatchObject({ code: 6, flag: 5, message: '该学生信息已被其他设备占用' });
    expect(getAiEduErrorMessage({ code: 6, flag: 6, msg: '' })).toBe('本设备已绑定其他账号，请使用原账号登录');
    expect(getAiEduErrorMessage({ code: 3, flag: 0, msg: '参数错误' })).toBe('学生信息格式不正确，请检查后重试');
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

  it('uses the production request path when mock mode is not explicitly enabled', async () => {
    const fetcher = vi.fn(async () => new Response(
      JSON.stringify({ code: 0, msg: 'ok', data: {}, flag: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ));

    await expect(addAiEduStudent(student, {
      apiUrl: 'https://example.test/v1/ai/edu/add',
      fetcher,
    })).resolves.toMatchObject({ code: 0, flag: 0 });

    expect(fetcher).toHaveBeenCalledOnce();
  });
});
