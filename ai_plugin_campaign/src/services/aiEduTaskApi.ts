import type { StudentLoginPayload } from '../types';
import { normalizeAiEduPayload } from './aiEduApi';

export const AI_EDU_DONE_URL = 'https://user.zbrowser.cn/v1/ai/edu/done';

export const AI_EDU_TASK_KEYS = [
  'ai_first_chat',
  'search_once',
  'change_skin',
  'advanced_feature',
  'certificate_claim',
] as const;

export type AiEduTaskKey = typeof AI_EDU_TASK_KEYS[number];

export interface AiEduTaskResponse {
  code: number;
  msg: string;
  data: { done: boolean } | null;
  flag: number;
}

interface AiEduTaskApiOptions {
  apiMode?: 'mock' | 'production';
  apiUrl?: string;
  fetcher?: typeof fetch;
  now?: () => number;
}

export class AiEduTaskApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly flag?: number,
    options: { cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'AiEduTaskApiError';
  }
}

export function normalizeAiEduTaskPayload(
  student: StudentLoginPayload,
  key: string,
  now = () => Date.now(),
) {
  const normalizedKey = key.trim().toLowerCase();
  if (!AI_EDU_TASK_KEYS.includes(normalizedKey as AiEduTaskKey)) {
    throw new AiEduTaskApiError('不支持的普通任务');
  }
  return {
    ...normalizeAiEduPayload(student, now),
    key: normalizedKey as AiEduTaskKey,
  };
}

function isAiEduTaskResponse(value: unknown): value is AiEduTaskResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  return typeof response.code === 'number'
    && typeof response.flag === 'number'
    && typeof response.msg === 'string'
    && ('data' in response);
}

function getAiEduTaskErrorMessage(
  response: Pick<AiEduTaskResponse, 'code' | 'flag' | 'msg'>,
) {
  const knownMessages: Record<string, string> = {
    '3:0': '任务上报参数格式不正确',
    '3:11': '当前任务不支持通过普通任务接口上报',
    '5:2': '未找到当前学生，请重新登录',
    '9:4': '当前设备与学生绑定设备不一致',
    '9:10': '任务上报请求已过期，请重试',
    '13:8': '任务状态查询失败，请稍后重试',
    '13:11': '任务状态更新失败，请稍后重试',
  };
  return knownMessages[`${response.code}:${response.flag}`]
    ?? response.msg?.trim()
    ?? '任务上报失败，请稍后重试';
}

export async function completeAiEduTask(
  student: StudentLoginPayload,
  key: AiEduTaskKey,
  options: AiEduTaskApiOptions = {},
) {
  const payload = normalizeAiEduTaskPayload(student, key, options.now);
  const mode = options.apiMode
    ?? import.meta.env.VITE_AI_EDU_API_MODE
    ?? 'production';
  if (mode === 'mock') {
    return { code: 0, msg: 'ok', data: { done: true }, flag: 0 } satisfies AiEduTaskResponse;
  }

  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(
      options.apiUrl ?? import.meta.env.VITE_AI_EDU_DONE_URL ?? AI_EDU_DONE_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ jb: JSON.stringify(payload) }),
        credentials: 'omit',
      },
    );
  } catch (error) {
    throw new AiEduTaskApiError(
      '任务上报失败，请检查网络后重试',
      undefined,
      undefined,
      { cause: error },
    );
  }

  if (!response.ok) throw new AiEduTaskApiError(`任务上报失败（HTTP ${response.status}）`);

  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    throw new AiEduTaskApiError('任务接口返回格式错误', undefined, undefined, { cause: error });
  }

  if (!isAiEduTaskResponse(result)) throw new AiEduTaskApiError('任务接口返回格式错误');
  if (result.code !== 0 || result.flag !== 0) {
    throw new AiEduTaskApiError(
      getAiEduTaskErrorMessage(result),
      result.code,
      result.flag,
    );
  }
  if (!result.data || typeof result.data.done !== 'boolean') {
    throw new AiEduTaskApiError('任务接口返回格式错误');
  }
  return result;
}
