import { useRef } from 'react';

export function CertificateModal({
  studentName,
  school,
  onClose,
  onGenerated,
}: {
  studentName: string;
  school: string;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const certificateRef = useRef<HTMLDivElement>(null);

  function downloadCertificate() {
    onGenerated();
    window.print();
  }

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-labelledby="certificate-title">
      <div className="certificate-modal">
        <button className="modal-close" type="button" aria-label="关闭" onClick={onClose}>×</button>
        <h2 id="certificate-title">领取学习证明</h2>
        <div className="certificate" ref={certificateRef}>
          <img src="/assets/figma/certificate-bg.png" alt="" />
          <div className="certificate__content">
            <h3>学习证明</h3>
            <span className="certificate__line" />
            <p className="certificate__name">姓名：<strong>{studentName}</strong></p>
            <p className="certificate__body">
              该同学积极参与“智启青年・洞见 AI 未来”学习体验活动，完成主题课程学习、AI 问答互动及学习总结，表现优秀，特发此证，以资鼓励！
            </p>
            <p className="certificate__school">{school}<br />ZERO 浏览器活动组委会</p>
          </div>
        </div>
        <button className="pill-button pill-button--orange certificate-modal__action" type="button" onClick={downloadCertificate}>
          立即领取
        </button>
      </div>
    </div>
  );
}
