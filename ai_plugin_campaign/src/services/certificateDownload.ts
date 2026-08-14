const CERTIFICATE_WIDTH = 1754;
const CERTIFICATE_HEIGHT = 1243;
const CERTIFICATE_BACKGROUND = '/assets/figma/certificate-bg.png';
const CERTIFICATE_DIVIDER = '/assets/figma/certificate-divider.png';

interface CertificateDownloadOptions {
  studentName: string;
}

interface CertificateDownloadDependencies {
  createCanvas?: () => HTMLCanvasElement;
  loadImage?: (source: string) => Promise<CanvasImageSource>;
  saveBlob?: (blob: Blob, filename: string) => void;
}

export function loadImageForCanvas(
  source: string,
  createImage: () => HTMLImageElement = () => new Image(),
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = createImage();
    // CDN 图片必须以 CORS 模式加载，否则 drawImage 后 Canvas 会被污染，无法导出 PNG。
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`证书资源加载失败：${source}`));
    image.src = source;
  });
}

function createCanvas() {
  return document.createElement('canvas');
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('证书图片生成失败'));
      }, 'image/png');
    } catch (error) {
      reject(new Error('证书图片导出失败，请刷新页面后重试', { cause: error }));
    }
  });
}

function saveBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  let line = '';
  let currentY = y;
  for (const character of Array.from(text)) {
    const nextLine = `${line}${character}`;
    if (line && context.measureText(nextLine).width > maxWidth) {
      context.fillText(line, x, currentY);
      line = character;
      currentY += lineHeight;
    } else {
      line = nextLine;
    }
  }
  if (line) context.fillText(line, x, currentY);
}

function drawFallbackBackground(context: CanvasRenderingContext2D) {
  context.save();
  context.fillStyle = '#5d83bd';
  context.fillRect(0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);
  context.fillStyle = '#fff';
  context.fillRect(34, 34, CERTIFICATE_WIDTH - 68, CERTIFICATE_HEIGHT - 68);

  context.save();
  context.beginPath();
  context.rect(58, 58, CERTIFICATE_WIDTH - 116, CERTIFICATE_HEIGHT - 116);
  context.clip();
  context.globalAlpha = 0.42;
  context.strokeStyle = '#e7ebf2';
  context.lineWidth = 2;
  for (let offset = -CERTIFICATE_HEIGHT; offset < CERTIFICATE_WIDTH; offset += 72) {
    context.beginPath();
    context.moveTo(offset, 58);
    context.lineTo(offset + CERTIFICATE_HEIGHT, CERTIFICATE_HEIGHT - 58);
    context.stroke();
    context.beginPath();
    context.moveTo(offset + CERTIFICATE_HEIGHT, 58);
    context.lineTo(offset, CERTIFICATE_HEIGHT - 58);
    context.stroke();
  }
  context.restore();

  context.strokeStyle = '#547db8';
  context.lineWidth = 5;
  context.strokeRect(60, 60, CERTIFICATE_WIDTH - 120, CERTIFICATE_HEIGHT - 120);
  context.restore();
}

function drawFallbackDivider(context: CanvasRenderingContext2D) {
  const dividerGradient = context.createLinearGradient(648, 0, 1106, 0);
  dividerGradient.addColorStop(0, 'rgba(198,144,50,0)');
  dividerGradient.addColorStop(0.5, '#d9ae5f');
  dividerGradient.addColorStop(1, 'rgba(198,144,50,0)');
  context.fillStyle = dividerGradient;
  context.fillRect(648, 340, 458, 10);
}

export function createCertificateFilename(studentName: string) {
  const safeName = studentName.trim().replace(/[\\/:*?"<>|]/g, '_') || '学生';
  return `ZERO学习证明-${safeName}.png`;
}

/** 按设计稿生成 1754×1243 的高清 PNG 并直接下载。 */
export async function downloadCertificatePng(
  { studentName }: CertificateDownloadOptions,
  dependencies: CertificateDownloadDependencies = {},
) {
  const canvas = (dependencies.createCanvas ?? createCanvas)();
  canvas.width = CERTIFICATE_WIDTH;
  canvas.height = CERTIFICATE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('当前浏览器无法生成证书图片');

  const imageLoader = dependencies.loadImage ?? loadImageForCanvas;
  const [background, divider] = await Promise.allSettled([
    imageLoader(CERTIFICATE_BACKGROUND),
    imageLoader(CERTIFICATE_DIVIDER),
  ]);

  if (background.status === 'fulfilled') {
    context.drawImage(background.value, 0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);
  } else {
    console.warn('[Certificate] 背景图加载失败，已使用本地绘制的安全底图。', background.reason);
    drawFallbackBackground(context);
  }

  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.font = '500 112px "STSong", "Songti SC", serif';
  const titleGradient = context.createLinearGradient(570, 0, 1184, 0);
  titleGradient.addColorStop(0, '#c69032');
  titleGradient.addColorStop(0.5, '#e0bd70');
  titleGradient.addColorStop(1, '#c69032');
  context.fillStyle = titleGradient;
  context.fillText('学习证明', CERTIFICATE_WIDTH / 2, 304);
  if (divider.status === 'fulfilled') {
    context.drawImage(divider.value, 648, 340, 458, 10);
  } else {
    console.warn('[Certificate] 分隔线加载失败，已使用本地绘制的安全样式。', divider.reason);
    drawFallbackDivider(context);
  }

  context.textAlign = 'left';
  context.fillStyle = '#121b29';
  context.font = '600 44px "PingFang SC", "Microsoft YaHei", sans-serif';
  context.fillText(`姓名：${studentName.trim()}`, 158, 568);

  context.font = '400 38px "PingFang SC", "Microsoft YaHei", sans-serif';
  drawWrappedText(
    context,
    '恭喜您已完成「智启青年·洞见AI未来」活动的全部学习内容，并达到本项目规定的学习要求，表现符合结业标准。',
    158,
    654,
    1438,
    68,
  );
  context.fillText('特发此证，以资鼓励！', 158, 858);

  const blob = await canvasToBlob(canvas);
  const filename = createCertificateFilename(studentName);
  (dependencies.saveBlob ?? saveBlob)(blob, filename);
  return filename;
}
