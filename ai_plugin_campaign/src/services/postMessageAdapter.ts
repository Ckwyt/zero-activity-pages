const PROTOCOL_VERSION = '1.0.0';
const DEVICE_INFO_TIMEOUT_MS = 5_000;

export const DeviceInfoMessageType = {
  ready: 'S2P_READY',
  request: 'S2P_REQUEST_DEVICE_INFO',
  response: 'P2S_DEVICE_INFO',
} as const;

export interface ZeroDeviceInfo {
  mid: string;
  mid2: string;
  version: string;
}

interface PostMessageEnvelope {
  version: string;
  type: string;
  data?: unknown;
  requestId?: string;
  timestamp: number;
}

const emptyDeviceInfo: ZeroDeviceInfo = { mid: '', mid2: '', version: '' };

function createMessage(type: string, data?: unknown): PostMessageEnvelope {
  return {
    version: PROTOCOL_VERSION,
    type,
    data,
    timestamp: Date.now(),
  };
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeDeviceInfo(value: unknown): ZeroDeviceInfo {
  if (!value || typeof value !== 'object') return { ...emptyDeviceInfo };
  const data = value as Record<string, unknown>;
  return {
    mid: readString(data.mid),
    mid2: readString(data.mid2),
    version: readString(data.version),
  };
}

/**
 * 告诉 newpages 父页面当前 iframe 已经完成初始化。
 * 父页面收到该消息后才会向 iframe 回传设备信息。
 */
export function notifyParentReady() {
  if (typeof window === 'undefined' || !window.parent) return;
  window.parent.postMessage(createMessage(DeviceInfoMessageType.ready, {
    version: PROTOCOL_VERSION,
    timestamp: Date.now(),
  }), '*');
}

/**
 * 通过 newpages 父页面读取 ZERO 设备信息。
 * 独立打开页面或父页面未响应时，5 秒后按约定返回空字符串。
 */
export function requestDeviceInfo(
  timeoutMs = DEVICE_INFO_TIMEOUT_MS,
): Promise<ZeroDeviceInfo> {
  if (typeof window === 'undefined' || !window.parent) {
    return Promise.resolve({ ...emptyDeviceInfo });
  }

  return new Promise((resolve) => {
    const parentWindow = window.parent;
    const requestId = `requestDeviceInfo_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let settled = false;

    const finish = (deviceInfo: ZeroDeviceInfo) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
      resolve(deviceInfo);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== parentWindow || !event.data || typeof event.data !== 'object') return;
      const message = event.data as Record<string, unknown>;
      if (
        message.type === DeviceInfoMessageType.response
        && message.requestId === requestId
      ) {
        finish(normalizeDeviceInfo(message.data));
      }
    };

    window.addEventListener('message', onMessage);
    const timer = window.setTimeout(() => finish({ ...emptyDeviceInfo }), timeoutMs);

    // 与 skin-center-online 的初始化顺序一致：先通知 ready，再请求设备信息。
    notifyParentReady();
    parentWindow.postMessage(createMessage(DeviceInfoMessageType.request, { requestId }), '*');
  });
}
