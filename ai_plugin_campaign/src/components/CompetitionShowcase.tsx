import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { schools } from '../data/activity';
import {
  filterShowcaseWorks,
  getShowcasePageItems,
  mockShowcaseWorks,
  SHOWCASE_PAGE_SIZE,
} from '../data/showcase';

export function CompetitionShowcase({
  awards = false,
  onInstall,
}: {
  awards?: boolean;
  onInstall?: (id: string) => void;
}) {
  const [school, setSchool] = useState('');
  const [searchText, setSearchText] = useState('');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [schoolListOpen, setSchoolListOpen] = useState(false);
  const [highlightedSchool, setHighlightedSchool] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const schoolSelectRef = useRef<HTMLDivElement>(null);
  const schoolOptions = useMemo(
    () => [{ value: '', label: '请筛选您想选择的学校' }, ...schools.map((item) => ({ value: item, label: item }))],
    [],
  );

  const filteredWorks = useMemo(
    () => filterShowcaseWorks(mockShowcaseWorks, school, keyword),
    [keyword, school],
  );
  const totalPages = Math.ceil(filteredWorks.length / SHOWCASE_PAGE_SIZE);
  const currentWorks = filteredWorks.slice(
    (currentPage - 1) * SHOWCASE_PAGE_SIZE,
    currentPage * SHOWCASE_PAGE_SIZE,
  );
  const pageItems = getShowcasePageItems(currentPage, totalPages);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setKeyword(searchText);
    setCurrentPage(1);
  }

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
    <main id="showcase" className="competition-showcase" ref={sectionRef}>
      <a
        className="rules-dock competition-showcase__rules"
        href="?stage=submission"
        aria-label="查看活动规则"
      >
        <span>活动<br />规则</span>
      </a>
      <div className="competition-showcase__shell">
        <h2>{awards ? '获奖作品公示' : '作品展示'}</h2>

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
              placeholder="输入作品名称、姓名、学院搜索"
              type="search"
            />
          </label>
          <button className="showcase-search-button" type="submit">搜索</button>
        </form>

        {currentWorks.length ? (
          <div className="showcase-grid">
            {currentWorks.map((work) => (
              <article className="showcase-card" key={work.id}>
                <div className="showcase-card__cover">
                  <img src={work.image} alt="" />
                  <span>{work.badge}</span>
                </div>
                <div className="showcase-card__copy">
                  <h3>{work.title}</h3>
                  <p>{work.description}</p>
                </div>
                <footer className={awards ? 'showcase-card__footer--awards' : undefined}>
                  <div className="showcase-card__publisher">
                    <img src="/assets/figma/showcase/zero-logo.png" alt="" />
                    <span>{work.author}</span>
                  </div>
                  {awards ? (
                    <button
                      className="showcase-install-button"
                      type="button"
                      onClick={() => onInstall?.(work.id)}
                    >
                      安装到ZERO
                    </button>
                  ) : null}
                </footer>
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
