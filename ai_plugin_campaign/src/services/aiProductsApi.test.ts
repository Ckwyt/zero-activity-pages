import { describe, expect, it, vi } from 'vitest';
import {
  AI_PRODUCTS_URL,
  AiProductsApiError,
  createAiProductsUrl,
  getAiProducts,
} from './aiProductsApi';

const product = {
  id: 7,
  qid: 123,
  sessionId: 'external-session',
  fileId: 42,
  school: '示例大学',
  user_name: '张三',
  uid: 'ext-1',
  title: '示例扩展',
  logo: 'https://cdn.example.com/logo.png',
  content: '扩展描述',
  hash: '31b6c412d532a114d994c802b3b3e026df620e25',
  status: 4,
  ver: 3,
  createdAt: 1_786_579_200,
  updatedAt: 1_786_665_600,
};

describe('AI products API', () => {
  it('builds the documented server-side filter and pagination query', () => {
    const url = new URL(createAiProductsUrl({
      kind: 2,
      page: 3,
      size: 20,
      school: ' 示例大学 ',
      key: ' 浏览器 ',
    }));
    expect(`${url.origin}${url.pathname}`).toBe(AI_PRODUCTS_URL);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      kind: '2',
      page: '3',
      size: '20',
      school: '示例大学',
      key: '浏览器',
    });
    expect(createAiProductsUrl({ kind: 2 }, '/api/ai-products'))
      .toBe('/api/ai-products?kind=2&page=1&size=20');
  });

  it('loads and validates an approved product page', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(String(input)).toContain('kind=4');
      expect(init).toMatchObject({
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
      });
      return new Response(JSON.stringify({
        code: 0,
        msg: 'ok',
        data: { list: [product], page: 1, size: 16, total: 1 },
        flag: 0,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });

    await expect(getAiProducts({ kind: 4, size: 16 }, { fetcher })).resolves.toEqual({
      list: [product],
      page: 1,
      size: 16,
      total: 1,
    });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('maps database failures and rejects malformed successful data', async () => {
    const databaseFailure = vi.fn(async () => new Response(JSON.stringify({
      code: 13,
      msg: '内部错误，请稍后重试',
      data: null,
      flag: 19,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await expect(getAiProducts({ kind: 2 }, { fetcher: databaseFailure })).rejects.toMatchObject({
      code: 13,
      flag: 19,
      message: '作品列表加载失败，请稍后重试',
    });

    const malformed = vi.fn(async () => new Response(JSON.stringify({
      code: 0,
      msg: 'ok',
      data: { list: [{ ...product, user_name: undefined }], page: 1, size: 20, total: 1 },
      flag: 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await expect(getAiProducts({ kind: 2 }, { fetcher: malformed })).rejects.toBeInstanceOf(AiProductsApiError);
  });

  it('rejects invalid client parameters before requesting', () => {
    expect(() => createAiProductsUrl({ kind: 2, page: 0 })).toThrow('页码参数不正确');
    expect(() => createAiProductsUrl({ kind: 2, size: 101 })).toThrow('每页数量参数不正确');
    expect(() => createAiProductsUrl({ kind: 2, key: '词'.repeat(65) })).toThrow('搜索关键词不能超过64个字符');
  });
});
