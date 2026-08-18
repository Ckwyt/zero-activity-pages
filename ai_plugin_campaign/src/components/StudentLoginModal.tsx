import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { schools, searchSchools } from '../data/schools';
import type { StudentLoginPayload } from '../types';

export function StudentLoginModal({
  deviceId,
  onSubmit,
}: {
  deviceId: string;
  onSubmit: (payload: StudentLoginPayload) => Promise<string | null>;
}) {
  const [values, setValues] = useState({ school: '', name: '', studentNumber: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values | 'duplicate', string>>>({});
  const [schoolListOpen, setSchoolListOpen] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [highlightedSchool, setHighlightedSchool] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const schoolSelectRef = useRef<HTMLDivElement>(null);
  const schoolSearchRef = useRef<HTMLInputElement>(null);
  const filteredSchools = useMemo(() => searchSchools(schoolSearch), [schoolSearch]);

  useEffect(() => {
    if (!schoolListOpen) return undefined;

    function closeWhenClickingOutside(event: PointerEvent) {
      if (!schoolSelectRef.current?.contains(event.target as Node)) setSchoolListOpen(false);
    }

    document.addEventListener('pointerdown', closeWhenClickingOutside);
    return () => document.removeEventListener('pointerdown', closeWhenClickingOutside);
  }, [schoolListOpen]);

  useEffect(() => {
    if (!schoolListOpen) return;
    schoolSearchRef.current?.focus();
  }, [schoolListOpen]);

  useEffect(() => {
    if (!schoolListOpen) return;
    schoolSelectRef.current
      ?.querySelector<HTMLElement>(`#school-option-${highlightedSchool}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [highlightedSchool, schoolListOpen]);

  function selectSchool(school: string) {
    setValues((current) => ({ ...current, school }));
    setErrors((current) => ({ ...current, school: undefined }));
    setSchoolSearch('');
    setSchoolListOpen(false);
  }

  function openSchoolList() {
    setSchoolSearch('');
    setHighlightedSchool(Math.max(0, schools.indexOf(values.school)));
    setSchoolListOpen(true);
  }

  function handleSchoolSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!filteredSchools.length) return;
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedSchool((current) => (
        current + offset + filteredSchools.length
      ) % filteredSchools.length);
      return;
    }
    if (event.key === 'Enter' && filteredSchools[highlightedSchool]) {
      event.preventDefault();
      selectSchool(filteredSchools[highlightedSchool]);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setSchoolListOpen(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const nextErrors: typeof errors = {};
    if (!values.school) nextErrors.school = '请选择学校';
    if (!values.name.trim()) nextErrors.name = '请输入姓名';
    if (!values.studentNumber.trim()) nextErrors.studentNumber = '请输入学号';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      const message = await onSubmit({ ...values, deviceId });
      if (message) setErrors({ duplicate: message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-layer modal-layer--login" role="presentation">
      <form className="login-modal" onSubmit={submit} aria-labelledby="student-login-title">
        <h2 id="student-login-title">活动登录</h2>
        <div className="login-modal__field">
          <span id="school-select-label">学校 <em>*</em></span>
          <div className="school-select" ref={schoolSelectRef}>
            <div className={`school-select__trigger ${values.school ? '' : 'is-placeholder'} ${schoolListOpen ? 'is-open' : ''}`}>
              <input
                ref={schoolSearchRef}
                className="school-select__input"
                value={schoolListOpen ? schoolSearch : values.school}
                type="search"
                role="combobox"
                aria-labelledby="school-select-label"
                aria-controls="school-options"
                aria-expanded={schoolListOpen}
                aria-haspopup="listbox"
                aria-autocomplete="list"
                aria-activedescendant={schoolListOpen && filteredSchools.length
                  ? `school-option-${highlightedSchool}`
                  : undefined}
                aria-invalid={Boolean(errors.school)}
                autoComplete="off"
                placeholder="请选择或搜索您的学校"
                onFocus={() => {
                  if (!schoolListOpen) openSchoolList();
                }}
                onChange={(event) => {
                  if (!schoolListOpen) setSchoolListOpen(true);
                  setSchoolSearch(event.target.value);
                  setHighlightedSchool(0);
                }}
                onKeyDown={handleSchoolSearchKeyDown}
              />
              <button
                className="school-select__toggle"
                type="button"
                aria-label={schoolListOpen ? '收起学校列表' : '展开学校列表并搜索'}
                tabIndex={-1}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (schoolListOpen) setSchoolListOpen(false);
                  else {
                    openSchoolList();
                    schoolSearchRef.current?.focus();
                  }
                }}
              >
                <svg aria-hidden="true" viewBox="0 0 16 16">
                  <path d="m4 6 4 4 4-4" />
                </svg>
              </button>
            </div>
            {schoolListOpen ? (
              <div className="school-select__dropdown">
                <ul className="school-select__options" id="school-options" role="listbox" aria-labelledby="school-select-label">
                  {filteredSchools.map((school, index) => (
                    <li
                      className={index === highlightedSchool ? 'is-highlighted' : ''}
                      id={`school-option-${index}`}
                      role="option"
                      aria-selected={values.school === school}
                      key={school}
                      onClick={() => selectSchool(school)}
                      onPointerMove={() => setHighlightedSchool(index)}
                    >
                      <span>{school}</span>
                      {values.school === school ? <span className="school-select__check" aria-hidden="true">✓</span> : null}
                    </li>
                  ))}
                  {!filteredSchools.length ? (
                    <li className="school-select__empty" role="presentation">未找到匹配的学校</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
          {errors.school ? <small>{errors.school}</small> : null}
        </div>
        <label>
          <span>姓名 <em>*</em></span>
          <input
            value={values.name}
            autoComplete="name"
            maxLength={16}
            placeholder="请输入您的姓名"
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          />
          {errors.name ? <small>{errors.name}</small> : null}
        </label>
        <label>
          <span>学号 <em>*</em></span>
          <input
            value={values.studentNumber}
            inputMode="numeric"
            maxLength={64}
            placeholder="请输入您的学号"
            aria-invalid={Boolean(errors.studentNumber)}
            onChange={(event) => setValues((current) => ({ ...current, studentNumber: event.target.value }))}
          />
          {errors.studentNumber ? <small>{errors.studentNumber}</small> : null}
        </label>
        {errors.duplicate ? <p className="form-error" role="alert">{errors.duplicate}</p> : null}
        <button className="pill-button pill-button--purple login-modal__submit" type="submit" disabled={submitting}>
          {submitting ? '登录中...' : '确认登录'}
        </button>
      </form>
    </div>
  );
}
