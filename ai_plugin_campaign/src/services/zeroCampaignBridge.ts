interface ZeroExternalBridge {
  GetSID(hostWindow: Window): string;
  GetMID(): string;
  AppCmd(
    sid: string,
    module: string,
    action: string,
    parameter: string,
    extra: string,
    callback: (code: number | string, result: string) => void,
  ): void;
}

function getBridge() {
  if (typeof window === 'undefined') return undefined;
  return window.external as unknown as Partial<ZeroExternalBridge>;
}

export function getDeviceId() {
  const bridge = getBridge();
  if (typeof bridge?.GetMID === 'function') {
    try {
      const mid = bridge.GetMID();
      if (typeof mid === 'string' && mid.trim()) return mid.trim();
    } catch {
      // A stable local id keeps desktop preview usable when the native bridge fails.
    }
  }
  const key = 'zero.ai-plugin-campaign.preview-device-id';
  const stored = localStorage.getItem(key);
  if (stored && /^[\x00-\x7F]{32}$/.test(stored)) return stored;
  const uuid = crypto.randomUUID?.().replaceAll('-', '');
  const random = Array.from(crypto.getRandomValues(new Uint8Array(16)), (value) => value.toString(16).padStart(2, '0')).join('');
  const generated = (uuid || random).slice(0, 32).padEnd(32, '0');
  localStorage.setItem(key, generated);
  return generated;
}

export function openZeroUrl(url: string) {
  const bridge = getBridge();
  if (typeof bridge?.GetSID === 'function' && typeof bridge.AppCmd === 'function') {
    const getSid = bridge.GetSID;
    const appCmd = bridge.AppCmd;
    return new Promise<void>((resolve, reject) => {
      try {
        const sid = getSid.call(bridge, window);
        appCmd.call(bridge, sid, '', 'main.openurl', url, '', (code) => {
          if (code === 0 || code === '0') resolve();
          else reject(new Error(`ZERO 打开页面失败（${String(code)}）`));
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return Promise.resolve();
}

export function requestZeroAccountLogin() {
  const chromeApi = (globalThis as typeof globalThis & {
    chrome?: { account360?: Record<string, unknown> };
  }).chrome?.account360;
  const candidates = ['showLogin', 'login', 'openLoginPanel', 'showLoginPanel'];
  for (const key of candidates) {
    const method = chromeApi?.[key];
    if (typeof method === 'function') {
      try {
        method.call(chromeApi);
        return true;
      } catch {
        // Try the next verified injected method.
      }
    }
  }
  window.dispatchEvent(new CustomEvent('zero-campaign:request-account-login'));
  return false;
}

export function dispatchZeroCampaignAction(action: string, detail: Record<string, unknown> = {}) {
  window.dispatchEvent(new CustomEvent('zero-campaign:action', { detail: { action, ...detail } }));
}
