import type { StudentLoginPayload } from '../types';

export const AI_EDU_ADD_URL = 'https://user.zbrowser.cn/v8/ai/edu/add';

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
  protocolKey?: string;
  protocolIv?: string;
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

export class AiEduConfigurationError extends AiEduApiError {
  constructor(message: string, options: { cause?: unknown } = {}) {
    super(message, undefined, undefined, options);
    this.name = 'AiEduConfigurationError';
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

function decodeBase64(value: string) {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch (error) {
    throw new AiEduConfigurationError('V8 加密协议配置格式错误', { cause: error });
  }
}

function decodeProtocolValue(value: string | undefined, label: string) {
  const configured = value?.trim();
  if (!configured) throw new AiEduConfigurationError(`缺少 ${label} 配置`);
  if (configured.startsWith('hex:')) {
    const hex = configured.slice(4);
    if (!hex || hex.length % 2 !== 0 || !/^[\da-f]+$/i.test(hex)) {
      throw new AiEduConfigurationError(`${label} 的 hex 配置无效`);
    }
    return Uint8Array.from(hex.match(/.{2}/g) ?? [], (pair) => Number.parseInt(pair, 16));
  }
  if (configured.startsWith('base64:')) return decodeBase64(configured.slice(7));
  if (configured.startsWith('utf8:')) return new TextEncoder().encode(configured.slice(5));
  return new TextEncoder().encode(configured);
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function encryptV8Payload(
  payload: object,
  protocolKey: string | undefined,
  protocolIv: string | undefined,
) {
  const keyBytes = decodeProtocolValue(protocolKey, 'V8 protocol.key');
  const ivBytes = decodeProtocolValue(protocolIv, 'V8 protocol.iv');
  if (![16, 24, 32].includes(keyBytes.length)) {
    throw new AiEduConfigurationError('V8 protocol.key 必须是 16、24 或 32 字节');
  }
  if (ivBytes.length !== 16) throw new AiEduConfigurationError('V8 protocol.iv 必须是 16 字节');
  if (!globalThis.crypto?.subtle) throw new AiEduApiError('当前浏览器不支持 V8 加密协议');

  try {
    const key = await globalThis.crypto.subtle.importKey('raw', keyBytes, { name: 'AES-CBC' }, false, ['encrypt']);
    const plain = new TextEncoder().encode(JSON.stringify(payload));
    const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'AES-CBC', iv: ivBytes }, key, plain);
    return bytesToBase64(new Uint8Array(encrypted));
  } catch (error) {
    if (error instanceof AiEduApiError) throw error;
    throw new AiEduApiError('生成学生信息加密参数失败', undefined, undefined, { cause: error });
  }
}

export function getAiEduErrorMessage(response: Pick<AiEduAddResponse, 'code' | 'flag' | 'msg'>) {
  const knownMessages: Record<string, string> = {
    '6:5': '该学生信息已被其他设备占用',
    '6:6': '当前设备已绑定其他学生信息',
    '9:10': '登录请求已过期，请重新提交',
    '9:11': '学生信息加密参数缺失，请联系活动管理员',
    '9:12': '学生信息加密参数格式错误，请联系活动管理员',
    '9:13': '学生信息解密失败，请联系活动管理员',
    '9:20': '学生信息不符合要求，请检查后重试',
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
  const mode = options.apiMode ?? import.meta.env.VITE_AI_EDU_API_MODE ?? 'production';
  if (mode === 'mock') return { code: 0, msg: 'ok', data: {}, flag: 0 } satisfies AiEduAddResponse;

  const jb = await encryptV8Payload(
    plain,
    options.protocolKey ?? import.meta.env.VITE_V8_PROTOCOL_KEY,
    options.protocolIv ?? import.meta.env.VITE_V8_PROTOCOL_IV,
  );
  const requestBody = new URLSearchParams({ jb });
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
