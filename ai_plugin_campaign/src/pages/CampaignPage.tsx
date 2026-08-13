import { useEffect, useMemo, useState } from 'react';
import { CampaignHeader } from '../components/CampaignHeader';
import { CertificateModal } from '../components/CertificateModal';
import { CompetitionTrack } from '../components/CompetitionTrack';
import { CompetitionShowcase } from '../components/CompetitionShowcase';
import { Hero } from '../components/Hero';
import { LearningTrack } from '../components/LearningTrack';
import { RulesModal } from '../components/RulesModal';
import { StudentLoginModal } from '../components/StudentLoginModal';
import { SubmissionEndedModal } from '../components/SubmissionEndedModal';
import { activityLinks, competitionConfig } from '../data/activity';
import { addAiEduStudent, AiEduConfigurationError } from '../services/aiEduApi';
import {
  markProgress,
  readCampaignSession,
  saveStudent,
} from '../services/campaignStorage';
import {
  getCompetitionStage,
  getLearningUnlocks,
  type CompetitionStage,
} from '../services/campaignTime';
import {
  dispatchZeroCampaignAction,
  getDeviceId,
  openZeroUrl,
  requestZeroAccountLogin,
} from '../services/zeroCampaignBridge';
import type { CampaignTrackId, StudentLoginPayload } from '../types';

function readTrack(): CampaignTrackId {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('track');
  return query === 'competition' || readCompetitionStagePreview(params) ? 'competition' : 'learning';
}

function readCompetitionStagePreview(params = new URLSearchParams(window.location.search)): CompetitionStage | null {
  const stage = params.get('stage');
  return stage === 'before'
    || stage === 'submission'
    || stage === 'initial-review'
    || stage === 'showcase'
    || stage === 'awards'
    ? stage
    : null;
}

export function CampaignPage() {
  const [session, setSession] = useState(readCampaignSession);
  const [track, setTrack] = useState<CampaignTrackId>(readTrack);
  const [showRules, setShowRules] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showSubmissionEnded, setShowSubmissionEnded] = useState(false);
  const [notice, setNotice] = useState('');
  const deviceId = useMemo(getDeviceId, []);
  const unlocks = getLearningUnlocks(session.progress);
  const previewCompetitionStage = useMemo(readCompetitionStagePreview, []);
  const competitionStage = previewCompetitionStage ?? getCompetitionStage(
    new Date(),
    competitionConfig.startAt,
    competitionConfig.uploadDeadline,
    competitionConfig.initialReviewDeadline,
    competitionConfig.expertReviewDays,
  );

  const stageButton = {
    before: ['赛事未开始', true, false],
    submission: ['上传作品', false, true],
    'initial-review': ['上传作品', false, true],
    showcase: ['作品展示', false, false],
    awards: ['作品展示', false, false],
  }[competitionStage] as [string, boolean, boolean];

  useEffect(() => {
    function onFirstAiInteraction() {
      const next = markProgress('firstAiInteractionAt');
      setSession(next);
    }
    function onExperienceCompleted(event: Event) {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      const key = {
        search: 'searchCompletedAt',
        skin: 'skinCompletedAt',
        pdf: 'pdfCompletedAt',
        drive: 'driveCompletedAt',
      }[action ?? ''] as Parameters<typeof markProgress>[0] | undefined;
      if (key) setSession(markProgress(key));
    }
    window.addEventListener('zero-campaign:first-ai-interaction', onFirstAiInteraction);
    window.addEventListener('zero-campaign:experience-completed', onExperienceCompleted);
    return () => {
      window.removeEventListener('zero-campaign:first-ai-interaction', onFirstAiInteraction);
      window.removeEventListener('zero-campaign:experience-completed', onExperienceCompleted);
    };
  }, []);

  async function login(payload: StudentLoginPayload) {
    let next;
    try {
      await addAiEduStudent(payload);
      next = saveStudent(payload, { allowExisting: true });
    } catch (error) {
      if (error instanceof AiEduConfigurationError) {
        console.error('[AI EDU] 学生登录接口配置错误：', error.message);
        return error.message;
      }
      return error instanceof Error ? error.message : '登录失败，请重试。';
    }
    setSession(next);
    requestZeroAccountLogin();
    dispatchZeroCampaignAction('student-login', { ...payload, deviceId: undefined });
    return null;
  }

  function updateProgress(key: Parameters<typeof markProgress>[0]) {
    const next = markProgress(key);
    setSession(next);
  }

  async function learn() {
    updateProgress('courseOpenedAt');
    dispatchZeroCampaignAction('course-opened', { mode: 'interaction' });
    await openZeroUrl(activityLinks.course);
  }

  function mockAiInteraction() {
    updateProgress('firstAiInteractionAt');
    dispatchZeroCampaignAction('first-ai-interaction');
  }

  async function performAction(action: 'drive' | 'search' | 'skin' | 'pdf' | 'summary') {
    const actionConfig = {
      drive: [activityLinks.drive, 'driveCompletedAt'],
      search: [activityLinks.search, 'searchCompletedAt'],
      skin: [activityLinks.skin, 'skinCompletedAt'],
      pdf: [activityLinks.pdf, 'pdfCompletedAt'],
      summary: [activityLinks.summary, 'summaryCompletedAt'],
    } as const;
    const [url, progressKey] = actionConfig[action];
    updateProgress(progressKey);
    dispatchZeroCampaignAction(action, action === 'summary' ? { enterAiSummary: true } : {});
    try {
      await openZeroUrl(url);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '打开页面失败，请稍后重试');
    }
  }

  async function competitionAction() {
    if (competitionStage === 'submission') {
      dispatchZeroCampaignAction('plugin-submission-opened');
      await openZeroUrl(activityLinks.pluginGenerator);
      return;
    }
    if (competitionStage === 'initial-review') {
      setShowSubmissionEnded(true);
      return;
    }
    if (competitionStage === 'showcase' || competitionStage === 'awards') {
      document.querySelector('#showcase')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function installWork(id: string) {
    dispatchZeroCampaignAction('plugin-install', { pluginId: id });
    setNotice('已向 ZERO 浏览器发起插件安装请求');
  }

  function generateCertificate() {
    updateProgress('certificateGeneratedAt');
    dispatchZeroCampaignAction('certificate-generated');
  }

  return (
    <div className={`campaign-app campaign-app--${track}`}>
      <div className="campaign-content" inert={session.profile ? undefined : true}>
        <CampaignHeader activeTrack={track} onChange={setTrack} />
        <Hero
          track={track}
          onSwitchCompetition={() => setTrack('competition')}
          competitionAction={stageButton[0]}
          competitionDisabled={stageButton[1]}
          showCompetitionIcon={stageButton[2]}
          onCompetitionAction={competitionAction}
          showCompetitionAction
        />
        {track === 'learning' ? (
          <LearningTrack
            progress={session.progress}
            dayTwoUnlocked={unlocks.dayTwo}
            dayEightUnlocked={unlocks.dayEight}
            certificateUnlocked={unlocks.certificate}
            elapsedDays={unlocks.elapsedDays}
            onLearn={learn}
            onMockAiInteraction={mockAiInteraction}
            onAction={performAction}
            onCertificate={() => setShowCertificate(true)}
          />
        ) : competitionStage === 'showcase' || competitionStage === 'awards' ? (
          <CompetitionShowcase
            awards={competitionStage === 'awards'}
            onInstall={installWork}
          />
        ) : (
          <CompetitionTrack onRules={() => setShowRules(true)} />
        )}
      </div>

      {!session.profile ? <StudentLoginModal deviceId={deviceId} onSubmit={login} /> : null}
      {showRules ? <RulesModal onClose={() => setShowRules(false)} /> : null}
      {showSubmissionEnded ? (
        <SubmissionEndedModal onClose={() => setShowSubmissionEnded(false)} />
      ) : null}
      {showCertificate && session.profile ? (
        <CertificateModal
          studentName={session.profile.name}
          school={session.profile.school}
          onClose={() => setShowCertificate(false)}
          onGenerated={generateCertificate}
        />
      ) : null}
      {notice ? <button className="toast" type="button" onClick={() => setNotice('')}>{notice}<span>×</span></button> : null}
    </div>
  );
}
