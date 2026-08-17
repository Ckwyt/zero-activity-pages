import { readLastValidParameter } from './urlParameters';

export const staticPreviewViews = [
  'learning-locked',
  'learning-unlocked',
  'competition-before',
  'competition-submission',
  'competition-review',
  'competition-showcase',
  'competition-awards',
  'login',
  'rules',
  'submission-ended',
  'certificate',
  'browser-gate',
] as const;

export type StaticPreviewView = typeof staticPreviewViews[number];

/**
 * 静态预览只控制页面展示，不读取本地活动数据，也不请求业务接口。
 * GitHub Pages 使用 HashRouter，因此同时兼容 `?preview=...` 与 `#/?preview=...`。
 */
export function readStaticPreview(...searchValues: Array<string | undefined>) {
  return readLastValidParameter('preview', staticPreviewViews, ...searchValues);
}

export function getCurrentStaticPreview() {
  if (typeof window === 'undefined') return undefined;
  return readStaticPreview(window.location.search, window.location.hash);
}

export function isCompetitionPreview(view: StaticPreviewView | undefined) {
  return view?.startsWith('competition-')
    || view === 'rules'
    || view === 'submission-ended';
}
