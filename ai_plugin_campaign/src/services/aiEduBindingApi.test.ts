import { describe, expect, it, vi } from 'vitest';
import {
  AI_EDU_HAS_BIND_URL,
  AiEduBindingApiError,
  getAiEduBinding,
} from './aiEduBindingApi';

const mid = '0123456789abcdef0123456789abcdef';

describe('AI education binding API', () => {
  it('queries the documented form endpoint with the current MID', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe(AI_EDU_HAS_BIND_URL);
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
      expect(JSON.parse((init?.body as URLSearchParams).get('jb') ?? '')).toEqual({ mid });
      return new Response(JSON.stringify({
        code: 0,
        msg: 'ok',
        data: { hasBind: true, t1: 1_796_995_200, t6: 1_797_600_000 },
        flag: 0,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    await expect(getAiEduBinding(mid, { fetcher })).resolves.toEqual({
      hasBind: true,
      t1: 1_796_995_200,
      t6: 1_797_600_000,
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('accepts a successful unbound response with zero task timestamps', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      code: 0,
      msg: 'ok',
      data: { hasBind: false, t1: 0, t6: 0 },
      flag: 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await expect(getAiEduBinding(mid, { fetcher })).resolves.toEqual({ hasBind: false, t1: 0, t6: 0 });
  });

  it('rejects invalid MIDs before sending a request', async () => {
    const fetcher = vi.fn();
    await expect(getAiEduBinding('short-mid', { fetcher })).rejects.toBeInstanceOf(AiEduBindingApiError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('maps Pika failures to a retryable progress error', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      code: 13,
      msg: '内部错误，请稍后重试',
      data: null,
      flag: 12,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await expect(getAiEduBinding(mid, { fetcher })).rejects.toMatchObject({
      code: 13,
      flag: 12,
      message: '学习进度查询失败，请稍后重试',
    });
  });
});
