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
import { getAiEduBinding, type AiEduBindingData } from '../services/aiEduBindingApi';
import {
  markProgress,
  readCampaignSession,
} from '../services/campaignStorage';
import { submitStudentLogin } from '../services/studentLogin';
import {
  getCompetitionStage,
  shouldShowCompetitionAction,
  type CompetitionStage,
} from '../services/campaignTime';
import {
  dispatchZeroCampaignAction,
  getDeviceId,
  openZeroUrl,
  requestZeroAccountLogin,
} from '../services/zeroCampaignBridge';
import {
  getCurrentCampaignSearchValues,
  readLastValidParameter,
  readLearningPreviewSetting,
} from '../services/urlParameters';
import type { ActivityProgress, CampaignSession, CampaignTrackId, StudentLoginPayload } from '../types';

const emptyCampaignSession: CampaignSession = { profile: null, progress: {} };
const emptyAiEduBinding: AiEduBindingData = { hasBind: false, t1: 0, t6: 0 };
const competitionStages = ['before', 'submission', 'initial-review', 'showcase', 'awards'] as const;

function readTrack(): CampaignTrackId {
  const searchValues = getCurrentCampaignSearchValues();
  const query = readLastValidParameter('track', ['learning', 'competition'] as const, ...searchValues);
  return query === 'competition' || readCompetitionStagePreview(...searchValues) ? 'competition' : 'learning';
}

function readCompetitionStagePreview(
  ...searchValues: Array<string | undefined>
): CompetitionStage | null {
  const sources = searchValues.length ? searchValues : getCurrentCampaignSearchValues();
  return readLastValidParameter('stage', competitionStages, ...sources) ?? null;
}

export function CampaignPage() {
  const deviceId = useMemo(getDeviceId, []);
  const [session, setSession] = useState<CampaignSession>(emptyCampaignSession);
  const [aiEduBinding, setAiEduBinding] = useState<AiEduBindingData>(emptyAiEduBinding);
  const [storageReady, setStorageReady] = useState(false);
  const [track, setTrack] = useState<CampaignTrackId>(readTrack);
  const [showRules, setShowRules] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showSubmissionEnded, setShowSubmissionEnded] = useState(false);
  const [notice, setNotice] = useState('');
  const forceAllLearningTasksUnlocked = useMemo(
    () => readLearningPreviewSetting(...getCurrentCampaignSearchValues()) === 'all',
    [],
  );
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
    if (!deviceId) {
      setStorageReady(true);
      setNotice('未获取到设备 MID，请使用 ZERO 浏览器重新打开活动页面。');
      return undefined;
    }

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
    const storedStudentDeviceId = session.profile?.deviceId;
    if (!storageReady || !deviceId || !storedStudentDeviceId) {
      setAiEduBinding(emptyAiEduBinding);
      return undefined;
    }

    let active = true;
    let requesting = false;
    async function refreshBinding() {
      if (requesting) return;
      requesting = true;
      try {
        const result = await getAiEduBinding(deviceId);
        if (active) setAiEduBinding(result);
      } catch (error) {
        console.error('[AI EDU Binding] 查询设备学习进度失败：', error);
        if (active) setNotice(error instanceof Error ? error.message : '学习进度查询失败，请稍后重试');
      } finally {
        requesting = false;
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') void refreshBinding();
    }

    void refreshBinding();
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      active = false;
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [deviceId, session.profile?.deviceId, storageReady]);

  useEffect(() => {
    if (!deviceId) return undefined;
    const currentDeviceId = deviceId;

    function persistEventProgress(key: keyof ActivityProgress) {
      void markProgress(currentDeviceId, key)
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
      next = await submitStudentLogin(payload);
    } catch (error) {
      return error instanceof Error ? error.message : '登录失败，请重试。';
    }
    setSession(next);
    requestZeroAccountLogin();
    dispatchZeroCampaignAction('student-login', { ...payload, deviceId: undefined });
    return null;
  }

  async function updateProgress(key: keyof ActivityProgress) {
    if (!deviceId) {
      setNotice('未获取到设备 MID，请使用 ZERO 浏览器重新打开活动页面。');
      return false;
    }
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

  async function openPluginHub() {
    dispatchZeroCampaignAction('plugin-hub-opened');
    try {
      await openZeroUrl(activityLinks.pluginGenerator);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '打开 AI 插件页面失败，请稍后重试');
    }
  }

  async function competitionAction() {
    if (competitionStage === 'submission') {
      dispatchZeroCampaignAction('plugin-submission-opened');
      await openPluginHub();
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
          onOpenPluginHub={openPluginHub}
          competitionAction={stageButton[0]}
          competitionDisabled={stageButton[1]}
          showCompetitionIcon={stageButton[2]}
          onCompetitionAction={competitionAction}
          showCompetitionAction={shouldShowCompetitionAction(competitionStage)}
        />
        {track === 'learning' ? (
          <LearningTrack
            progress={session.progress}
            t1={aiEduBinding.t1}
            t6={aiEduBinding.t6}
            forceAllUnlocked={forceAllLearningTasksUnlocked}
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
          <CompetitionTrack
            onRules={() => setShowRules(true)}
            showRules={false}
          />
        )}
      </div>

      {storageReady && deviceId && !session.profile ? (
        <StudentLoginModal deviceId={deviceId} onSubmit={login} />
      ) : null}
      {showRules ? <RulesModal onClose={() => setShowRules(false)} /> : null}
      {showSubmissionEnded ? (
        <SubmissionEndedModal onClose={() => setShowSubmissionEnded(false)} />
      ) : null}
      {showCertificate && session.profile ? (
        <CertificateModal
          studentName={session.profile.name}
          onClose={() => setShowCertificate(false)}
          onGenerated={generateCertificate}
        />
      ) : null}
      {notice ? <button className="toast" type="button" onClick={() => setNotice('')}>{notice}<span>×</span></button> : null}
    </div>
  );
}
