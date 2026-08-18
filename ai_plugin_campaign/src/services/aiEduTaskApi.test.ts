import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StudentLoginPayload } from '../types';
import {
  AI_EDU_DONE_URL,
  AI_EDU_TASK_KEYS,
  AiEduTaskApiError,
  completeAiEduTask,
  normalizeAiEduTaskPayload,
} from './aiEduTaskApi';

const student: StudentLoginPayload = {
  school: ' 测试大学 ',
  studentNumber: ' 20260001 ',
  name: ' 测试用户 ',
  deviceId: '0123456789abcdef0123456789abcdef',
};

describe('AI education ordinary-task API', () => {
  beforeEach(() => vi.restoreAllMocks());

  it.each(AI_EDU_TASK_KEYS)('accepts and normalizes the %s task', (key) => {
    expect(normalizeAiEduTaskPayload(student, ` ${key.toUpperCase()} `, () => 1_796_995_200_999))
      .toEqual({
        ts: 1_796_995_200,
        school: '测试大学',
        edu_no: '20260001',
        user_name: '测试用户',
        mid: '0123456789abcdef0123456789abcdef',
        key,
      });
  });

  it('posts certificate_claim as plaintext JSON in the jb form field', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe(AI_EDU_DONE_URL);
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
      expect(init?.credentials).toBe('omit');
      expect(JSON.parse((init?.body as URLSearchParams).get('jb') ?? '')).toEqual({
        ts: 1_796_995_200,
        school: '测试大学',
        edu_no: '20260001',
        user_name: '测试用户',
        mid: '0123456789abcdef0123456789abcdef',
        key: 'certificate_claim',
      });
      return new Response(JSON.stringify({
        code: 0,
        msg: 'ok',
        data: { done: true },
        flag: 0,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    await expect(completeAiEduTask(student, 'certificate_claim', {
      apiMode: 'production',
      fetcher,
      now: () => 1_796_995_200_999,
    })).resolves.toMatchObject({ data: { done: true } });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('accepts done=false for a repeated report', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      code: 0,
      msg: 'ok',
      data: { done: false },
      flag: 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await expect(completeAiEduTask(student, 'certificate_claim', {
      apiMode: 'production',
      fetcher,
    })).resolves.toMatchObject({ data: { done: false } });
  });

  it('rejects unsupported task keys before sending a request', () => {
    expect(() => normalizeAiEduTaskPayload(student, 'course_finish')).toThrow(AiEduTaskApiError);
  });

  it('preserves documented business codes on errors', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      code: 9,
      msg: '请求过期',
      data: null,
      flag: 10,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await expect(completeAiEduTask(student, 'certificate_claim', {
      apiMode: 'production',
      fetcher,
    })).rejects.toMatchObject({
      code: 9,
      flag: 10,
      message: '任务上报请求已过期，请重试',
    });
  });

  it('supports explicit mock mode without a network request', async () => {
    const fetcher = vi.fn();
    await expect(completeAiEduTask(student, 'certificate_claim', {
      apiMode: 'mock',
      fetcher,
    })).resolves.toMatchObject({ data: { done: true } });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
