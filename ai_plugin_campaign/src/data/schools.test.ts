import { describe, expect, it } from 'vitest';
import { schools, searchSchools } from './schools';

describe('school options', () => {
  it('loads the complete supplied school list without duplicates', () => {
    expect(schools).toHaveLength(3_195);
    expect(new Set(schools).size).toBe(schools.length);
    expect(schools).toContain('北京大学');
    expect(schools).toContain('浙江大学');
    expect(schools).toContain('香港中文大学（深圳）');
  });

  it('filters schools by a trimmed partial name', () => {
    expect(searchSchools('  北京航空  ')).toContain('北京航空航天大学');
    expect(searchSchools('不存在的学校名称')).toEqual([]);
  });

  it('returns all schools for an empty search', () => {
    expect(searchSchools('')).toBe(schools);
  });
});
