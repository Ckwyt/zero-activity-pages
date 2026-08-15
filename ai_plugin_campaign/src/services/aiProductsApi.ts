export const AI_PRODUCTS_URL = 'https://cloud.zbrowser.cn/v1/ai/products';

export type AiProductKind = 2 | 4;

export interface AiProduct {
  id: number;
  qid: number;
  sessionId: string;
  fileId: number;
  school: string;
  user_name: string;
  uid: string;
  title: string;
  logo: string;
  content: string;
  hash: string;
  status: number;
  ver: number;
  createdAt: number;
  updatedAt: number;
}

export interface AiProductsPage {
  list: AiProduct[];
  page: number;
  size: number;
  total: number;
}

export interface AiProductsQuery {
  kind: AiProductKind;
  page?: number;
  size?: number;
  school?: string;
  key?: string;
}

interface AiProductsResponse {
  code: number;
  msg: string;
  data: AiProductsPage | null;
  flag: number;
}

interface AiProductsApiOptions {
  apiUrl?: string;
  fetcher?: typeof fetch;
  signal?: AbortSignal;
}

export class AiProductsApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly flag?: number,
    options: { cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AiProductsApiError';
  }
}

function characterLength(value: string) {
  return Array.from(value).length;
}

function requireInteger(value: number, name: string, minimum: number, maximum: number) {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new AiProductsApiError(`${name}参数不正确`);
  }
  return value;
}

function isNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isProduct(value: unknown): value is AiProduct {
  if (!value || typeof value !== 'object') return false;
  const product = value as Record<string, unknown>;
  return isNumber(product.id)
    && isNumber(product.qid)
    && typeof product.sessionId === 'string'
    && isNumber(product.fileId)
    && typeof product.school === 'string'
    && typeof product.user_name === 'string'
    && typeof product.uid === 'string'
    && typeof product.title === 'string'
    && typeof product.logo === 'string'
    && typeof product.content === 'string'
    && typeof product.hash === 'string'
    && isNumber(product.status)
    && isNumber(product.ver)
    && isNumber(product.createdAt)
    && isNumber(product.updatedAt);
}

function isProductsPage(value: unknown): value is AiProductsPage {
  if (!value || typeof value !== 'object') return false;
  const page = value as Record<string, unknown>;
  return Array.isArray(page.list)
    && page.list.every(isProduct)
    && isNumber(page.page)
    && isNumber(page.size)
    && isNumber(page.total);
}

function isProductsResponse(value: unknown): value is AiProductsResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  return typeof response.code === 'number'
    && typeof response.flag === 'number'
    && typeof response.msg === 'string'
    && ('data' in response);
}

export function createAiProductsUrl(query: AiProductsQuery, apiUrl = AI_PRODUCTS_URL) {
  const page = requireInteger(query.page ?? 1, '页码', 1, 1_000_000);
  const size = requireInteger(query.size ?? 20, '每页数量', 1, 100);
  if (query.kind !== 2 && query.kind !== 4) throw new AiProductsApiError('审核类型参数不正确');

  const school = query.school?.trim() ?? '';
  const key = query.key?.trim() ?? '';
  if (characterLength(school) > 64) throw new AiProductsApiError('学校名称不能超过64个字符');
  if (characterLength(key) > 64) throw new AiProductsApiError('搜索关键词不能超过64个字符');

  const isAbsoluteUrl = /^https?:\/\//i.test(apiUrl);
  const url = new URL(apiUrl, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  url.searchParams.set('kind', String(query.kind));
  url.searchParams.set('page', String(page));
  url.searchParams.set('size', String(size));
  if (school) url.searchParams.set('school', school);
  if (key) url.searchParams.set('key', key);
  return isAbsoluteUrl ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

export async function getAiProducts(query: AiProductsQuery, options: AiProductsApiOptions = {}) {
  const url = createAiProductsUrl(
    query,
    options.apiUrl ?? import.meta.env.VITE_AI_PRODUCTS_URL ?? AI_PRODUCTS_URL,
  );
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new AiProductsApiError('作品列表加载失败，请检查网络后重试', undefined, undefined, { cause: error });
  }

  if (!response.ok) throw new AiProductsApiError(`作品列表加载失败（HTTP ${response.status}）`);

  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    throw new AiProductsApiError('作品列表接口返回格式错误', undefined, undefined, { cause: error });
  }

  if (!isProductsResponse(result)) throw new AiProductsApiError('作品列表接口返回格式错误');
  if (result.code !== 0 || result.flag !== 0) {
    const message = result.code === 13 && result.flag === 19
      ? '作品列表加载失败，请稍后重试'
      : result.msg?.trim() || '作品列表查询失败';
    throw new AiProductsApiError(message, result.code, result.flag);
  }
  if (!isProductsPage(result.data)) throw new AiProductsApiError('作品列表接口返回格式错误');
  return result.data;
}
