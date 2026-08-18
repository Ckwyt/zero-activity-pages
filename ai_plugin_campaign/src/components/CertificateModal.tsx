import { useEffect, useState } from 'react';
import { downloadCertificatePng } from '../services/certificateDownload';

export function CertificateModal({
  studentName,
  onClose,
  onGenerated,
  onOpened,
}: {
  studentName: string;
  onClose: () => void;
  onGenerated: () => void;
  onOpened?: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    onOpened?.();
  }, [onOpened]);

  async function downloadCertificate() {
    if (downloading) return;
    setDownloading(true);
    setDownloadError('');
    try {
      await downloadCertificatePng({ studentName });
      onGenerated();
      onClose();
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : '证书下载失败，请重试');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="modal-layer modal-layer--certificate" role="dialog" aria-modal="true" aria-labelledby="certificate-title">
      <div className="certificate-modal">
        <button className="certificate-modal__close" type="button" aria-label="关闭" onClick={onClose}>
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="M4 4l12 12M16 4L4 16" />
          </svg>
        </button>
        <h2 id="certificate-title">领取学习证明</h2>
        <div className="certificate">
          <img className="certificate__background" src="assets/figma/certificate-bg.png" alt="" />
          <div className="certificate__content">
            <h3>学习证明</h3>
            <img className="certificate__divider" src="assets/figma/certificate-divider.png" alt="" />
            <p className="certificate__name">姓名：<strong>{studentName}</strong></p>
            <p className="certificate__body">
              恭喜您已完成「智启青年·洞见AI未来」活动的全部学习内容，并达到本项目规定的学习要求，表现符合结业标准。
            </p>
            <p className="certificate__footer">特发此证，以资鼓励！</p>
          </div>
        </div>
        {downloadError ? <p className="certificate-modal__error" role="alert">{downloadError}</p> : null}
        <button
          className="pill-button pill-button--orange certificate-modal__action"
          type="button"
          disabled={downloading}
          onClick={downloadCertificate}
        >
          {downloading ? '正在生成...' : '立即领取'}
        </button>
      </div>
    </div>
  );
}
