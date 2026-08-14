import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CompetitionTrack } from './CompetitionTrack';

describe('CompetitionTrack rules action', () => {
  it('shows the rules action by default', () => {
    const markup = renderToStaticMarkup(<CompetitionTrack onRules={() => undefined} />);
    expect(markup).toContain('class="rules-dock"');
    expect(markup).toContain('活动');
  });

  it('can hide the rules action before, during submission, and during initial review', () => {
    const markup = renderToStaticMarkup(
      <CompetitionTrack onRules={() => undefined} showRules={false} />,
    );
    expect(markup).not.toContain('class="rules-dock"');
  });
});
