import { beforeEach, describe, expect, it, vi } from 'vitest';
import { openZeroUrl } from './zeroCampaignBridge';

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
