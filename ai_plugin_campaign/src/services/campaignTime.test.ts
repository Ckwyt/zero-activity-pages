import { describe, expect, it } from 'vitest';
import {
  elapsedChinaCalendarDays,
  getDayEightUnlockTime,
  getCompetitionActionState,
  getCompetitionStage,
  getLearningUnlocks,
  shouldShowCompetitionAction,
} from './campaignTime';

describe('campaign natural-day unlocks', () => {
  it('unlocks at Beijing midnight instead of after 24 hours', () => {
    expect(elapsedChinaCalendarDays('2026-08-12T23:59:00+08:00', new Date('2026-08-13T00:01:00+08:00'))).toBe(1);
    const t1 = Date.parse('2026-08-12T23:59:00+08:00') / 1000;
    expect(getLearningUnlocks(
      { t1, t6: 0 },
      new Date('2026-08-19T00:01:00+08:00'),
    ).dayEight).toBe(true);
    expect(getDayEightUnlockTime(t1)).toBe(Date.parse('2026-08-19T00:00:00+08:00'));
  });

  it('uses server t1 and t6 timestamps as the only learning unlock source', () => {
    const t1 = Date.parse('2026-08-12T10:00:00+08:00') / 1000;
    expect(getLearningUnlocks({ t1: 0, t6: 0 }, new Date('2026-08-20T00:00:00+08:00')))
      .toMatchObject({ dayTwo: false, dayEight: false, certificate: false });
    expect(getLearningUnlocks({ t1, t6: 0 }, new Date('2026-08-13T00:00:00+08:00')))
      .toMatchObject({ dayTwo: true, dayEight: false, certificate: false });
    expect(getLearningUnlocks({ t1, t6: 0 }, new Date('2026-08-19T00:00:00+08:00')))
      .toMatchObject({ dayTwo: true, dayEight: true, certificate: false });
    expect(getLearningUnlocks({ t1, t6: 1_797_600_000 }, new Date('2026-08-19T00:00:00+08:00')))
      .toMatchObject({ certificate: true });
  });

  it('derives all competition stages from configured dates', () => {
    const start = '2026-08-12T00:00:00+08:00';
    const uploadDeadline = '2026-09-01';
    const initialReviewDeadline = '2026-09-04';
    expect(getCompetitionStage(new Date('2026-08-11T12:00:00+08:00'), start, uploadDeadline, initialReviewDeadline)).toBe('before');
    expect(getCompetitionStage(new Date('2026-08-20T12:00:00+08:00'), start, uploadDeadline, initialReviewDeadline)).toBe('submission');
    expect(getCompetitionStage(new Date('2026-09-03T12:00:00+08:00'), start, uploadDeadline, initialReviewDeadline)).toBe('initial-review');
    expect(getCompetitionStage(new Date('2026-09-08T12:00:00+08:00'), start, uploadDeadline, initialReviewDeadline)).toBe('showcase');
    expect(getCompetitionStage(new Date('2026-09-16T12:00:00+08:00'), start, uploadDeadline, initialReviewDeadline)).toBe('awards');
  });

  it('hides the hero action after the work-list stage begins', () => {
    expect(shouldShowCompetitionAction('before')).toBe(true);
    expect(shouldShowCompetitionAction('submission')).toBe(true);
    expect(shouldShowCompetitionAction('initial-review')).toBe(true);
    expect(shouldShowCompetitionAction('showcase')).toBe(false);
    expect(shouldShowCompetitionAction('awards')).toBe(false);
  });

  it('keeps uploads open through the first date and switches after the second date', () => {
    const uploadDeadline = '2026-09-01';
    const initialReviewDeadline = '2026-09-04';

    expect(getCompetitionActionState(
      new Date('2026-09-01T23:59:59+08:00'),
      uploadDeadline,
      initialReviewDeadline,
    )).toBe('upload');
    expect(getCompetitionActionState(
      new Date('2026-09-02T00:00:00+08:00'),
      uploadDeadline,
      initialReviewDeadline,
    )).toBe('closed');
    expect(getCompetitionActionState(
      new Date('2026-09-04T23:59:59+08:00'),
      uploadDeadline,
      initialReviewDeadline,
    )).toBe('closed');
    expect(getCompetitionActionState(
      new Date('2026-09-05T00:00:00+08:00'),
      uploadDeadline,
      initialReviewDeadline,
    )).toBe('showcase');
  });
});
