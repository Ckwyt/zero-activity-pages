import { describe, expect, it } from 'vitest';
import {
  getMockShowcasePage,
  getShowcasePageItems,
  mockShowcaseProducts,
  useMockWhenShowcaseIsEmpty,
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

  it('uses local showcase works when the API returns an empty page', () => {
    const fallback = useMockWhenShowcaseIsEmpty(
      { list: [], page: 1, size: SHOWCASE_PAGE_SIZE, total: 0 },
      { kind: 2, page: 1, size: SHOWCASE_PAGE_SIZE },
    );

    expect(fallback.list).toHaveLength(mockShowcaseProducts.length);
    expect(fallback.total).toBe(mockShowcaseProducts.length);
    expect(fallback.list.every((product) => product.status === 2)).toBe(true);
  });

  it('keeps school and keyword filters when showing mock works', () => {
    const target = mockShowcaseProducts[0];
    const fallback = getMockShowcasePage({
      kind: 4,
      page: 1,
      size: AWARDS_PAGE_SIZE,
      school: target.school,
      key: target.title,
    });

    expect(fallback.list).toHaveLength(1);
    expect(fallback.list[0]).toMatchObject({
      title: target.title,
      school: target.school,
      status: 4,
    });
  });

  it('does not replace a non-empty API page', () => {
    const realPage = {
      list: [{ ...mockShowcaseProducts[0], id: 1, title: '真实作品' }],
      page: 1,
      size: SHOWCASE_PAGE_SIZE,
      total: 1,
    };

    expect(useMockWhenShowcaseIsEmpty(realPage, { kind: 2 })).toBe(realPage);
  });
});
