import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getZeroAccountLoginStatus,
  isZeroAccountQtLoggedIn,
  openZeroUrl,
} from './zeroCampaignBridge';

describe('ZERO campaign URL navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('passes a ZERO protocol URL unchanged to main.openurl', async () => {
    const appCmd = vi.fn((
      _sid: string,
      _module: string,
      _action: string,
      _parameter: string,
      _extra: string,
      callback: (code: number, result: string) => void,
    ) => callback(0, 'opened'));

    Object.defineProperty(window, 'external', {
      configurable: true,
      value: {
        GetSID: vi.fn(() => 'test-sid'),
        AppCmd: appCmd,
      },
    });

    await expect(openZeroUrl('zero://newtab?openSearchEngine=1')).resolves.toBeUndefined();
    expect(appCmd).toHaveBeenCalledWith(
      'test-sid',
      '',
      'main.openurl',
      'zero://newtab?openSearchEngine=1',
      '',
      expect.any(Function),
    );
  });

  it('opens a new browser window when the ZERO native bridge is unavailable', async () => {
    Object.defineProperty(window, 'external', { configurable: true, value: {} });
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const url = 'https://www.zbrowser.cn/share/?s=1fSSWYKnmM1qLUKrfxGjHL';

    await expect(openZeroUrl(url)).resolves.toBeUndefined();
    expect(open).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
  });
});

describe('ZERO account login detection', () => {
  it('recognizes only a non-empty qt as logged in', () => {
    expect(isZeroAccountQtLoggedIn('Q=foo; T=bar')).toBe(true);
    expect(isZeroAccountQtLoggedIn('   ')).toBe(false);
    expect(isZeroAccountQtLoggedIn(undefined)).toBe(false);
  });

  it('returns logged-in when getAccount supplies a non-empty qt', async () => {
    const getAccount = vi.fn((callback: (accountInfo: unknown) => void) => {
      callback({ qt: 'Q=foo; T=bar', qid: '123' });
    });

    await expect(getZeroAccountLoginStatus({ getAccount })).resolves.toBe('logged-in');
    expect(getAccount).toHaveBeenCalledOnce();
  });

  it('returns logged-out when getAccount supplies no login credential', async () => {
    const getAccount = (callback: (accountInfo: unknown) => void) => callback({ qt: '' });
    await expect(getZeroAccountLoginStatus({ getAccount })).resolves.toBe('logged-out');
  });

  it('returns unavailable when the page cannot access getAccount', async () => {
    await expect(getZeroAccountLoginStatus(null)).resolves.toBe('unavailable');
    await expect(getZeroAccountLoginStatus({})).resolves.toBe('unavailable');
  });

  it('returns unavailable when getAccount does not callback before timeout', async () => {
    const getAccount = vi.fn();
    await expect(getZeroAccountLoginStatus({ getAccount }, 5)).resolves.toBe('unavailable');
  });
});
