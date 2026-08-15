export const ANTI_CHEAT_APP_ID = '327';
export const ANTI_CHEAT_SDK_URL =
  'https://s.ssl.qhres2.com/pkg/anti_captcha/analytics/1.5.0/analytics.js';

const ANTI_CHEAT_SCRIPT_ID = 'zero-anti-cheat-analytics';

export interface AntiCheatOptions {
  channelId: string;
  modid: string;
  pvId?: string;
}

export interface AntiCheatPageData {
  app_id: string;
  channel_id: string;
  modid: string;
  pv_id?: string;
}

declare global {
  interface Window {
    __qa__?: AntiCheatPageData;
  }
}

/**
 * 按反作弊接入文档预置页面参数，并异步加载 analytics SDK。
 * 方法可重复调用：参数会刷新，但 SDK 脚本始终只插入一次。
 */
export function initializeAntiCheat({ channelId, modid, pvId }: AntiCheatOptions) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

  const pageData: AntiCheatPageData = {
    app_id: ANTI_CHEAT_APP_ID,
    channel_id: channelId.trim(),
    modid: modid.trim(),
  };
  const normalizedPvId = pvId?.trim();
  if (normalizedPvId) pageData.pv_id = normalizedPvId;

  // analytics.js 执行时会读取这个全局对象，因此必须先赋值再插入脚本。
  window.__qa__ = pageData;

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script#${ANTI_CHEAT_SCRIPT_ID}`,
  );
  if (existingScript) return existingScript;

  const analyticsScript = document.createElement('script');
  analyticsScript.id = ANTI_CHEAT_SCRIPT_ID;
  analyticsScript.type = 'text/javascript';
  analyticsScript.async = true;
  analyticsScript.src = ANTI_CHEAT_SDK_URL;
  analyticsScript.addEventListener(
    'error',
    () => console.warn('[Anti-Cheat] analytics.js 加载失败'),
    { once: true },
  );

  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(analyticsScript, firstScript);
  } else {
    (document.head || document.documentElement).appendChild(analyticsScript);
  }

  return analyticsScript;
}
