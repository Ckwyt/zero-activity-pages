export const AI_EDU_HAS_BIND_URL = 'https://user.zbrowser.cn/v1/ai/edu/has-bind';

export interface AiEduBindingData {
  hasBind: boolean;
  t1: number;
  t6: number;
}

interface AiEduBindingResponse {
  code: number;
  msg: string;
  data: AiEduBindingData | null;
  flag: number;
}

interface AiEduBindingApiOptions {
  apiUrl?: string;
  fetcher?: typeof fetch;
}

export class AiEduBindingApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly flag?: number,
    options: { cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AiEduBindingApiError';
  }
}

function normalizeMid(mid: string) {
  if (!/^[\x00-\x7F]{32}$/.test(mid)) {
    throw new AiEduBindingApiError('当前设备 ID 无效，请使用 ZERO 浏览器重新打开活动页面');
  }
  return mid;
}

function isTimestamp(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isBindingData(value: unknown): value is AiEduBindingData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  return typeof data.hasBind === 'boolean' && isTimestamp(data.t1) && isTimestamp(data.t6);
}

function isBindingResponse(value: unknown): value is AiEduBindingResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  return typeof response.code === 'number'
    && typeof response.flag === 'number'
    && typeof response.msg === 'string'
    && ('data' in response);
}

function getBindingErrorMessage(response: Pick<AiEduBindingResponse, 'code' | 'flag' | 'msg'>) {
  const knownMessages: Record<string, string> = {
    '3:0': '设备信息格式不正确，请使用 ZERO 浏览器重新打开活动页面',
    '13:12': '学习进度查询失败，请稍后重试',
  };
  return knownMessages[`${response.code}:${response.flag}`]
    ?? response.msg?.trim()
    ?? '学习进度查询失败，请稍后重试';
}

export async function getAiEduBinding(mid: string, options: AiEduBindingApiOptions = {}) {
  const requestBody = new URLSearchParams({ jb: JSON.stringify({ mid: normalizeMid(mid) }) });
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(
      options.apiUrl ?? import.meta.env.VITE_AI_EDU_HAS_BIND_URL ?? AI_EDU_HAS_BIND_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: requestBody,
        credentials: 'omit',
      },
    );
  } catch (error) {
    throw new AiEduBindingApiError('学习进度查询失败，请检查网络后重试', undefined, undefined, { cause: error });
  }

  if (!response.ok) throw new AiEduBindingApiError(`学习进度查询失败（HTTP ${response.status}）`);

  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    throw new AiEduBindingApiError('学习进度接口返回格式错误', undefined, undefined, { cause: error });
  }

  if (!isBindingResponse(result)) throw new AiEduBindingApiError('学习进度接口返回格式错误');
  if (result.code !== 0 || result.flag !== 0) {
    throw new AiEduBindingApiError(getBindingErrorMessage(result), result.code, result.flag);
  }
  if (!isBindingData(result.data)) throw new AiEduBindingApiError('学习进度接口返回格式错误');
  return result.data;
}
