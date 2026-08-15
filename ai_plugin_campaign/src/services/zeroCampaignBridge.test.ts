import { beforeEach, describe, expect, it, vi } from 'vitest';

const browserSdk = vi.hoisted(() => ({
  externalGetMID: vi.fn(() => ''),
}));

vi.mock('@q/browser-jssdk', () => browserSdk);

import {
  getChannelId,
  getDeviceId,
  getZeroAccountLoginStatus,
  isZeroAccountQtLoggedIn,
  openZeroUrl,
} from './zeroCampaignBridge';

describe('ZERO device identity', () => {
  it('reads MID with the browser-jssdk method used by newpages', () => {
    browserSdk.externalGetMID.mockReturnValue(' 0123456789abcdef0123456789abcdef ');
    expect(getDeviceId()).toBe('0123456789abcdef0123456789abcdef');
    expect(browserSdk.externalGetMID).toHaveBeenCalledOnce();
  });

  it('returns an empty MID when the SDK bridge is unavailable', () => {
    expect(getDeviceId(() => { throw new Error('bridge unavailable'); })).toBe('');
  });
});

describe('ZERO channel identity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the channel id through feedback.GetPID', async () => {
    const appCmd = vi.fn((
      _sid: string,
      _module: string,
      _action: string,
      _parameter: string,
      _extra: string,
      callback: (code: number, result: string) => void,
    ) => callback(0, ' channel-123 '));

    Object.defineProperty(window, 'external', {
      configurable: true,
      value: {
        GetSID: vi.fn(() => 'test-sid'),
        AppCmd: appCmd,
      },
    });

    await expect(getChannelId()).resolves.toBe('channel-123');
    expect(appCmd).toHaveBeenCalledWith(
      'test-sid',
      'feedback',
      'GetPID',
      '',
      '',
      expect.any(Function),
    );
  });

  it('returns an empty channel id when the native command reports failure', async () => {
    Object.defineProperty(window, 'external', {
      configurable: true,
      value: {
        GetSID: vi.fn(() => 'test-sid'),
        AppCmd: vi.fn((
          _sid: string,
          _module: string,
          _action: string,
          _parameter: string,
          _extra: string,
          callback: (code: number, result: string) => void,
        ) => callback(1, 'invalid-channel')),
      },
    });

    await expect(getChannelId()).resolves.toBe('');
  });

  it('returns an empty channel id when the native bridge is unavailable or times out', async () => {
    Object.defineProperty(window, 'external', { configurable: true, value: {} });
    await expect(getChannelId()).resolves.toBe('');

    Object.defineProperty(window, 'external', {
      configurable: true,
      value: {
        GetSID: vi.fn(() => 'test-sid'),
        AppCmd: vi.fn(),
      },
    });
    await expect(getChannelId(5)).resolves.toBe('');
  });
});

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

  it('does not report a false failure when ZERO opens the page and callbacks with code 1', async () => {
    const appCmd = vi.fn((
      _sid: string,
      _module: string,
      _action: string,
      _parameter: string,
      _extra: string,
      callback: (code: number, result: string) => void,
    ) => callback(1, 'opened'));

    Object.defineProperty(window, 'external', {
      configurable: true,
      value: {
        GetSID: vi.fn(() => 'test-sid'),
        AppCmd: appCmd,
      },
    });

    await expect(openZeroUrl('https://www.zbrowser.cn/PluginHub/')).resolves.toBeUndefined();
    expect(appCmd).toHaveBeenCalledOnce();
  });

  it('still reports synchronous native bridge errors', async () => {
    Object.defineProperty(window, 'external', {
      configurable: true,
      value: {
        GetSID: vi.fn(() => 'test-sid'),
        AppCmd: vi.fn(() => { throw new Error('bridge unavailable'); }),
      },
    });

    await expect(openZeroUrl('https://www.zbrowser.cn/PluginHub/'))
      .rejects.toThrow('bridge unavailable');
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
