import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CompetitionShowcase } from './CompetitionShowcase';

describe('CompetitionShowcase award actions', () => {
  it('only renders install buttons for the awards stage', () => {
    const showcase = renderToStaticMarkup(<CompetitionShowcase />);
    const awards = renderToStaticMarkup(<CompetitionShowcase awards onInstall={() => undefined} />);

    expect(showcase).not.toContain('安装到ZERO');
    expect(showcase.match(/<article class="showcase-card /g)).toHaveLength(20);
    expect(awards.match(/安装到ZERO/g)).toHaveLength(16);
    expect(awards.match(/<article class="showcase-card /g)).toHaveLength(16);
  });

  it('uses the dedicated Figma install-button class', () => {
    const awards = renderToStaticMarkup(<CompetitionShowcase awards onInstall={() => undefined} />);
    expect(awards.match(/class="showcase-install-button"/g)).toHaveLength(16);
  });

  it('uses the design title and stage-specific compact-card variants', () => {
    const showcase = renderToStaticMarkup(<CompetitionShowcase />);
    const awards = renderToStaticMarkup(<CompetitionShowcase awards />);

    expect(showcase).toContain('<h2>作品展示</h2>');
    expect(showcase).toContain('showcase-card--review');
    expect(awards).toContain('<h2>作品展示</h2>');
    expect(awards).not.toContain('获奖作品公示');
    expect(awards).toContain('showcase-card--awards');
    expect(showcase).toContain('票数排序');
    expect(awards).toContain('票数排序');
  });

  it('links the rules dock to the submission-stage page in both showcase variants', () => {
    const showcase = renderToStaticMarkup(<CompetitionShowcase />);
    const awards = renderToStaticMarkup(<CompetitionShowcase awards />);

    expect(showcase).toContain('href="?stage=submission"');
    expect(showcase).toContain('aria-label="查看活动规则"');
    expect(awards).toContain('href="?stage=submission"');
  });
});
