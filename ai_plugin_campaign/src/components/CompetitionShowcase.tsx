import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { schools } from '../data/activity';
import {
  getShowcasePageItems,
  AWARDS_PAGE_SIZE,
  SHOWCASE_PAGE_SIZE,
} from '../data/showcase';
import { getAiProducts, type AiProductsPage } from '../services/aiProductsApi';

const EMPTY_PRODUCT_LOGO = '/assets/figma/showcase/zero-logo.png';

export function CompetitionShowcase({
  awards = false,
  onInstall,
  initialData,
}: {
  awards?: boolean;
  onInstall?: (id: string) => void;
  initialData?: AiProductsPage;
}) {
  const pageSize = awards ? AWARDS_PAGE_SIZE : SHOWCASE_PAGE_SIZE;
  const productKind = awards ? 4 : 2;
  const [school, setSchool] = useState('');
  const [searchText, setSearchText] = useState('');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPage, setProductsPage] = useState<AiProductsPage>(
    () => initialData ?? { list: [], page: 1, size: pageSize, total: 0 },
  );
  const [loading, setLoading] = useState(!initialData);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [schoolListOpen, setSchoolListOpen] = useState(false);
  const [highlightedSchool, setHighlightedSchool] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const schoolSelectRef = useRef<HTMLDivElement>(null);
  const schoolOptions = useMemo(
    () => [{ value: '', label: '请筛选您想选择的学校' }, ...schools.map((item) => ({ value: item, label: item }))],
    [],
  );

  const totalPages = Math.ceil(productsPage.total / pageSize);
  const currentWorks = productsPage.list;
  const pageItems = getShowcasePageItems(currentPage, totalPages);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setKeyword(searchText.trim());
    setCurrentPage(1);
    setReloadToken((current) => current + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setLoadError('');

    getAiProducts({
      kind: productKind,
      page: currentPage,
      size: pageSize,
      school,
      key: keyword,
    }, { signal: controller.signal })
      .then((result) => {
        if (!active) return;
        const responseTotalPages = Math.ceil(result.total / pageSize);
        if (responseTotalPages > 0 && currentPage > responseTotalPages) {
          setCurrentPage(responseTotalPages);
          return;
        }
        setProductsPage(result);
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        setProductsPage({ list: [], page: currentPage, size: pageSize, total: 0 });
        setLoadError(error instanceof Error ? error.message : '作品列表加载失败，请稍后重试');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [currentPage, keyword, pageSize, productKind, reloadToken, school]);

  useEffect(() => {
    if (!schoolListOpen) return undefined;

    function closeWhenClickingOutside(event: PointerEvent) {
      if (!schoolSelectRef.current?.contains(event.target as Node)) setSchoolListOpen(false);
    }

    document.addEventListener('pointerdown', closeWhenClickingOutside);
    return () => document.removeEventListener('pointerdown', closeWhenClickingOutside);
  }, [schoolListOpen]);

  useEffect(() => {
    if (!schoolListOpen) return;
    schoolSelectRef.current
      ?.querySelector<HTMLElement>(`#showcase-school-option-${highlightedSchool}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlightedSchool, schoolListOpen]);

  function selectSchool(nextSchool: string) {
    setSchool(nextSchool);
    setCurrentPage(1);
    setSchoolListOpen(false);
  }

  function handleSchoolKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const selectedIndex = Math.max(0, schoolOptions.findIndex((item) => item.value === school));

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!schoolListOpen) {
        setHighlightedSchool(selectedIndex);
        setSchoolListOpen(true);
        return;
      }
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedSchool((current) => (current + offset + schoolOptions.length) % schoolOptions.length);
      return;
    }
    if (schoolListOpen && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      selectSchool(schoolOptions[highlightedSchool].value);
      return;
    }
    if (schoolListOpen && event.key === 'Home') {
      event.preventDefault();
      setHighlightedSchool(0);
      return;
    }
    if (schoolListOpen && event.key === 'End') {
      event.preventDefault();
      setHighlightedSchool(schoolOptions.length - 1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setSchoolListOpen(false);
    }
  }

  function changePage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), totalPages);
    if (!totalPages || nextPage === currentPage) return;
    setCurrentPage(nextPage);
    requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  return (
    <main
      id="showcase"
      className={`competition-showcase ${awards ? 'competition-showcase--awards' : 'competition-showcase--review'}`}
      ref={sectionRef}
      aria-busy={loading}
    >
      <a
        className="rules-dock competition-showcase__rules"
        href="?stage=submission"
        aria-label="查看活动规则"
      >
        <span>活动<br />规则</span>
      </a>
      <div className="competition-showcase__shell">
        <h2>作品展示</h2>

        <form className="showcase-filters" onSubmit={submitSearch}>
          <div className="showcase-school-select" ref={schoolSelectRef}>
            <span className="sr-only" id="showcase-school-select-label">按学校筛选</span>
            <button
              className={`showcase-school-select__trigger ${school ? '' : 'is-placeholder'}`}
              type="button"
              role="combobox"
              aria-labelledby="showcase-school-select-label"
              aria-controls="showcase-school-options"
              aria-expanded={schoolListOpen}
              aria-haspopup="listbox"
              aria-activedescendant={schoolListOpen ? `showcase-school-option-${highlightedSchool}` : undefined}
              onClick={() => {
                setHighlightedSchool(Math.max(0, schoolOptions.findIndex((item) => item.value === school)));
                setSchoolListOpen((current) => !current);
              }}
              onKeyDown={handleSchoolKeyDown}
            >
              <span>{school || '请筛选您想选择的学校'}</span>
              <img src="/assets/figma/showcase/select-arrow.svg" alt="" />
            </button>
            {schoolListOpen ? (
              <ul
                className="showcase-school-select__options"
                id="showcase-school-options"
                role="listbox"
                aria-labelledby="showcase-school-select-label"
              >
                {schoolOptions.map((item, index) => (
                  <li
                    className={index === highlightedSchool ? 'is-highlighted' : ''}
                    id={`showcase-school-option-${index}`}
                    role="option"
                    aria-selected={school === item.value}
                    key={item.value || 'all-schools'}
                    onClick={() => selectSchool(item.value)}
                    onPointerMove={() => setHighlightedSchool(index)}
                  >
                    <span>{item.label}</span>
                    {school === item.value ? <span className="showcase-school-select__check" aria-hidden="true">✓</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <label className="showcase-search-input">
            <span className="sr-only">搜索作品</span>
            <img src="/assets/figma/showcase/search-icon.svg" alt="" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              maxLength={64}
              placeholder="输入作品名称、姓名、学校搜索"
              type="search"
            />
          </label>
          <button className="showcase-search-button" type="submit" disabled={loading}>搜索</button>
        </form>

        {loading ? (
          <p className="showcase-feedback" role="status">作品加载中...</p>
        ) : loadError ? (
          <div className="showcase-feedback showcase-feedback--error" role="alert">
            <p>{loadError}</p>
            <button type="button" onClick={() => setReloadToken((current) => current + 1)}>重新加载</button>
          </div>
        ) : currentWorks.length ? (
          <div className="showcase-grid">
            {currentWorks.map((work) => (
              <article className={`showcase-card ${awards ? 'showcase-card--awards' : 'showcase-card--review'}`} key={work.id}>
                <div className="showcase-card__cover">
                  <img
                    src={work.logo || EMPTY_PRODUCT_LOGO}
                    alt=""
                    onError={(event) => {
                      if (event.currentTarget.dataset.fallback === 'true') return;
                      event.currentTarget.dataset.fallback = 'true';
                      event.currentTarget.src = EMPTY_PRODUCT_LOGO;
                    }}
                  />
                </div>
                <div className="showcase-card__copy">
                  <h3>{work.title}</h3>
                  <p>{work.content}</p>
                </div>
                {awards ? (
                  <button
                    className="showcase-install-button"
                    type="button"
                    onClick={() => onInstall?.(work.uid || String(work.id))}
                  >
                    安装到ZERO
                  </button>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="showcase-empty">暂未找到符合条件的作品</p>
        )}

        {totalPages > 1 ? (
          <nav className="showcase-pagination" aria-label="作品分页">
            <button
              type="button"
              aria-label="上一页"
              disabled={currentPage === 1}
              onClick={() => changePage(currentPage - 1)}
            >
              <img src="/assets/figma/showcase/pagination-left.svg" alt="" />
            </button>
            {pageItems.map((item) => typeof item === 'number' ? (
              <button
                className={item === currentPage ? 'is-current' : undefined}
                type="button"
                aria-current={item === currentPage ? 'page' : undefined}
                aria-label={`第 ${item} 页`}
                onClick={() => changePage(item)}
                key={item}
              >
                {String(item).padStart(2, '0')}
              </button>
            ) : <span aria-hidden="true" key={item}>…</span>)}
            <button
              type="button"
              aria-label="下一页"
              disabled={currentPage === totalPages}
              onClick={() => changePage(currentPage + 1)}
            >
              <img src="/assets/figma/showcase/pagination-right.svg" alt="" />
            </button>
          </nav>
        ) : null}
      </div>
    </main>
  );
}
