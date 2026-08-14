import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LearningTrack } from './LearningTrack';

function renderLearningTrack(forceAllUnlocked = false) {
  return renderToStaticMarkup(
    <LearningTrack
      progress={{}}
      t1={0}
      t6={0}
      forceAllUnlocked={forceAllUnlocked}
      onLearn={() => undefined}
      onMockAiInteraction={() => undefined}
      onAction={() => undefined}
      onCertificate={() => undefined}
    />,
  );
}

describe('LearningTrack preview gate', () => {
  it('keeps the first course action enabled while server-gated actions are disabled', () => {
    const markup = renderLearningTrack();
    expect(markup.match(/disabled=""/g)).toHaveLength(6);
    expect(markup).toContain('>去学习并互动</button>');
  });

  it('enables every learning action in all-unlocked preview mode', () => {
    const markup = renderLearningTrack(true);
    expect(markup).not.toContain('disabled=""');
    expect(markup).toContain('倒计时：已解锁');
  });
});
