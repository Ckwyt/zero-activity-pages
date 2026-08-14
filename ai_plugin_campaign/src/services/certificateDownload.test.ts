import { describe, expect, it, vi } from 'vitest';
import {
  createCertificateFilename,
  downloadCertificatePng,
  loadImageForCanvas,
} from './certificateDownload';

describe('certificate PNG download', () => {
  it('creates a filesystem-safe student certificate filename', () => {
    expect(createCertificateFilename(' 林/川:* ')).toBe('ZERO学习证明-林_川__.png');
    expect(createCertificateFilename('   ')).toBe('ZERO学习证明-学生.png');
  });

  it('loads CDN certificate assets in anonymous CORS mode before assigning src', async () => {
    const assignments: string[] = [];
    let assignedCrossOrigin = '';
    const image = {
      get crossOrigin() {
        return assignedCrossOrigin;
      },
      set crossOrigin(value: string) {
        assignedCrossOrigin = value;
      },
      decoding: 'auto',
      onload: null,
      onerror: null,
      set src(value: string) {
        assignments.push(`${assignedCrossOrigin}:${value}`);
      },
    } as unknown as HTMLImageElement;

    const loading = loadImageForCanvas('https://cdn.example.test/certificate.png', () => image);
    image.onload?.(new Event('load'));

    await expect(loading).resolves.toBe(image);
    expect(image.crossOrigin).toBe('anonymous');
    expect(assignments).toEqual(['anonymous:https://cdn.example.test/certificate.png']);
  });

  it('renders a high-resolution certificate and saves it directly', async () => {
    const context = {
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      drawImage: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: text.length * 38 })),
      textAlign: 'left',
      textBaseline: 'alphabetic',
      font: '',
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D;
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['certificate'], { type: 'image/png' }))),
    } as unknown as HTMLCanvasElement;
    const saveBlob = vi.fn();

    await expect(downloadCertificatePng(
      { studentName: '成宽' },
      {
        createCanvas: () => canvas,
        loadImage: vi.fn(async () => ({} as CanvasImageSource)),
        saveBlob,
      },
    )).resolves.toBe('ZERO学习证明-成宽.png');

    expect(canvas).toMatchObject({ width: 1754, height: 1243 });
    expect(context.fillText).toHaveBeenCalledWith('姓名：成宽', 158, 568);
    expect(saveBlob).toHaveBeenCalledWith(expect.any(Blob), 'ZERO学习证明-成宽.png');
  });
});
