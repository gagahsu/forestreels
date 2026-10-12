// 用法：node scripts/make-props.mjs data/clips/ep01_moon.json
// 讀 podcast 的 build/<集名>.timeline.json，照選段設定挑出台詞，
// 把整集 mp3 複製到 public/<集名>/、環境音轉成 m4a 放到 public/bed/，寫出 build/<集名>/props.json
// 和 Reel 貼文文案 build/<集名>/caption.txt。
// 有 narration／hook／outro 時，再從 Reel 旁白（podcast 的 episodes/<narration>.md）挑出開場提問和片尾導流，
// 音檔複製到 public/<narration>/narration.mp3。
// 不呼叫任何 API。podcast 位置預設 ../podcast，可用 PODCAST_DIR 改。
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const specPath = process.argv[2];
if (!specPath) { console.error('用法：node scripts/make-props.mjs <選段設定.json>'); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const podcast = path.resolve(process.env.PODCAST_DIR || '../podcast');
const ep = spec.episode;
const tlPath = path.join(podcast, 'build', `${ep}.timeline.json`);
const mp3 = path.join(podcast, 'build', `${ep}.mp3`);
for (const f of [tlPath, mp3]) if (!fs.existsSync(f)) {
  console.error(`找不到 ${f}\n先在 podcast 執行：python generate_episode.py episodes/${ep}.md --offline --timeline-only`);
  process.exit(1);
}
const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
// 時間軸是在 mp3 之後才產生的：腳本改過但沒重新生成時，兩者會對不上
const ffprobe = (process.env.FFMPEG || 'ffmpeg').replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
const checkLength = (file, t) => {
  let dur;
  try { dur = +execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString(); }
  catch (e) { console.warn('（沒有 ffprobe，略過 mp3 長度核對）'); return; }
  if (Math.abs(dur - t.seconds) > 0.5) { console.error(`${path.basename(file)} 長 ${dur.toFixed(2)} 秒，時間軸是 ${t.seconds} 秒，對不上；請重新生成`); process.exit(1); }
};
checkLength(mp3, tl);

/** 用台詞片段找唯一的一句，找不到或不只一句就停下（不猜） */
const findIn = (t, snip) => {
  const hits = t.lines.map((l, i) => (l.text.includes(snip) ? i : -1)).filter((i) => i >= 0);
  if (hits.length !== 1) { console.error(`「${snip}」對到 ${hits.length} 句，請改用更長、唯一的片段`); process.exit(1); }
  return hits[0];
};
const find = (snip) => findIn(tl, snip);
const picked = [];
for (const [a, b = a] of spec.ranges) {
  const [i, j] = [find(a), find(b)];
  if (j < i) { console.error(`「${b}」在「${a}」之前`); process.exit(1); }
  for (let k = i; k <= j; k++) picked.push(tl.lines[k]);
}

// Reel 旁白：開場提問（hook）和片尾導流（outro）
let hook, outro;
if (spec.hook || spec.outro) {
  if (!spec.narration) { console.error('有 hook／outro 就要寫 narration（podcast 的 Reel 旁白腳本名稱，例如 reels_s1）'); process.exit(1); }
  const nTl = path.join(podcast, 'build', `${spec.narration}.timeline.json`);
  const nMp3 = path.join(podcast, 'build', `${spec.narration}.mp3`);
  for (const f of [nTl, nMp3]) if (!fs.existsSync(f)) { console.error(`找不到 ${f}
先在 podcast 生成 episodes/${spec.narration}.md`); process.exit(1); }
  const nt = JSON.parse(fs.readFileSync(nTl, 'utf8'));
  checkLength(nMp3, nt);
  const dir = path.join('public', spec.narration);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(nMp3, path.join(dir, 'narration.mp3'));
  const audio = `${spec.narration}/narration.mp3`;
  const take = (snip, role) => ({ ...nt.lines[findIn(nt, snip)], audio, role });
  if (spec.hook) hook = take(spec.hook, 'hook');
  if (spec.outro) outro = take(spec.outro, 'outro');
}

const pub = path.join('public', ep);
fs.mkdirSync(pub, { recursive: true });
fs.copyFileSync(mp3, path.join(pub, 'episode.mp3'));
let bed;
if (spec.bed) {
  const src = path.join(podcast, 'assets', spec.bed);
  const out = path.join('public', 'bed', path.parse(spec.bed).name + '.m4a');
  if (!fs.existsSync(out)) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-v', 'error', '-i', src, '-ac', '1', '-c:a', 'aac', '-b:a', '96k', out]);
  }
  bed = { src: path.relative('public', out).split(path.sep).join('/'), volume: spec.bedVolume ?? 0.15 };
}
const props = {
  episode: { no: spec.no, title: spec.title, question: spec.question },
  audio: `${ep}/episode.mp3`,
  maxGap: spec.maxGap ?? 0.6,
  bed,
  lines: [hook, ...picked, outro].filter(Boolean),
};
const outPath = path.join('build', ep, 'props.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(props, null, 1));

// Reel 貼文文案（寫給家長看）：固定格式，只換問題、集數和 emoji
const caption = `孩子問「${spec.question}」你會怎麼回答？${spec.emoji ?? ''}

給 3–6 歲孩子的睡前故事 podcast，每集回答一個孩子的「為什麼」
完整集數 🔍 為什麼森林 EP${spec.no} ${spec.question}｜兒童睡前故事
🎧 收聽連結在主頁

故事由人與 AI 共同創作，聲音由 AI 生成。

#睡前故事 #為什麼森林
`;
fs.writeFileSync(path.join('build', ep, 'caption.txt'), caption);

const secs = (ls) => ls.reduce((s, l) => s + l.end - l.start, 0);
const extra = [hook, outro].filter(Boolean);
console.log(`角色 ${picked.length} 句、說話 ${secs(picked).toFixed(1)} 秒；旁白 ${extra.length} 句、${secs(extra).toFixed(1)} 秒 → ${outPath}（貼文文案在同一個資料夾的 caption.txt）`);
