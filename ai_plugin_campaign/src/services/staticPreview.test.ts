import { describe, expect, it } from 'vitest';
import {
  isCompetitionPreview,
  readStaticPreview,
  staticPreviewViews,
} from './staticPreview';

describe('staticPreview', () => {
  it('reads preview values from normal and hash-router URLs', () => {
    expect(readStaticPreview('?preview=learning-locked')).toBe('learning-locked');
    expect(readStaticPreview('#/?preview=competition-awards')).toBe('competition-awards');
  });

  it('ignores unknown values and lets the last valid value win', () => {
    expect(readStaticPreview('?preview=unknown')).toBeUndefined();
    expect(readStaticPreview(
      '?preview=learning-locked',
      '#/?preview=competition-showcase',
    )).toBe('competition-showcase');
  });

  it('classifies all competition-like views', () => {
    expect(isCompetitionPreview('competition-before')).toBe(true);
    expect(isCompetitionPreview('rules')).toBe(true);
    expect(isCompetitionPreview('submission-ended')).toBe(true);
    expect(isCompetitionPreview('certificate')).toBe(false);
    expect(staticPreviewViews).toHaveLength(12);
  });
});
