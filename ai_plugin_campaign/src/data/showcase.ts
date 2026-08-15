export type ShowcasePageItem = number | 'ellipsis-start' | 'ellipsis-end';

export const SHOWCASE_PAGE_SIZE = 20;
export const AWARDS_PAGE_SIZE = 16;
export function getShowcasePageItems(currentPage: number, totalPages: number): ShowcasePageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, 'ellipsis-end', totalPages - 1, totalPages];
  if (currentPage >= totalPages - 2) return [1, 2, 'ellipsis-start', totalPages - 2, totalPages - 1, totalPages];
  return [1, 'ellipsis-start', currentPage, 'ellipsis-end', totalPages];
}
