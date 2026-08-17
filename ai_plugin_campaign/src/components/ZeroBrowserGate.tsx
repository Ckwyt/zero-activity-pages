import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ZERO_BROWSER_DOWNLOAD_URL,
} from '../services/browserEnvironment';
import { readStaticPreview } from '../services/staticPreview';
import { readLastValidParameter } from '../services/urlParameters';
import { useBrowserEnvironment } from '../state/BrowserEnvironmentContext';

const zeroGateSettings = ['on', 'off'] as const;
type ZeroGateSetting = typeof zeroGateSettings[number];

function normalizeGateSetting(value: string | null | undefined): ZeroGateSetting | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'on' || normalized === 'off' ? normalized : undefined;
}

export function readZeroBrowserGateSetting(...searchValues: Array<string | undefined>) {
  return readLastValidParameter('zeroGate', zeroGateSettings, ...searchValues);
}

/**
 * URL 参数优先于环境变量：?zeroGate=off 临时关闭，?zeroGate=on 开启。
 * 未传 URL 参数时门禁默认开启，只有环境变量明确设置为 off 时才跳过。
 */
export function isZeroBrowserGateEnabled(configuredValue?: string, urlSetting?: string) {
  const normalizedUrlSetting = normalizeGateSetting(urlSetting);
  if (normalizedUrlSetting) return normalizedUrlSetting === 'on';
  return normalizeGateSetting(configuredValue) !== 'off';
}

export function ZeroBrowserGate({ children }: { children: ReactNode }) {
  const environment = useBrowserEnvironment();
  const location = useLocation();
  const preview = readStaticPreview(
    window.location.search,
    window.location.hash,
    location.search,
  );
  const urlSetting = readZeroBrowserGateSetting(window.location.search, location.search);
  const shouldEnforceGate = preview === 'browser-gate'
    || (!preview && isZeroBrowserGateEnabled(
      import.meta.env.VITE_ZERO_BROWSER_GATE,
      urlSetting,
    ));

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
            src="assets/zero-browser-icon.svg"
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
