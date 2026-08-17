import type { AiProduct, AiProductsPage, AiProductsQuery } from '../services/aiProductsApi';
import { pluginWorks } from './activity';
import { schools } from './schools';

export type ShowcasePageItem = number | 'ellipsis-start' | 'ellipsis-end';

export const SHOWCASE_PAGE_SIZE = 20;
export const AWARDS_PAGE_SIZE = 16;

const mockAuthors = ['林同学', '陈同学', '许同学', '周同学', '吴同学', '郑同学'];
export const MOCK_SHOWCASE_PRODUCT_COUNT = 48;

export const mockShowcaseProducts: AiProduct[] = Array.from(
  { length: MOCK_SHOWCASE_PRODUCT_COUNT },
  (_, index) => {
    const work = pluginWorks[index % pluginWorks.length];
    const sequence = String(index + 1).padStart(2, '0');
    return {
      id: 900_001 + index,
      qid: 0,
      sessionId: `showcase-mock-${sequence}`,
      fileId: 800_001 + index,
      school: schools[index % schools.length],
      user_name: `${mockAuthors[index % mockAuthors.length]} ${sequence}`,
      uid: `showcase-mock-${sequence}`,
      title: `${work.title} ${sequence}`,
      logo: work.image,
      content: `${work.description}模拟作品编号 ${sequence}。`,
      hash: String(index + 1).padStart(40, '0'),
      status: 2,
      ver: 1,
      createdAt: 1_786_579_200 + index,
      updatedAt: 1_786_665_600 + index,
    };
  },
);

export function getMockShowcasePage(query: AiProductsQuery): AiProductsPage {
  const page = query.page ?? 1;
  const size = query.size ?? SHOWCASE_PAGE_SIZE;
  const school = query.school?.trim() ?? '';
  const keyword = query.key?.trim().toLowerCase() ?? '';
  const filteredProducts = mockShowcaseProducts.filter((product) => {
    if (school && product.school !== school) return false;
    if (!keyword) return true;
    return [product.title, product.content, product.user_name, product.school]
      .some((value) => value.toLowerCase().includes(keyword));
  });
  const start = (page - 1) * size;
  return {
    list: filteredProducts
      .slice(start, start + size)
      .map((product) => ({ ...product, status: query.kind })),
    page,
    size,
    total: filteredProducts.length,
  };
}

export function useMockWhenShowcaseIsEmpty(result: AiProductsPage, query: AiProductsQuery) {
  return result.total === 0 && result.list.length === 0
    ? getMockShowcasePage(query)
    : result;
}

export function getShowcasePageItems(currentPage: number, totalPages: number): ShowcasePageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, 'ellipsis-end', totalPages - 1, totalPages];
  if (currentPage >= totalPages - 2) return [1, 2, 'ellipsis-start', totalPages - 2, totalPages - 1, totalPages];
  return [1, 'ellipsis-start', currentPage, 'ellipsis-end', totalPages];
}
