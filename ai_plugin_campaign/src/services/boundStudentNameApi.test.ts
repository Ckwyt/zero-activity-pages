import { describe, expect, it, vi } from 'vitest';
import {
  BOUND_STUDENT_NAME_URL,
  BoundStudentNameApiError,
  getBoundStudentName,
  resolveCertificateStudentName,
} from './boundStudentNameApi';

describe('bound student name API', () => {
  it('uses the current ZERO login cookie and sends no request body', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe(BOUND_STUDENT_NAME_URL);
      expect(init).toMatchObject({
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      expect(init?.body).toBeUndefined();
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      return new Response(JSON.stringify({
        code: 0,
        msg: 'ok',
        data: { userName: '测试用户' },
        flag: 0,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    await expect(getBoundStudentName({ fetcher })).resolves.toBe('测试用户');
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('preserves the server name without trimming it', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      code: 0,
      msg: 'ok',
      data: { userName: '   ' },
      flag: 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await expect(getBoundStudentName({ fetcher })).resolves.toBe('   ');
  });

  it('exposes code and flag for business errors', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({
      code: 5,
      msg: '学生信息不存在',
      data: null,
      flag: 2,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    await expect(getBoundStudentName({ fetcher })).rejects.toMatchObject({
      name: 'BoundStudentNameApiError',
      message: '学生信息不存在',
      code: 5,
      flag: 2,
    });
  });

  it.each([
    ['invalid JSON', vi.fn(async () => new Response('not-json', { status: 200 }))],
    ['missing name', vi.fn(async () => new Response(JSON.stringify({
      code: 0,
      msg: 'ok',
      data: {},
      flag: 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))],
    ['HTTP error', vi.fn(async () => new Response('server error', { status: 500 }))],
    ['network error', vi.fn(async () => { throw new TypeError('Failed to fetch'); })],
  ])('rejects %s so the certificate can use its local fallback', async (_scenario, fetcher) => {
    await expect(getBoundStudentName({ fetcher })).rejects.toBeInstanceOf(BoundStudentNameApiError);
  });

  it('aborts a slow request at the client timeout', async () => {
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => (
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      })
    ));

    await expect(getBoundStudentName({ fetcher, timeoutMs: 5 }))
      .rejects.toThrow('获取绑定学生姓名超时');
  });

  it('uses the remote name first and falls back to the local name on any error', async () => {
    await expect(resolveCertificateStudentName(
      '本地姓名',
      async () => '服务端姓名',
    )).resolves.toBe('服务端姓名');

    await expect(resolveCertificateStudentName(
      '本地姓名',
      async () => { throw new Error('not bound'); },
    )).resolves.toBe('本地姓名');
  });
});
