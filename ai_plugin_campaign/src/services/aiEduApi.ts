import type { StudentLoginPayload } from '../types';

export const AI_EDU_ADD_URL = 'https://user.zbrowser.cn/v1/ai/edu/add';

export interface AiEduAddResponse {
  code: number;
  msg: string;
  data: Record<string, unknown> | null;
  flag: number;
}

interface AiEduPlainPayload {
  ts: number;
  school: string;
  edu_no: string;
  user_name: string;
  mid: string;
}

interface AiEduApiOptions {
  apiMode?: 'mock' | 'production';
  apiUrl?: string;
  fetcher?: typeof fetch;
  now?: () => number;
}

export class AiEduApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly flag?: number,
    options: { cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AiEduApiError';
  }
}

function characterLength(value: string) {
  return Array.from(value).length;
}

export function normalizeAiEduPayload(
  payload: StudentLoginPayload,
  now = () => Date.now(),
): AiEduPlainPayload {
  const normalized = {
    ts: Math.floor(now() / 1000),
    school: payload.school.trim(),
    edu_no: payload.studentNumber.trim(),
    user_name: payload.name.trim(),
    mid: payload.deviceId.trim(),
  };

  if (!normalized.school) throw new AiEduApiError('请选择学校');
  if (characterLength(normalized.school) > 64) throw new AiEduApiError('学校名称不能超过 64 个字符');
  if (!normalized.edu_no) throw new AiEduApiError('请输入学号');
  if (characterLength(normalized.edu_no) > 64) throw new AiEduApiError('学号不能超过 64 个字符');
  if (!normalized.user_name) throw new AiEduApiError('请输入姓名');
  if (characterLength(normalized.user_name) > 16) throw new AiEduApiError('姓名不能超过 16 个字符');
  if (!/^[\x00-\x7F]{32}$/.test(normalized.mid)) {
    throw new AiEduApiError('当前设备 ID 无效，请使用 ZERO 浏览器重新打开活动页面');
  }

  return normalized;
}

export function getAiEduErrorMessage(response: Pick<AiEduAddResponse, 'code' | 'flag' | 'msg'>) {
  const knownMessages: Record<string, string> = {
    '3:0': '学生信息格式不正确，请检查后重试',
    '6:5': '该学生信息已被其他设备占用',
    '6:6': '当前设备已绑定其他学生信息',
    '9:10': '登录请求已过期，请重新提交',
    '9:3': '学生信息状态已变化，请重新提交',
    '13:8': '学生信息查询失败，请稍后重试',
    '13:9': '学生信息更新失败，请稍后重试',
    '13:10': '学生信息添加失败，请稍后重试',
  };
  return knownMessages[`${response.code}:${response.flag}`]
    ?? response.msg?.trim()
    ?? '学生信息提交失败，请稍后重试';
}

function isAiEduResponse(value: unknown): value is AiEduAddResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  return typeof response.code === 'number'
    && typeof response.flag === 'number'
    && typeof response.msg === 'string'
    && ('data' in response);
}

export async function addAiEduStudent(payload: StudentLoginPayload, options: AiEduApiOptions = {}) {
  const plain = normalizeAiEduPayload(payload, options.now);
  // 本地开发默认使用 mock；V1 正式接口直接接收明文 JSON 字符串，无需客户端加密。
  const mode = options.apiMode
    ?? import.meta.env.VITE_AI_EDU_API_MODE
    ?? (import.meta.env.DEV ? 'mock' : 'production');
  if (mode === 'mock') return { code: 0, msg: 'ok', data: {}, flag: 0 } satisfies AiEduAddResponse;

  const requestBody = new URLSearchParams({ jb: JSON.stringify(plain) });
  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(
      options.apiUrl ?? import.meta.env.VITE_AI_EDU_ADD_URL ?? AI_EDU_ADD_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: requestBody,
        credentials: 'omit',
      },
    );
  } catch (error) {
    throw new AiEduApiError('学生信息提交失败，请检查网络后重试', undefined, undefined, { cause: error });
  }

  if (!response.ok) throw new AiEduApiError(`学生信息提交失败（HTTP ${response.status}）`);
  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    throw new AiEduApiError('学生信息接口返回格式错误', undefined, undefined, { cause: error });
  }
  if (!isAiEduResponse(result)) throw new AiEduApiError('学生信息接口返回格式错误');
  if (result.code !== 0 || result.flag !== 0) {
    throw new AiEduApiError(getAiEduErrorMessage(result), result.code, result.flag);
  }
  return result;
}
