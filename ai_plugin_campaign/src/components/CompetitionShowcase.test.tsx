import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CompetitionShowcase } from './CompetitionShowcase';

describe('CompetitionShowcase award actions', () => {
  it('only renders install buttons for the awards stage', () => {
    const showcase = renderToStaticMarkup(<CompetitionShowcase />);
    const awards = renderToStaticMarkup(<CompetitionShowcase awards onInstall={() => undefined} />);

    expect(showcase).not.toContain('安装到ZERO');
    expect(awards.match(/安装到ZERO/g)).toHaveLength(12);
  });

  it('uses the dedicated Figma install-button class', () => {
    const awards = renderToStaticMarkup(<CompetitionShowcase awards onInstall={() => undefined} />);
    expect(awards.match(/class="showcase-install-button"/g)).toHaveLength(12);
  });

  it('links the rules dock to the submission-stage page in both showcase variants', () => {
    const showcase = renderToStaticMarkup(<CompetitionShowcase />);
    const awards = renderToStaticMarkup(<CompetitionShowcase awards />);

    expect(showcase).toContain('href="?stage=submission"');
    expect(showcase).toContain('aria-label="查看活动规则"');
    expect(awards).toContain('href="?stage=submission"');
  });
});
