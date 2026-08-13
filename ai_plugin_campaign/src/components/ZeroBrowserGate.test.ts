import { describe, expect, it } from 'vitest';
import { isZeroBrowserGateEnabled } from './ZeroBrowserGate';

describe('ZERO browser gate configuration', () => {
  it('enables the gate when the environment variable is missing', () => {
    expect(isZeroBrowserGateEnabled()).toBe(true);
  });

  it('only disables the gate when explicitly configured as off', () => {
    expect(isZeroBrowserGateEnabled('on')).toBe(true);
    expect(isZeroBrowserGateEnabled('off')).toBe(false);
  });
});
