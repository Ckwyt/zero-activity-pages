import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LearningTrack } from './LearningTrack';

function renderLearningTrack(forceAllUnlocked = false, certificateNameLoading = false) {
  return renderToStaticMarkup(
    <LearningTrack
      progress={{}}
      t1={0}
      t6={0}
      forceAllUnlocked={forceAllUnlocked}
      certificateNameLoading={certificateNameLoading}
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

  it('disables the certificate action while the bound name is loading', () => {
    const markup = renderLearningTrack(true, true);
    expect(markup).toContain('正在获取姓名...');
    expect(markup).toContain('disabled=""');
  });
});
