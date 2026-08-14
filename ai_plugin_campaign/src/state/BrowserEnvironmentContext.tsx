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
  // 与 newpages 一致，直接读取当前页面中的 ZERO 原生桥能力。
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
