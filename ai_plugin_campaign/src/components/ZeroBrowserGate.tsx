import type { ReactNode } from 'react';
import {
  ZERO_BROWSER_DOWNLOAD_URL,
} from '../services/browserEnvironment';
import { useBrowserEnvironment } from '../state/BrowserEnvironmentContext';

/**
 * ZERO 门禁默认开启。只有本地调试等明确场景设置为 off 时才跳过，
 * 避免环境变量缺失导致普通浏览器被意外放行。
 */
export function isZeroBrowserGateEnabled(configuredValue?: string) {
  return configuredValue !== 'off';
}

export function ZeroBrowserGate({ children }: { children: ReactNode }) {
  const environment = useBrowserEnvironment();
  const shouldEnforceGate = isZeroBrowserGateEnabled(import.meta.env.VITE_ZERO_BROWSER_GATE);

  if (!shouldEnforceGate || environment.canUseCampaignFeatures) return children;

  const requiresUpdate = environment.isZeroBrowser && environment.isOutdatedZeroBrowser;

  return (
    <div className="zero-gate">
      <div className="zero-gate__preview" inert aria-hidden="true">{children}</div>
      <div className="zero-gate__backdrop" aria-hidden="true" />
      <section className="zero-gate__card" role="dialog" aria-modal="true" aria-labelledby="zero-gate-title">
        <h1 id="zero-gate-title">
          {requiresUpdate ? (
            <>检测到当前ZERO浏览器版本过低，<br />请先更新ZERO浏览器</>
          ) : (
            <>检测到您当前使用的不是ZERO浏览器，<br />请先下载ZERO浏览器</>
          )}
        </h1>
        <p>
          {requiresUpdate
            ? '当前版本无法完整支持活动签到、AI学习任务和工具体验。更新安装后，活动页面将自动打开，无需重新查找入口。'
            : '本活动的签到、AI学习任务和工具体验均需在ZERO浏览器内完成。下载安装后，活动页面将自动打开，无需重新查找入口。'}
        </p>
        <a className="zero-gate__action" href={ZERO_BROWSER_DOWNLOAD_URL}>
          <img
            className="zero-gate__browser-icon"
            src="/assets/zero-browser-icon.svg"
            alt=""
            aria-hidden="true"
          />
          <span>{requiresUpdate ? '立即更新ZERO浏览器' : '立即下载ZERO浏览器'}</span>
        </a>
        <small>*请务必点击上方按钮完成下载安装，确保学习数据准确记录</small>
      </section>
    </div>
  );
}
