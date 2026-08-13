import type { CampaignTrackId } from '../types';

export function Hero({
  track,
  onSwitchCompetition,
  competitionAction,
  competitionDisabled,
  showCompetitionIcon = false,
  onCompetitionAction,
  showCompetitionAction = true,
}: {
  track: CampaignTrackId;
  onSwitchCompetition: () => void;
  competitionAction?: string;
  competitionDisabled?: boolean;
  showCompetitionIcon?: boolean;
  onCompetitionAction?: () => void;
  showCompetitionAction?: boolean;
}) {
  return (
    <section className={`campaign-hero campaign-hero--${track}`}>
      <div className="hero-copy">
        <h1>智启青年・洞见 <span>AI</span> 未来</h1>
        <p>把握人工智能时代机遇，直面产业变革挑战</p>
        <small>普惠学习体验赛道｜AI 插件创意方案作品征集赛道</small>
        {track === 'learning' ? (
          <button className="pill-button pill-button--black" type="button" onClick={onSwitchCompetition}>
            AI 插件创意作品征集赛道
            <svg
              className="hero-route-icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <mask
                id="hero-route-icon-mask"
                style={{ maskType: 'alpha' }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="24"
                height="24"
              >
                <rect width="24" height="24" fill="#D9D9D9" />
              </mask>
              <g mask="url(#hero-route-icon-mask)">
                <path
                  d="M4 15H20L15.1515 9"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </svg>
          </button>
        ) : showCompetitionAction ? (
          <button
            className="pill-button pill-button--orange pill-button--large"
            type="button"
            disabled={competitionDisabled}
            onClick={onCompetitionAction}
          >
            {showCompetitionIcon ? (
              <svg
                className="upload-icon"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M19.132 1.83984C19.5656 1.63359 20.0695 1.58437 20.5359 1.69453C21.1382 1.83515 21.6679 2.25703 21.9421 2.8125C22.1742 3.26953 22.221 3.81094 22.0968 4.30781C21.0492 9.59531 20.0015 14.8852 18.9562 20.1727C18.8999 20.5008 18.8039 20.8266 18.6187 21.1055C18.4148 21.4266 18.1218 21.6891 17.782 21.8602C17.3835 22.0617 16.9218 22.1297 16.4812 22.057C16.1976 22.0125 15.9281 21.9047 15.6867 21.7523C14.7093 21.1289 13.7249 20.5148 12.7476 19.8914C11.8734 20.625 11.0039 21.3633 10.1296 22.0992C9.9351 22.2609 9.68432 22.3594 9.42885 22.3641C9.17573 22.3711 8.9226 22.2797 8.73041 22.1133C8.48432 21.9023 8.34135 21.5812 8.33198 21.2578V18.5906C8.3226 17.7352 8.32963 16.8773 8.32729 16.0219C8.31791 15.8437 8.32729 15.6469 8.45854 15.5109C10.207 13.6687 11.9601 11.8312 13.7085 9.98672C11.3695 11.8406 9.02807 13.6969 6.68901 15.5531C6.61401 15.6141 6.53666 15.675 6.44291 15.7031C6.30698 15.743 6.15463 15.7266 6.03276 15.6539C4.92182 14.9531 3.81323 14.2477 2.69994 13.5492C2.38823 13.3383 2.13276 13.043 1.97104 12.7031C1.7976 12.3445 1.73198 11.9367 1.77885 11.543C1.83041 11.0789 2.04135 10.6312 2.37182 10.3008C2.54526 10.1227 2.75151 9.97734 2.97416 9.86719C3.39135 9.68203 3.79448 9.46406 4.20463 9.26719C9.18276 6.7875 14.1562 4.3125 19.132 1.83984Z"
                  fill="white"
                />
              </svg>
            ) : null}
            {competitionAction}
          </button>
        ) : null}
      </div>
    </section>
  );
}
