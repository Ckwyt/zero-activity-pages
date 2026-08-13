/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAMPAIGN_API_BASE_URL?: string;
  readonly VITE_CAMPAIGN_API_MODE?: 'mock' | 'production';
  readonly VITE_ZERO_BROWSER_GATE?: 'on' | 'off';
  readonly VITE_AI_EDU_API_MODE?: 'mock' | 'production';
  readonly VITE_AI_EDU_ADD_URL?: string;
  readonly VITE_COURSE_URL?: string;
  readonly VITE_DRIVE_URL?: string;
  readonly VITE_SEARCH_URL?: string;
  readonly VITE_SKIN_URL?: string;
  readonly VITE_PDF_URL?: string;
  readonly VITE_SUMMARY_COURSE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
