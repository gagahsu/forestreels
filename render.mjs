// 用法：node render.mjs <props.json> <out.mp4> [--frames=0-90] [--still=120] [--cover-only]
// 輸出整支 mp4 時，同時輸出封面 <out>_cover.png（ReelCover）；--cover-only 只輸出封面
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
const [inp, out = 'out/reel.mp4', ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.map((a) => a.replace(/^--/, '').split('=')));
const props = JSON.parse(fs.readFileSync(inp, 'utf8'));
const browserExecutable = process.env.REMOTION_CHROME || undefined;
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public') });
fs.mkdirSync(path.dirname(out), { recursive: true });
const coverOut = out.replace(/\.mp4$/, '') + '_cover.png';
const renderCover = async () => {
  const cover = await selectComposition({ serveUrl, id: 'ReelCover', inputProps: props, browserExecutable });
  await renderStill({ serveUrl, composition: cover, inputProps: props, output: coverOut, frame: 0, browserExecutable });
  console.log('→', coverOut);
};
if ('cover-only' in opt) {
  await renderCover();
  process.exit(0);
}
const composition = await selectComposition({ serveUrl, id: 'StoryReel', inputProps: props, browserExecutable });
if (opt.still) {
  await renderStill({ serveUrl, composition, inputProps: props, output: out, frame: +opt.still, browserExecutable });
} else {
  await renderMedia({ serveUrl, composition, inputProps: props, codec: 'h264', outputLocation: out, browserExecutable, crf: 20,
    frameRange: opt.frames ? opt.frames.split('-').map(Number) : undefined,
    onProgress: ({ progress }) => process.stdout.write(`\r${(progress * 100).toFixed(0)}%`) });
}
console.log('\n→', out, `${composition.durationInFrames} frames`);
if (!opt.still && !opt.frames) await renderCover();
