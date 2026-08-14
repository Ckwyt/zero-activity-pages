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

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
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
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('证书图片生成失败'));
    }, 'image/png');
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

  const imageLoader = dependencies.loadImage ?? loadImage;
  const [background, divider] = await Promise.all([
    imageLoader(CERTIFICATE_BACKGROUND),
    imageLoader(CERTIFICATE_DIVIDER),
  ]);

  context.drawImage(background, 0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);

  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  context.font = '500 112px "STSong", "Songti SC", serif';
  const titleGradient = context.createLinearGradient(570, 0, 1184, 0);
  titleGradient.addColorStop(0, '#c69032');
  titleGradient.addColorStop(0.5, '#e0bd70');
  titleGradient.addColorStop(1, '#c69032');
  context.fillStyle = titleGradient;
  context.fillText('学习证明', CERTIFICATE_WIDTH / 2, 304);
  context.drawImage(divider, 648, 340, 458, 10);

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
