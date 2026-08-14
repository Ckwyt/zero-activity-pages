import { describe, expect, it } from 'vitest';
import {
  filterShowcaseWorks,
  getShowcasePageItems,
  AWARDS_PAGE_SIZE,
  mockShowcaseWorks,
  SHOWCASE_PAGE_SIZE,
  SHOWCASE_TOTAL_PAGES,
} from './showcase';

describe('showcase mock catalog', () => {
  it('provides twelve complete pages of deterministic mock data', () => {
    expect(SHOWCASE_PAGE_SIZE).toBe(20);
    expect(AWARDS_PAGE_SIZE).toBe(16);
    expect(mockShowcaseWorks).toHaveLength(SHOWCASE_TOTAL_PAGES * SHOWCASE_PAGE_SIZE);
    expect(new Set(mockShowcaseWorks.map((work) => work.id)).size).toBe(mockShowcaseWorks.length);
  });

  it('filters by school and searches title, student name or college', () => {
    const schoolResults = filterShowcaseWorks(mockShowcaseWorks, '清华大学', '');
    expect(schoolResults.length).toBeGreaterThan(SHOWCASE_PAGE_SIZE);
    expect(schoolResults.every((work) => work.school === '清华大学')).toBe(true);

    const target = mockShowcaseWorks[37];
    expect(filterShowcaseWorks(mockShowcaseWorks, '', target.studentName)).toContainEqual(target);
    expect(filterShowcaseWorks(mockShowcaseWorks, target.school, target.college)).toContainEqual(target);
    expect(filterShowcaseWorks(mockShowcaseWorks, '', '建筑设计').length).toBeGreaterThan(0);
  });

  it('builds compact pagination around the current page', () => {
    expect(getShowcasePageItems(1, 12)).toEqual([1, 2, 3, 'ellipsis-end', 11, 12]);
    expect(getShowcasePageItems(6, 12)).toEqual([1, 'ellipsis-start', 6, 'ellipsis-end', 12]);
    expect(getShowcasePageItems(12, 12)).toEqual([1, 2, 'ellipsis-start', 10, 11, 12]);
  });
});
