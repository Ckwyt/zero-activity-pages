import type { CampaignTrackId } from '../types';

export function CampaignHeader({
  activeTrack,
  onChange,
}: {
  activeTrack: CampaignTrackId;
  onChange: (track: CampaignTrackId) => void;
}) {
  return (
    <header className="campaign-header">
      <nav className="campaign-tabs" aria-label="活动赛道">
        <button
          className={activeTrack === 'learning' ? 'is-active' : ''}
          type="button"
          onClick={() => onChange('learning')}
        >
          普惠学习体验赛道
        </button>
        <button
          className={activeTrack === 'competition' ? 'is-active' : ''}
          type="button"
          onClick={() => onChange('competition')}
        >
          AI 插件创意作品征集赛道
        </button>
      </nav>
    </header>
  );
}
