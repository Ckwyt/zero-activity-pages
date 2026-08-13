import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDir = resolve('output');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

console.log('部署输出目录已清理，准备生成本次最新产物');
