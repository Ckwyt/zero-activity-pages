const CHINA_TIME_ZONE = 'Asia/Shanghai';
const BEIJING_OFFSET = 8 * 60 * 60 * 1000;

interface LearningTaskTimestamps {
  t1: number;
  t6: number;
}

function chinaDateParts(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: CHINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

export function chinaCalendarDayNumber(value: Date | string) {
  const { year, month, day } = chinaDateParts(value);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function elapsedChinaCalendarDays(from: Date | string, now = new Date()) {
  return Math.max(0, chinaCalendarDayNumber(now) - chinaCalendarDayNumber(from));
}

function isCompletedTimestamp(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

export function getDayEightUnlockTime(t1: number) {
  if (!isCompletedTimestamp(t1)) return null;
  const firstInteraction = new Date(t1 * 1000);
  const beijingTime = new Date(firstInteraction.getTime() + BEIJING_OFFSET);
  return Date.UTC(
    beijingTime.getUTCFullYear(),
    beijingTime.getUTCMonth(),
    beijingTime.getUTCDate() + 7,
  ) - BEIJING_OFFSET;
}

export function getLearningUnlocks(task: LearningTaskTimestamps, now = new Date()) {
  const hasT1 = isCompletedTimestamp(task.t1);
  const elapsed = hasT1 ? elapsedChinaCalendarDays(new Date(task.t1 * 1000), now) : -1;
  return {
    dayTwo: elapsed >= 1,
    dayEight: elapsed >= 7,
    certificate: isCompletedTimestamp(task.t6),
    elapsedDays: Math.max(elapsed, 0),
  };
}

export type CompetitionStage = 'before' | 'submission' | 'initial-review' | 'showcase' | 'awards';
export type CompetitionActionState = 'upload' | 'closed' | 'showcase';

export function shouldShowCompetitionAction(stage: CompetitionStage) {
  return stage !== 'showcase' && stage !== 'awards';
}

export function getCompetitionActionState(
  now: Date,
  uploadDeadline: string,
  initialReviewDeadline: string,
): CompetitionActionState {
  const current = chinaCalendarDayNumber(now);
  if (current <= chinaCalendarDayNumber(uploadDeadline)) return 'upload';
  if (current <= chinaCalendarDayNumber(initialReviewDeadline)) return 'closed';
  return 'showcase';
}

export function getCompetitionStage(
  now: Date,
  startAt: string,
  uploadDeadline: string,
  initialReviewDeadline: string,
  expertReviewDays = 10,
): CompetitionStage {
  const current = chinaCalendarDayNumber(now);
  const start = chinaCalendarDayNumber(startAt);
  const initialReviewEnd = chinaCalendarDayNumber(initialReviewDeadline);
  if (current < start) return 'before';
  const actionState = getCompetitionActionState(now, uploadDeadline, initialReviewDeadline);
  if (actionState === 'upload') return 'submission';
  if (actionState === 'closed') return 'initial-review';
  if (current <= initialReviewEnd + expertReviewDays) return 'showcase';
  return 'awards';
}
