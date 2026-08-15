import { describe, expect, it } from 'vitest';
import {
  getShowcasePageItems,
  AWARDS_PAGE_SIZE,
  SHOWCASE_PAGE_SIZE,
} from './showcase';

describe('showcase pagination presentation', () => {
  it('keeps the stage-specific server page sizes', () => {
    expect(SHOWCASE_PAGE_SIZE).toBe(20);
    expect(AWARDS_PAGE_SIZE).toBe(16);
  });

  it('builds compact pagination around the current page', () => {
    expect(getShowcasePageItems(1, 12)).toEqual([1, 2, 3, 'ellipsis-end', 11, 12]);
    expect(getShowcasePageItems(6, 12)).toEqual([1, 'ellipsis-start', 6, 'ellipsis-end', 12]);
    expect(getShowcasePageItems(12, 12)).toEqual([1, 2, 'ellipsis-start', 10, 11, 12]);
  });
});
