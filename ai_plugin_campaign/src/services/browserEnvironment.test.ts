import { describe, expect, it, vi } from 'vitest';
import {
  detectBrowserEnvironment,
  isZeroBrowserVersionSupported,
} from './browserEnvironment';

describe('ZERO browser environment detection', () => {
  it('does not mistake empty Chromium globals for ZERO', () => {
    expect(detectBrowserEnvironment({ external: {}, chrome: {} })).toEqual({
      isZeroBrowser: false,
      browserVersion: '',
      isOutdatedZeroBrowser: false,
      canUseCampaignFeatures: false,
      canUseNativeNavigation: false,
      canReadNativeIdentity: false,
    });
  });

  it('does not mistake an empty account360 object for ZERO', () => {
    expect(detectBrowserEnvironment({ chrome: { account360: {} } })).toMatchObject({
      isZeroBrowser: false,
      canUseCampaignFeatures: false,
    });
  });

  it('compares dotted ZERO versions against the minimum', () => {
    expect(isZeroBrowserVersionSupported('2.0.1322.0')).toBe(true);
    expect(isZeroBrowserVersionSupported('2.0.1322.1')).toBe(true);
    expect(isZeroBrowserVersionSupported('2.1')).toBe(true);
    expect(isZeroBrowserVersionSupported('2.0.1321.999')).toBe(false);
    expect(isZeroBrowserVersionSupported('1.99.9999.9999')).toBe(false);
    expect(isZeroBrowserVersionSupported('invalid')).toBe(false);
    expect(isZeroBrowserVersionSupported('')).toBe(false);
  });

  it('detects a supported ZERO native bridge', () => {
    expect(detectBrowserEnvironment({
      external: {
        GetSID: vi.fn(() => 'zero-sid'),
        AppCmd: vi.fn(),
        GetMID: vi.fn(),
        GetVersion: vi.fn(() => '2.0.1322.0'),
      },
      chrome: { account360: { getAccount: vi.fn() } },
    })).toEqual({
      isZeroBrowser: true,
      browserVersion: '2.0.1322.0',
      isOutdatedZeroBrowser: false,
      canUseCampaignFeatures: true,
      canUseNativeNavigation: true,
      canReadNativeIdentity: true,
    });
  });

  it('detects an outdated ZERO bridge and passes the SID to GetVersion', () => {
    const getVersion = vi.fn((sid: unknown) => sid === 'zero-sid' ? '2.0.1321.9' : '');
    expect(detectBrowserEnvironment({
      external: {
        GetSID: vi.fn(() => 'zero-sid'),
        GetVersion: getVersion,
      },
    })).toEqual({
      isZeroBrowser: true,
      browserVersion: '2.0.1321.9',
      isOutdatedZeroBrowser: true,
      canUseCampaignFeatures: false,
      canUseNativeNavigation: false,
      canReadNativeIdentity: false,
    });
    expect(getVersion).toHaveBeenCalledWith('zero-sid');
  });

  it('recognizes ZERO account bridge when the version is unavailable', () => {
    expect(detectBrowserEnvironment({ chrome: { account360: { getAccount: vi.fn() } } })).toEqual({
      isZeroBrowser: true,
      browserVersion: '',
      isOutdatedZeroBrowser: false,
      canUseCampaignFeatures: true,
      canUseNativeNavigation: false,
      canReadNativeIdentity: false,
    });
  });
});
