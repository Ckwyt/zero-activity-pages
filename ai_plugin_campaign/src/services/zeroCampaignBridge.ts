interface ZeroExternalBridge {
  GetSID(hostWindow: Window): string;
  AppCmd(
    sid: string,
    module: string,
    action: string,
    parameter: string,
    extra: string,
    callback: (code: number | string, result: string) => void,
  ): void;
}

interface ZeroAccountInfo {
  qt?: unknown;
}

interface ZeroAccountApi {
  getAccount?: (callback: (accountInfo: unknown) => void) => void;
  [key: string]: unknown;
}

export type ZeroAccountLoginStatus = 'logged-in' | 'logged-out' | 'unavailable';

function getBridge() {
  if (typeof window === 'undefined') return undefined;
  return window.external as unknown as Partial<ZeroExternalBridge>;
}

function getZeroAccountApi() {
  return (globalThis as typeof globalThis & {
    chrome?: { account360?: ZeroAccountApi };
  }).chrome?.account360;
}

/**
 * ZERO 登录信息中的 qt 非空表示账号已登录。
 * 单独导出这个纯函数，便于处理客户端主动调用 loginStatusUpdate(QT) 的场景。
 */
export function isZeroAccountQtLoggedIn(qt: unknown) {
  return typeof qt === 'string' && qt.trim().length > 0;
}

/**
 * 主动查询当前 ZERO 账号登录状态。
 * unavailable 表示网页上下文没有 getAccount 能力、调用异常或客户端未及时回调，
 * 不能把它当作 logged-out，否则会把“无法检测”误判为“未登录”。
 */
export function getZeroAccountLoginStatus(
  accountApi: ZeroAccountApi | null | undefined = getZeroAccountApi(),
  timeoutMs = 3_000,
): Promise<ZeroAccountLoginStatus> {
  const getAccount = accountApi?.getAccount;
  if (typeof getAccount !== 'function') return Promise.resolve('unavailable');

  return new Promise((resolve) => {
    let settled = false;
    const finish = (status: ZeroAccountLoginStatus) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      resolve(status);
    };
    const timer = globalThis.setTimeout(() => finish('unavailable'), timeoutMs);

    try {
      getAccount.call(accountApi, (accountInfo) => {
        const qt = accountInfo && typeof accountInfo === 'object'
          ? (accountInfo as ZeroAccountInfo).qt
          : undefined;
        finish(isZeroAccountQtLoggedIn(qt) ? 'logged-in' : 'logged-out');
      });
    } catch {
      finish('unavailable');
    }
  });
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
  const chromeApi = getZeroAccountApi();
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
