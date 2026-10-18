// 每週圖文貼文：輸出 out/posts/<貼文名>/01.png ~ NN.png（1080×1350）和 caption.txt
// 用法：node scripts/render-post.mjs data/posts/<貼文名>.json
// 著色畫另外輸出 A4 列印版 out/posts/<貼文名>/print/<集名>.pdf
// 資料格式見 src/PostCards.tsx（coloring＝著色畫、vocab＝英文單字卡）。不呼叫任何 API。
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const inp = process.argv[2];
if (!inp) { console.error('用法：node scripts/render-post.mjs data/posts/<貼文名>.json'); process.exit(1); }
const post = JSON.parse(fs.readFileSync(inp, 'utf8'));
const name = path.parse(inp).name;
const outDir = path.join('out', 'posts', name);

// 著色畫的線稿要先放進 public/：缺圖就停下來，列出要放的檔名
if (post.type === 'coloring') {
  const missing = post.pages.map((p) => p.image).filter((img) => !fs.existsSync(path.join('public', img)));
  if (missing.length) { console.error(`缺少線稿：${missing.map((m) => `public/${m}`).join('、')}`); process.exit(1); }
}
const pages = post.type === 'coloring' ? post.pages.length : 1 + post.episodes.length;
if (pages > 10) { console.error(`${pages} 張超過 IG 輪播上限 10 張`); process.exit(1); }

const browserExecutable = process.env.REMOTION_CHROME || undefined;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
fs.mkdirSync(outDir, { recursive: true });
for (let page = 1; page <= pages; page++) {
  const inputProps = { post, page };
  const composition = await selectComposition({ serveUrl, id: 'PostCard', inputProps, browserExecutable });
  const output = path.join(outDir, `${String(page).padStart(2, '0')}.png`);
  await renderStill({ serveUrl, composition, inputProps, output, frame: 0, browserExecutable });
  console.log('→', output);
}
// 著色畫另外輸出 A4 列印版 PDF（一集一個檔，檔名照線稿，例如 print/ep01_moon.pdf）
if (post.type === 'coloring') {
  fs.mkdirSync(path.join(outDir, 'print'), { recursive: true });
  for (const p of post.pages) {
    const inputProps = { p };
    const composition = await selectComposition({ serveUrl, id: 'ColoringPrint', inputProps, browserExecutable });
    const output = path.join(outDir, 'print', `${path.parse(p.image).name}.pdf`);
    await renderStill({ serveUrl, composition, inputProps, output, frame: 0, imageFormat: 'pdf', browserExecutable });
    console.log('→', output);
  }
}
if (post.caption) {
  fs.writeFileSync(path.join(outDir, 'caption.txt'), post.caption);
  console.log('→', path.join(outDir, 'caption.txt'));
}
