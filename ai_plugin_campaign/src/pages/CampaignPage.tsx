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
import { addAiEduStudent } from '../services/aiEduApi';
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
import type { ActivityProgress, CampaignSession, CampaignTrackId, StudentLoginPayload } from '../types';

const emptyCampaignSession: CampaignSession = { profile: null, progress: {} };

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
  const deviceId = useMemo(getDeviceId, []);
  const [session, setSession] = useState<CampaignSession>(emptyCampaignSession);
  const [storageReady, setStorageReady] = useState(false);
  const [track, setTrack] = useState<CampaignTrackId>(readTrack);
  const [showRules, setShowRules] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showSubmissionEnded, setShowSubmissionEnded] = useState(false);
  const [notice, setNotice] = useState('');
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
    let active = true;
    readCampaignSession(deviceId)
      .then((storedSession) => {
        if (active) setSession(storedSession);
      })
      .catch((error) => {
        console.error('[Campaign Storage] 读取本地活动数据失败：', error);
        if (active) setNotice('本地活动数据读取失败，请重新登录。');
      })
      .finally(() => {
        if (active) setStorageReady(true);
      });
    return () => {
      active = false;
    };
  }, [deviceId]);

  useEffect(() => {
    function persistEventProgress(key: keyof ActivityProgress) {
      void markProgress(deviceId, key)
        .then(setSession)
        .catch((error) => {
          console.error('[Campaign Storage] 保存活动进度失败：', error);
          setNotice('活动进度保存失败，请重试。');
        });
    }
    function onFirstAiInteraction() {
      persistEventProgress('firstAiInteractionAt');
    }
    function onExperienceCompleted(event: Event) {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      const key = {
        search: 'searchCompletedAt',
        skin: 'skinCompletedAt',
        pdf: 'pdfCompletedAt',
        drive: 'driveCompletedAt',
      }[action ?? ''] as keyof ActivityProgress | undefined;
      if (key) persistEventProgress(key);
    }
    window.addEventListener('zero-campaign:first-ai-interaction', onFirstAiInteraction);
    window.addEventListener('zero-campaign:experience-completed', onExperienceCompleted);
    return () => {
      window.removeEventListener('zero-campaign:first-ai-interaction', onFirstAiInteraction);
      window.removeEventListener('zero-campaign:experience-completed', onExperienceCompleted);
    };
  }, [deviceId]);

  async function login(payload: StudentLoginPayload) {
    let next;
    try {
      await addAiEduStudent(payload);
      next = await saveStudent(payload, { allowExisting: true });
    } catch (error) {
      return error instanceof Error ? error.message : '登录失败，请重试。';
    }
    setSession(next);
    requestZeroAccountLogin();
    dispatchZeroCampaignAction('student-login', { ...payload, deviceId: undefined });
    return null;
  }

  async function updateProgress(key: keyof ActivityProgress) {
    try {
      const next = await markProgress(deviceId, key);
      setSession(next);
      return true;
    } catch (error) {
      console.error('[Campaign Storage] 保存活动进度失败：', error);
      setNotice('活动进度保存失败，请重试。');
      return false;
    }
  }

  async function learn() {
    if (!await updateProgress('courseOpenedAt')) return;
    dispatchZeroCampaignAction('course-opened', { mode: 'interaction' });
    await openZeroUrl(activityLinks.course);
  }

  function mockAiInteraction() {
    void updateProgress('firstAiInteractionAt');
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
    if (!await updateProgress(progressKey)) return;
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
    void updateProgress('certificateGeneratedAt');
    dispatchZeroCampaignAction('certificate-generated');
  }

  return (
    <div className={`campaign-app campaign-app--${track}`}>
      <div className="campaign-content" inert={storageReady && session.profile ? undefined : true}>
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

      {storageReady && !session.profile ? <StudentLoginModal deviceId={deviceId} onSubmit={login} /> : null}
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
