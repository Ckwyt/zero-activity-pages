import { describe, expect, it } from 'vitest';
import { isZeroBrowserGateEnabled, readZeroBrowserGateSetting } from './ZeroBrowserGate';

describe('ZERO browser gate configuration', () => {
  it('enables the gate when the environment variable is missing', () => {
    expect(isZeroBrowserGateEnabled()).toBe(true);
  });

  it('only disables the gate when explicitly configured as off', () => {
    expect(isZeroBrowserGateEnabled('on')).toBe(true);
    expect(isZeroBrowserGateEnabled('off')).toBe(false);
  });

  it('lets a valid URL setting override the environment setting', () => {
    expect(isZeroBrowserGateEnabled('on', 'off')).toBe(false);
    expect(isZeroBrowserGateEnabled('off', 'on')).toBe(true);
    expect(isZeroBrowserGateEnabled('on', 'invalid')).toBe(true);
  });

  it('reads zeroGate from route or document query strings', () => {
    expect(readZeroBrowserGateSetting('?zeroGate=off')).toBe('off');
    expect(readZeroBrowserGateSetting('?stage=showcase', '?zeroGate=on')).toBe('on');
    expect(readZeroBrowserGateSetting('?zeroGate=invalid')).toBeUndefined();
  });
});
