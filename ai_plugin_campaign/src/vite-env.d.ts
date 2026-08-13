/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAMPAIGN_API_BASE_URL?: string;
  readonly VITE_CAMPAIGN_API_MODE?: 'mock' | 'production';
  readonly VITE_ZERO_BROWSER_GATE?: 'on' | 'off';
  readonly VITE_AI_EDU_API_MODE?: 'mock' | 'production';
  readonly VITE_AI_EDU_ADD_URL?: string;
  readonly VITE_V8_PROTOCOL_KEY?: string;
  readonly VITE_V8_PROTOCOL_IV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
