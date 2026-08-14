import { describe, expect, it } from 'vitest';
import { parseFlexibleSearch, readLastValidParameter } from './urlParameters';

describe('campaign URL parameters', () => {
  it('reads two standard parameters joined with an ampersand', () => {
    const params = parseFlexibleSearch('?stage=initial-review&zeroGate=off');
    expect(params.get('stage')).toBe('initial-review');
    expect(params.get('zeroGate')).toBe('off');
  });

  it('tolerates repeated question marks', () => {
    const params = parseFlexibleSearch('?stage=initial-review?zeroGate=off');
    expect(params.get('stage')).toBe('initial-review');
    expect(params.get('zeroGate')).toBe('off');
  });

  it('uses the last valid repeated value', () => {
    expect(readLastValidParameter(
      'stage',
      ['initial-review', 'submission'] as const,
      '?stage=initial-review?stage=initial-review&zeroGate=off&stage=submission',
    )).toBe('submission');
  });
});
