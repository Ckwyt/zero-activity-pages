import { describe, expect, it } from 'vitest';
import {
  parseFlexibleSearch,
  readLastValidParameter,
  readLearningPreviewSetting,
} from './urlParameters';

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

  it('enables the all-unlocked learning preview from query or hash parameters', () => {
    expect(readLearningPreviewSetting('?zeroGate=off&learningPreview=all')).toBe('all');
    expect(readLearningPreviewSetting('?zeroGate=off', '#/?learningPreview=ALL')).toBe('all');
    expect(readLearningPreviewSetting('?learningPreview=invalid')).toBeUndefined();
  });
});
