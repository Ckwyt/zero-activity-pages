import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { AiProduct, AiProductsPage } from '../services/aiProductsApi';
import { CompetitionShowcase } from './CompetitionShowcase';

function createProduct(index: number, status: number): AiProduct {
  return {
    id: index,
    qid: 100 + index,
    sessionId: `session-${index}`,
    fileId: 200 + index,
    school: '示例大学',
    user_name: `学生${index}`,
    uid: `ext-${index}`,
    title: `示例扩展${index}`,
    logo: `https://cdn.example.com/logo-${index}.png`,
    content: `扩展描述${index}`,
    hash: String(index).padStart(40, '0'),
    status,
    ver: 1,
    createdAt: 1_786_579_200,
    updatedAt: 1_786_665_600,
  };
}

function createPage(size: number, status: number): AiProductsPage {
  return {
    list: Array.from({ length: size }, (_, index) => createProduct(index + 1, status)),
    page: 1,
    size,
    total: size,
  };
}

const reviewPage = createPage(20, 2);
const awardsPage = createPage(16, 4);

describe('CompetitionShowcase award actions', () => {
  it('only renders install buttons for the awards stage', () => {
    const showcase = renderToStaticMarkup(<CompetitionShowcase initialData={reviewPage} />);
    const awards = renderToStaticMarkup(<CompetitionShowcase awards initialData={awardsPage} onInstall={() => undefined} />);

    expect(showcase).not.toContain('安装到ZERO');
    expect(showcase.match(/<article class="showcase-card /g)).toHaveLength(20);
    expect(awards.match(/安装到ZERO/g)).toHaveLength(16);
    expect(awards.match(/<article class="showcase-card /g)).toHaveLength(16);
  });

  it('uses the dedicated Figma install-button class', () => {
    const awards = renderToStaticMarkup(<CompetitionShowcase awards initialData={awardsPage} onInstall={() => undefined} />);
    expect(awards.match(/class="showcase-install-button"/g)).toHaveLength(16);
  });

  it('uses the design title and stage-specific compact-card variants', () => {
    const showcase = renderToStaticMarkup(<CompetitionShowcase initialData={reviewPage} />);
    const awards = renderToStaticMarkup(<CompetitionShowcase awards initialData={awardsPage} />);

    expect(showcase).toContain('<h2>作品展示</h2>');
    expect(showcase).toContain('showcase-card--review');
    expect(awards).toContain('<h2>作品展示</h2>');
    expect(awards).not.toContain('获奖作品公示');
    expect(awards).toContain('showcase-card--awards');
    expect(showcase).not.toContain('票数排序');
    expect(awards).not.toContain('票数排序');
  });

  it('links the rules dock to the submission-stage page in both showcase variants', () => {
    const showcase = renderToStaticMarkup(<CompetitionShowcase initialData={reviewPage} />);
    const awards = renderToStaticMarkup(<CompetitionShowcase awards initialData={awardsPage} />);

    expect(showcase).toContain('href="?stage=submission"');
    expect(showcase).toContain('aria-label="查看活动规则"');
    expect(awards).toContain('href="?stage=submission"');
  });

  it('keeps the rules link inside the static GitHub preview', () => {
    const showcase = renderToStaticMarkup(
      <CompetitionShowcase initialData={reviewPage} staticMode />,
    );

    expect(showcase).toContain('href="#/?preview=rules"');
  });

  it('uses API fields for the card logo, title and content', () => {
    const showcase = renderToStaticMarkup(<CompetitionShowcase initialData={{
      ...reviewPage,
      list: [createProduct(1, 2)],
      total: 1,
    }} />);
    expect(showcase).toContain('src="https://cdn.example.com/logo-1.png"');
    expect(showcase).toContain('<h3>示例扩展1</h3>');
    expect(showcase).toContain('<p>扩展描述1</p>');
  });
});
