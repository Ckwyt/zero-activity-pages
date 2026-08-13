import { beforeEach, describe, expect, it } from 'vitest';
import { createStudentKey, hasDuplicateStudent, markProgress, readCampaignSession, saveStudent } from './campaignStorage';

const student = { school: '未来大学', name: '林川', studentNumber: '2026001', deviceId: 'mid-01' };

describe('campaign local storage', () => {
  beforeEach(() => localStorage.clear());

  it('builds the duplicate key from all four user dimensions', () => {
    expect(createStudentKey(student)).toBe('未来大学::林川::2026001::mid-01');
  });

  it('stores the student locally and detects a repeated login', () => {
    expect(hasDuplicateStudent(student)).toBe(false);
    saveStudent(student);
    expect(readCampaignSession().profile).toMatchObject(student);
    expect(hasDuplicateStudent(student)).toBe(true);
    expect(() => saveStudent(student)).toThrow('请勿重复提交');
    expect(hasDuplicateStudent({ ...student, deviceId: 'mid-02' })).toBe(false);
  });

  it('allows an API-confirmed student to refresh the local session', () => {
    saveStudent(student);
    markProgress('courseOpenedAt', '2026-08-13T00:00:00.000Z');
    expect(() => saveStudent({ ...student, name: '林川同学' }, { allowExisting: true })).not.toThrow();
    expect(readCampaignSession().profile?.name).toBe('林川同学');
    expect(readCampaignSession().progress.courseOpenedAt).toBe('2026-08-13T00:00:00.000Z');
  });
});
