import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ANTI_CHEAT_APP_ID,
  ANTI_CHEAT_SDK_URL,
  initializeAntiCheat,
} from './antiCheat';

describe('anti-cheat analytics integration', () => {
  beforeEach(() => {
    document.head.innerHTML = '<script id="existing-script"></script>';
    delete window.__qa__;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets the documented page fields before adding the SDK script', () => {
    const existingScript = document.getElementById('existing-script');
    const analyticsScript = initializeAntiCheat({
      channelId: ' channel-123 ',
      modid: ' 0123456789abcdef0123456789abcdef ',
    });

    expect(window.__qa__).toEqual({
      app_id: ANTI_CHEAT_APP_ID,
      channel_id: 'channel-123',
      modid: '0123456789abcdef0123456789abcdef',
    });
    expect(window.__qa__).not.toHaveProperty('pv_id');
    expect(analyticsScript?.type).toBe('text/javascript');
    expect(analyticsScript?.async).toBe(true);
    expect(analyticsScript?.src).toBe(ANTI_CHEAT_SDK_URL);
    expect(document.head.firstElementChild).toBe(analyticsScript);
    expect(analyticsScript?.nextElementSibling).toBe(existingScript);
  });

  it('includes a non-empty optional pv_id', () => {
    initializeAntiCheat({ channelId: 'channel', modid: 'mid', pvId: ' pv-001 ' });
    expect(window.__qa__?.pv_id).toBe('pv-001');
  });

  it('loads the SDK only once while allowing page data to refresh', () => {
    const firstScript = initializeAntiCheat({ channelId: 'first', modid: 'mid-1' });
    const secondScript = initializeAntiCheat({ channelId: 'second', modid: 'mid-2' });

    expect(secondScript).toBe(firstScript);
    expect(document.querySelectorAll(`script[src="${ANTI_CHEAT_SDK_URL}"]`)).toHaveLength(1);
    expect(window.__qa__).toMatchObject({ channel_id: 'second', modid: 'mid-2' });
  });

  it('does not throw when analytics.js fails to load', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const analyticsScript = initializeAntiCheat({ channelId: '', modid: '' });

    expect(() => analyticsScript?.dispatchEvent(new Event('error'))).not.toThrow();
    expect(warn).toHaveBeenCalledWith('[Anti-Cheat] analytics.js 加载失败');
  });
});
