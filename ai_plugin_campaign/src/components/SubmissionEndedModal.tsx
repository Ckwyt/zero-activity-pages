import { useEffect, useRef } from 'react';

export function SubmissionEndedModal({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLElement>(null);

  useEffect(() => {
    modalRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-layer modal-layer--submission-ended" role="presentation">
      <section
        ref={modalRef}
        className="submission-ended-modal"
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby="submission-ended-title"
        aria-describedby="submission-ended-status"
      >
        <h2 id="submission-ended-title">活动已结束!</h2>
        <p id="submission-ended-status">初审中</p>
        <button
          className="pill-button pill-button--purple submission-ended-modal__action"
          type="button"
          onClick={onClose}
        >
          我知道了
        </button>
      </section>
    </div>
  );
}
