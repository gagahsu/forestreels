// IG 自我介紹輪播：輸出 out/intro/01.png ~ NN.png（1080×1350）
// 用法：node scripts/render-intro.mjs [輸出資料夾]
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const outDir = process.argv[2] ?? 'out/intro';
const PAGES = 6;  // 跟 src/IntroCards.tsx 的 PAGES 數量一致
const browserExecutable = process.env.REMOTION_CHROME || undefined;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
fs.mkdirSync(outDir, { recursive: true });
for (let page = 1; page <= PAGES; page++) {
  const inputProps = { page };
  const composition = await selectComposition({ serveUrl, id: 'IntroCard', inputProps, browserExecutable });
  const output = path.join(outDir, `${String(page).padStart(2, '0')}.png`);
  await renderStill({ serveUrl, composition, inputProps, output, frame: 0, browserExecutable });
  console.log('→', output);
}
