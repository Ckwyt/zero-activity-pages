import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudentLoginModal } from './StudentLoginModal';

describe('StudentLoginModal school search', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    HTMLElement.prototype.scrollIntoView = vi.fn();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('opens from the school field, filters while typing, and selects a result', () => {
    act(() => {
      root.render(<StudentLoginModal deviceId="test-device" onSubmit={vi.fn()} />);
    });

    const schoolInput = container.querySelector<HTMLInputElement>('input[role="combobox"]');
    expect(schoolInput).not.toBeNull();
    expect(schoolInput?.placeholder).toBe('请选择或搜索您的学校');

    act(() => schoolInput?.focus());
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();

    act(() => {
      if (!schoolInput) return;
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      valueSetter?.call(schoolInput, '北京航空');
      schoolInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const options = [...container.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((option) => option.textContent)).toEqual(['北京航空航天大学']);

    act(() => options[0]?.click());
    expect(schoolInput?.value).toBe('北京航空航天大学');
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });
});
