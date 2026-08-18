import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CertificateModal } from './CertificateModal';

describe('CertificateModal', () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('notifies the page only after the certificate dialog mounts', () => {
    const onOpened = vi.fn();
    expect(onOpened).not.toHaveBeenCalled();

    act(() => {
      root.render(
        <CertificateModal
          studentName="测试用户"
          onClose={vi.fn()}
          onGenerated={vi.fn()}
          onOpened={onOpened}
        />,
      );
    });

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(onOpened).toHaveBeenCalledOnce();
  });
});
