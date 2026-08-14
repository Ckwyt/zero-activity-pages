import { useEffect, useMemo, useState } from 'react';
import type { ActivityProgress } from '../types';

// 活动联调期间暂时开放所有学习任务入口；需要恢复解锁限制时改为 true。
const LEARNING_BUTTON_GATES_ENABLED = false;

function GradientButton({
  children,
  disabled,
  onClick,
  title,
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      className="pill-button pill-button--purple"
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function LearningTrack({
  progress,
  dayTwoUnlocked,
  dayEightUnlocked,
  certificateUnlocked,
  elapsedDays,
  onLearn,
  onMockAiInteraction,
  onAction,
  onCertificate,
}: {
  progress: ActivityProgress;
  dayTwoUnlocked: boolean;
  dayEightUnlocked: boolean;
  certificateUnlocked: boolean;
  elapsedDays: number;
  onLearn: () => void;
  onMockAiInteraction: () => void;
  onAction: (action: 'drive' | 'search' | 'skin' | 'pdf' | 'summary') => void;
  onCertificate: () => void;
}) {
  const waitingText = '完成首次 AI 对话后的次日 00:00 解锁';
  return (
    <main className="learning-track">
      <section className="learning-intro section-shell">
        <div className="section-title">
          <h2>基础学习</h2>
          <span>第 1 天｜基础学习启动</span>
          <p>
            打开 ZERO 浏览器进入活动专题，完整学习线上主题课程，然后围绕课程知识点主动提问、交流探讨
            <br className="learning-intro__desktop-break" />
            （例如 AI 对本专业影响、就业变革、能力建设等相关问题），加深课程理解，留存互动页面截图。
          </p>
        </div>
        <article className="course-card">
          <h3>课程名称：《AI 浪潮下的产业变革：青年的机遇、挑战与成长路径》</h3>
          <h4>课程大纲：</h4>
          <ol>
            <li>人工智能产业化现状，各行业智能化转型典型案例</li>
            <li>AI 带来的时代机遇：创新载体、效率升级、青年就业与发展新方向</li>
            <li>AI 引发的现实挑战：岗位迭代、能力竞争、AI 伦理与合规风险</li>
            <li>大学生应对策略：打造不可替代核心竞争力、科学合规使用 AI 工具</li>
            <li>青年数字素养培育指引</li>
          </ol>
          <div className="course-card__actions">
            <GradientButton onClick={onLearn}>去学习并互动</GradientButton>
            {import.meta.env.DEV && progress.courseOpenedAt && !progress.firstAiInteractionAt ? (
              <button className="dev-complete" type="button" onClick={onMockAiInteraction}>开发预览：模拟首次 AI 对话</button>
            ) : null}
          </div>
          {progress.firstAiInteractionAt ? <p className="status-note status-note--success">已完成首次 AI 对话，学习任务已记录</p> : null}
        </article>
      </section>

      <section className="drive-section">
        <div className="section-shell drive-section__inner">
          <div className="section-title section-title--compact">
            <h2>一键转存，长期学习</h2>
            <p>浏览器内置 100G 网盘，课件文献网课视频统一存储，多端随取</p>
            <GradientButton
              disabled={LEARNING_BUTTON_GATES_ENABLED && !dayTwoUnlocked}
              title={LEARNING_BUTTON_GATES_ENABLED && !dayTwoUnlocked ? waitingText : undefined}
              onClick={() => onAction('drive')}
            >去保存</GradientButton>
          </div>
          <div className="drive-preview-stage">
            <img className="drive-preview" src="/assets/figma/drive-preview.png" alt="ZERO 网盘课程资源转存界面" />
          </div>
        </div>
      </section>

      <section className="advanced-section">
        <svg
          className="advanced-section__frame"
          viewBox="0 0 1440 670"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="advanced-section-surface-clip" clipPathUnits="objectBoundingBox">
              <path
                d="M0 .002985H.475803C.477996 .002985 .480141 .004381 .481966 .006996L.493837 .024005C.497569 .029353 .502431 .029353 .506163 .024005L.518034 .006996C.51986 .004381 .522004 .002985 .524197 .002985H1V1H0Z"
                fill="black"
              />
            </clipPath>
          </defs>
          <path
            d="M0 2H685.156C688.314 2 691.403 2.93501 694.031 4.6872L711.125 16.0832C716.499 19.6661 723.501 19.6661 728.875 16.0832L745.969 4.68719C748.597 2.93501 751.686 2 754.844 2H1440"
            stroke="white"
            strokeOpacity="0.51"
            strokeWidth="4"
          />
        </svg>
        <div className="advanced-section__surface" aria-hidden="true" />
        <div className="section-shell advanced-section__content">
          <div className="section-title">
            <h2>进阶体验</h2>
            <span>第 2-7 天｜拓展内容一次性解锁</span>
            {!dayTwoUnlocked && progress.firstAiInteractionAt ? <small>已完成第 {elapsedDays + 1} 天学习，次日 00:00 解锁</small> : null}
          </div>
          <div className="experience-list">
            <ExperienceItem
              title="AI搜索"
              description="一个搜索框，一键切换六大搜索引擎——AI搜索、豆包AI搜索、百度、Microsoft Bing、Google。写论文用学术、查资讯用综合、要答案用AI，各取所需，省内存又高效，全程无广告。"
              button="去搜索"
              disabled={LEARNING_BUTTON_GATES_ENABLED && !dayTwoUnlocked}
              onClick={() => onAction('search')}
            />
            <ExperienceItem
              title="AI换肤"
              description="一句话生成专属浏览器主题皮肤，开启个性化美学体验。"
              button="去换肤"
              disabled={LEARNING_BUTTON_GATES_ENABLED && !dayTwoUnlocked}
              onClick={() => onAction('skin')}
            />
            <ExperienceItem
              title="PDF 全能工具"
              description="免费格式转换、双语对照翻译、AI 文档总结，一键生成思维导图，PDF 常用操作一站完成。"
              button="去体验"
              disabled={LEARNING_BUTTON_GATES_ENABLED && !dayTwoUnlocked}
              onClick={() => onAction('pdf')}
            />
          </div>
        </div>
      </section>

      <section className="summary-section section-shell">
        <div className="section-title">
          <h2>学习总结</h2>
          <LearningCountdown
            firstAiInteractionAt={progress.firstAiInteractionAt}
            unlocked={dayEightUnlocked}
          />
          <span>第 8 天｜深度思考 AI 主题互动</span>
          <p>参与者登录 ZERO 浏览器活动专题，使用内置 AI 助手功能，围绕主题开展深度交流：自主提出人工智能在未来学习、校园生活、就业择业、创新创业领域能够落地的应用方向 / 场景设想，与 AI 进行对话探讨，保存完整互动截图。</p>
          <GradientButton
            disabled={LEARNING_BUTTON_GATES_ENABLED && !dayEightUnlocked}
            title={LEARNING_BUTTON_GATES_ENABLED && !dayEightUnlocked ? '完成首次 AI 对话后的第 8 天解锁' : undefined}
            onClick={() => onAction('summary')}
          >去学习并总结</GradientButton>
        </div>
      </section>

      <section className="certificate-section">
        <div className="section-shell section-title section-title--certificate">
          <h2>证书申领</h2>
          <p>成功完成 <strong>【第 1 天课程学习 + 课程相关 AI 问答互动】+【第 8 天 AI 场景畅想互动】</strong> 两项基础任务，核验材料无误后，即可在 ZERO 浏览器活动专题页面领取官方学习证明。</p>
          <small>补充说明：第 2–7 天拓展内容鼓励学习，但不作为领取证书的必备条件，兼顾学习深度与参与门槛。</small>
          <button
            className="pill-button pill-button--white"
            type="button"
            disabled={LEARNING_BUTTON_GATES_ENABLED && !certificateUnlocked}
            onClick={onCertificate}
          >
            {progress.certificateGeneratedAt ? '查看学习证明' : '领取学习证明'}
          </button>
        </div>
      </section>
    </main>
  );
}

const BEIJING_OFFSET = 8 * 60 * 60 * 1000;

function getDayEightUnlockTime(firstAiInteractionAt: string) {
  const firstInteraction = new Date(firstAiInteractionAt);
  const beijingTime = new Date(firstInteraction.getTime() + BEIJING_OFFSET);
  return Date.UTC(
    beijingTime.getUTCFullYear(),
    beijingTime.getUTCMonth(),
    beijingTime.getUTCDate() + 7,
  ) - BEIJING_OFFSET;
}

function formatCountdown(remainingMilliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMilliseconds / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${days}天${pad(hours)}时${pad(minutes)}分${pad(seconds)}秒`;
}

function LearningCountdown({
  firstAiInteractionAt,
  unlocked,
}: {
  firstAiInteractionAt?: string;
  unlocked: boolean;
}) {
  const unlockTime = useMemo(
    () => firstAiInteractionAt ? getDayEightUnlockTime(firstAiInteractionAt) : null,
    [firstAiInteractionAt],
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!unlockTime || unlocked) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [unlockTime, unlocked]);

  let content = '完成首次 AI 对话后开启';
  if (unlocked || (unlockTime !== null && unlockTime <= now)) content = '已解锁';
  else if (unlockTime !== null) content = formatCountdown(unlockTime - now);

  return <small className="learning-countdown">倒计时：{content}</small>;
}

function ExperienceItem({
  title,
  description,
  button,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  button: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <article className="experience-item">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <GradientButton disabled={disabled} onClick={onClick}>{button}</GradientButton>
    </article>
  );
}
