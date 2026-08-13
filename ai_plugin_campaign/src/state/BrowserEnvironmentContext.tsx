import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  detectBrowserEnvironment,
  type BrowserEnvironmentCapabilities,
} from '../services/browserEnvironment';

const BrowserEnvironmentContext = createContext<BrowserEnvironmentCapabilities | null>(null);

export function BrowserEnvironmentProvider({
  children,
  value,
}: {
  children: ReactNode;
  value?: BrowserEnvironmentCapabilities;
}) {
  // ZERO 原生桥会在页面模块脚本执行前注入，应用生命周期内检测一次即可。
  const environment = useMemo(() => value ?? detectBrowserEnvironment(), [value]);
  return (
    <BrowserEnvironmentContext.Provider value={environment}>
      {children}
    </BrowserEnvironmentContext.Provider>
  );
}

export function useBrowserEnvironment() {
  return useContext(BrowserEnvironmentContext) ?? detectBrowserEnvironment();
}
