import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceInfoMessageType, requestDeviceInfo } from './postMessageAdapter';

describe('ZERO parent device info adapter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('requests MID from newpages and resolves the matching response', async () => {
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const pending = requestDeviceInfo();
    const request = postMessage.mock.calls
      .map(([message]) => message as { type?: string; data?: { requestId?: string } })
      .find((message) => message.type === DeviceInfoMessageType.request);

    expect(postMessage.mock.calls[0][0]).toMatchObject({ type: DeviceInfoMessageType.ready });
    expect(request?.data?.requestId).toMatch(/^requestDeviceInfo_/);

    window.dispatchEvent(new MessageEvent('message', {
      source: window.parent,
      data: {
        type: DeviceInfoMessageType.response,
        requestId: request?.data?.requestId,
        data: {
          mid: ' 0123456789abcdef0123456789abcdef ',
          mid2: 'mid-2',
          version: '2.0.1322.0',
        },
      },
    }));

    await expect(pending).resolves.toEqual({
      mid: '0123456789abcdef0123456789abcdef',
      mid2: 'mid-2',
      version: '2.0.1322.0',
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores responses from another source and returns empty values after 5 seconds', async () => {
    vi.spyOn(window.parent, 'postMessage').mockImplementation(() => undefined);
    const pending = requestDeviceInfo();

    window.dispatchEvent(new MessageEvent('message', {
      source: null,
      data: {
        type: DeviceInfoMessageType.response,
        requestId: 'untrusted-request',
        data: { mid: 'should-not-be-used' },
      },
    }));
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(pending).resolves.toEqual({ mid: '', mid2: '', version: '' });
  });
});
