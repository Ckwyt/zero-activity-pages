export const BOUND_STUDENT_NAME_URL = 'https://user.zbrowser.cn/v7/user/aip-un';

interface BoundStudentNameResponse {
  code: number;
  msg: string;
  data: { userName: string } | null;
  flag: number;
}

interface BoundStudentNameApiOptions {
  apiUrl?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export class BoundStudentNameApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly flag?: number,
    options: { cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'BoundStudentNameApiError';
  }
}

function isBoundStudentNameResponse(value: unknown): value is BoundStudentNameResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  return typeof response.code === 'number'
    && typeof response.flag === 'number'
    && typeof response.msg === 'string'
    && ('data' in response);
}

/**
 * 使用 ZERO 登录 Cookie 查询当前账号绑定的学生姓名。
 * 接口不接收业务参数，姓名按服务端返回值原样使用（包括纯空白姓名）。
 */
export async function getBoundStudentName(options: BoundStudentNameApiOptions = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 5_000;
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await (options.fetcher ?? fetch)(
      options.apiUrl
        ?? import.meta.env.VITE_BOUND_STUDENT_NAME_URL
        ?? BOUND_STUDENT_NAME_URL,
      {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
        signal: controller.signal,
      },
    );
  } catch (error) {
    const message = controller.signal.aborted
      ? '获取绑定学生姓名超时'
      : '获取绑定学生姓名失败';
    throw new BoundStudentNameApiError(message, undefined, undefined, { cause: error });
  } finally {
    globalThis.clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new BoundStudentNameApiError(`获取绑定学生姓名失败（HTTP ${response.status}）`);
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    throw new BoundStudentNameApiError('绑定学生姓名接口返回格式错误', undefined, undefined, { cause: error });
  }

  if (!isBoundStudentNameResponse(result)) {
    throw new BoundStudentNameApiError('绑定学生姓名接口返回格式错误');
  }
  if (result.code !== 0 || result.flag !== 0) {
    throw new BoundStudentNameApiError(
      result.msg || '未获取到绑定学生姓名',
      result.code,
      result.flag,
    );
  }

  const userName = result.data?.userName;
  if (typeof userName !== 'string' || userName.length === 0) {
    throw new BoundStudentNameApiError('绑定学生姓名接口返回格式错误');
  }
  return userName;
}

/** 正式接口不可用或未返回姓名时，证书继续使用当前本地登录姓名。 */
export async function resolveCertificateStudentName(
  localStudentName: string,
  requestName: () => Promise<string> = getBoundStudentName,
) {
  try {
    return await requestName();
  } catch {
    return localStudentName;
  }
}
