import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyParentDeviceInfo,
  detectBrowserEnvironment,
  type BrowserEnvironmentCapabilities,
} from '../services/browserEnvironment';
import { requestDeviceInfo } from '../services/postMessageAdapter';

const BrowserEnvironmentContext = createContext<BrowserEnvironmentCapabilities | null>(null);

export function BrowserEnvironmentProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: BrowserEnvironmentCapabilities;
}) {
  const nativeEnvironment = useMemo(() => value ?? detectBrowserEnvironment(), [value]);
  const [environment, setEnvironment] = useState(nativeEnvironment);

  useEffect(() => {
    let active = true;
    setEnvironment(nativeEnvironment);
    if (value || nativeEnvironment.canUseCampaignFeatures) return () => { active = false; };

    // iframe 页面没有 window.external，通过 newpages 父页面返回的设备信息确认 ZERO 环境。
    void requestDeviceInfo().then((deviceInfo) => {
      if (active) setEnvironment(applyParentDeviceInfo(nativeEnvironment, deviceInfo));
    });
    return () => {
      active = false;
    };
  }, [nativeEnvironment, value]);

  return (
    <BrowserEnvironmentContext.Provider value={environment}>
      {children}
    </BrowserEnvironmentContext.Provider>
  );
}

export function useBrowserEnvironment() {
  return useContext(BrowserEnvironmentContext) ?? detectBrowserEnvironment();
}
