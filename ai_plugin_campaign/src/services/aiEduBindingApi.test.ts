import { describe, expect, it, vi } from 'vitest';
import {
  AI_EDU_HAS_BIND_URL,
  DEFAULT_AI_EDU_BINDING,
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

  it('uses zero defaults for invalid MIDs without sending a request', async () => {
    const fetcher = vi.fn();
    await expect(getAiEduBinding('short-mid', { fetcher })).resolves.toEqual(DEFAULT_AI_EDU_BINDING);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('uses zero defaults for business errors', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      code: 13,
      msg: '内部错误，请稍后重试',
      data: null,
      flag: 12,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await expect(getAiEduBinding(mid, { fetcher })).resolves.toEqual(DEFAULT_AI_EDU_BINDING);
  });

  it.each([
    ['network failure', vi.fn(async () => { throw new TypeError('Failed to fetch'); })],
    ['HTTP failure', vi.fn(async () => new Response('server error', { status: 500 }))],
    ['invalid JSON', vi.fn(async () => new Response('not-json', { status: 200 }))],
  ])('uses zero defaults for %s', async (_scenario, fetcher) => {
    await expect(getAiEduBinding(mid, { fetcher })).resolves.toEqual(DEFAULT_AI_EDU_BINDING);
  });

  it.each([
    [{ hasBind: true }, { hasBind: true, t1: 0, t6: 0 }],
    [{ hasBind: true, t1: 123 }, { hasBind: true, t1: 0, t6: 0 }],
    [{ hasBind: true, t1: 123, t6: null }, { hasBind: true, t1: 0, t6: 0 }],
    [{ hasBind: true, t1: -1, t6: 456 }, { hasBind: true, t1: 0, t6: 0 }],
  ])('sets both timestamps to zero when either timestamp is unavailable: %o', async (data, expected) => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      code: 0,
      msg: 'ok',
      data,
      flag: 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await expect(getAiEduBinding(mid, { fetcher })).resolves.toEqual(expected);
  });
});
