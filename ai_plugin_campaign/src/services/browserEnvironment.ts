export interface BrowserEnvironmentCapabilities {
  isZeroBrowser: boolean;
  browserVersion: string;
  isOutdatedZeroBrowser: boolean;
  canUseCampaignFeatures: boolean;
  canUseNativeNavigation: boolean;
  canReadNativeIdentity: boolean;
}

interface BrowserEnvironmentGlobals {
  external?: unknown;
  chrome?: unknown;
}

/**
 * 与 ZERO 扩展中心保持一致的生产最低版本。
 * 活动页涉及原生登录、设备身份和跨页面能力，因此低于此版本时不进入活动。
 */
export const ZERO_BROWSER_MIN_VERSION = '2.0.1322.0';
export const ZERO_BROWSER_DOWNLOAD_URL = 'https://down.zbrowser.cn/ze/zero_setup___extension___setup.exe';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && (typeof value === 'object' || typeof value === 'function')
    ? value as Record<string, unknown>
    : undefined;
}

function hasFunction(record: Record<string, unknown> | undefined, key: string) {
  return typeof record?.[key] === 'function';
}

function compareNumericVersionPart(left: string, right: string) {
  const normalizedLeft = left.replace(/^0+(?=\d)/, '');
  const normalizedRight = right.replace(/^0+(?=\d)/, '');

  if (normalizedLeft.length !== normalizedRight.length) {
    return normalizedLeft.length > normalizedRight.length ? 1 : -1;
  }
  if (normalizedLeft === normalizedRight) return 0;
  return normalizedLeft > normalizedRight ? 1 : -1;
}

/**
 * 纯数字点分版本比较，避免 parseFloat 将 2.0.1322.0 错误处理为 2。
 * 空值、预发布标记和其他非法版本均返回 false。
 */
export function isZeroBrowserVersionSupported(
  version: string,
  minimumVersion = ZERO_BROWSER_MIN_VERSION,
) {
  const currentParts = version.trim().split('.');
  const minimumParts = minimumVersion.trim().split('.');
  if (
    !version.trim()
    || !minimumVersion.trim()
    || currentParts.some((part) => !/^\d+$/.test(part))
    || minimumParts.some((part) => !/^\d+$/.test(part))
  ) {
    return false;
  }

  const partCount = Math.max(currentParts.length, minimumParts.length);
  for (let index = 0; index < partCount; index += 1) {
    const comparison = compareNumericVersionPart(
      currentParts[index] ?? '0',
      minimumParts[index] ?? '0',
    );
    if (comparison !== 0) return comparison > 0;
  }
  return true;
}

function readNativeBrowserVersion(external: Record<string, unknown> | undefined, receiver: unknown) {
  const getVersion = external?.GetVersion;
  if (typeof getVersion !== 'function') return '';

  try {
    // 与 @q/browser-jssdk 一致：获取当前窗口 SID 后读取对应版本。
    const getSid = external?.GetSID;
    const sid = typeof getSid === 'function' ? getSid.call(receiver, globalThis) : undefined;
    const version = getVersion.call(receiver, sid);
    return typeof version === 'string' ? version.trim() : '';
  } catch {
    return '';
  }
}

/**
 * 通过 ZERO 独有的原生桥检测环境，不依赖容易误判或伪造的 userAgent。
 * 普通 Chromium 也可能暴露空的 window.external/window.chrome，必须检查专属能力。
 */
export function detectBrowserEnvironment(
  globals: BrowserEnvironmentGlobals = globalThis as BrowserEnvironmentGlobals,
): BrowserEnvironmentCapabilities {
  const external = asRecord(globals.external);
  const chrome = asRecord(globals.chrome);
  const account360 = asRecord(chrome?.account360);

  const canUseNativeNavigation = hasFunction(external, 'GetSID') && hasFunction(external, 'AppCmd');
  const canReadNativeIdentity = hasFunction(external, 'GetMID') && hasFunction(external, 'GetVersion');
  const browserVersion = readNativeBrowserVersion(external, globals.external);
  const hasAccount360 = Boolean(account360);

  // 兼容较低版本：只有 GetSID/GetVersion，或只注入 account360 时，也可确认是 ZERO。
  const isZeroBrowser = canUseNativeNavigation
    || canReadNativeIdentity
    || hasAccount360
    || Boolean(browserVersion);
  const isOutdatedZeroBrowser = isZeroBrowser
    && Boolean(browserVersion)
    && !isZeroBrowserVersionSupported(browserVersion);

  // 能确认是 ZERO 且没有明确检测到低版本时放行；无法读取版本时不误伤旧客户端。
  const canUseCampaignFeatures = isZeroBrowser && !isOutdatedZeroBrowser;

  console.info('[ZERO Browser Detection]', {
    isZeroBrowser,
    canUseNativeNavigation,
    canReadNativeIdentity,
    hasAccount360,
    browserVersion,
    hasBrowserVersion: Boolean(browserVersion),
    isOutdatedZeroBrowser,
    canUseCampaignFeatures,
  });

  return {
    isZeroBrowser,
    browserVersion,
    isOutdatedZeroBrowser,
    canUseCampaignFeatures,
    canUseNativeNavigation,
    canReadNativeIdentity,
  };
}
