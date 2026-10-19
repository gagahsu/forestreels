import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, random, staticFile, useCurrentFrame } from 'remotion';
import { T, Lang, charOf, nameOf, textOf } from './theme';
import { tw } from './anim';
import { Captions } from './components/Captions';
import { RoughMark } from './components/Rough';

/** 一句台詞。start/end 是音檔裡的秒數（來自 podcast 的 timeline.json）；沒有就依字數估算。
 *  audio：這句用別的音檔（Reel 旁白），沒寫就用整集 mp3。
 *  role：hook = 開場的旁白提問，outro = 片尾的旁白導流，各自有專用畫面。 */
export type Line = { speaker: string; text: string; start?: number; end?: number; audio?: string; role?: 'hook' | 'outro' };
export type StoryProps = {
  lang?: Lang;       // 'en' = 英文版（畫面文字、角色名、字幕切法）；沒寫就是中文
  episode: { no: number; title: string; question: string };
  audio?: string;    // public/ 相對路徑：整集 mp3
  maxGap?: number;   // 秒：句間停頓最長多久（podcast 的停頓 2–3 秒，Reel 裡太長）
  bed?: { src: string; volume: number };  // 連續的環境音，蓋住每句剪接之間的空白
  lines: Line[];
};

const PAD = 0.12;  // 秒：每句前後多留一點，避免切到字頭字尾
const SWITCH_GAP = 0.8;  // 秒：換音檔（旁白 ↔ 正片）時的停頓，兩邊的秒數不能互減
const LEAD = 0.3;        // 秒：有旁白提問時，片頭只留這麼一點空白
const TAIL = 1.5;        // 秒：旁白導流說完後，片尾畫面再停多久

/** 去掉 Gemini 聲音標記（<chuckle>、<yawn>…），字幕不顯示 */
export const clean = (s: string) => s.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/** 唯一的時間軸計算：Root 的 calculateMetadata 也用它，時間邏輯只能放這裡。
 *  每句依序排：上一句結束 + min(原本的停頓, maxGap)；換音檔時固定停 SWITCH_GAP。
 *  沒有時間資料時依字數估算（無聲預覽）。
 *  第一句是 hook 就不放片頭卡；最後一句是 outro 就不放片尾卡（改由旁白畫面收尾）。 */
export function timeline(p: StoryProps) {
  const fps = T.FPS, maxGap = p.maxGap ?? 0.6;
  const hasHook = p.lines[0]?.role === 'hook', hasOutro = p.lines[p.lines.length - 1]?.role === 'outro';
  const intro = Math.round((hasHook ? LEAD : T.introSec) * fps);
  const timed = p.lines.every((l) => l.start != null && l.end != null);
  let pos = intro;
  const lines = p.lines.map((l, i) => {
    const dur = timed ? l.end! - l.start! : Math.max(1, clean(l.text).length / textOf(p.lang).charsPerSec);
    const next = p.lines[i + 1];
    const gap = !next ? 0
      : next.audio !== l.audio || l.role || next.role ? Math.max(SWITCH_GAP, maxGap)
      : timed ? Math.max(0, Math.min(next.start! - l.end!, maxGap)) : maxGap;
    const from = pos, frames = Math.max(1, Math.round(dur * fps));
    pos = from + frames + Math.round(gap * fps);
    return { ...l, text: clean(l.text), from, frames };
  });
  const last = lines[lines.length - 1];
  const storyEnd = last ? last.from + last.frames + Math.round(0.6 * fps) : intro;
  const total = hasOutro ? last.from + last.frames + Math.round(TAIL * fps) : storyEnd + Math.round(T.outroSec * fps);
  // 角色段落（有頭像和標題列）的範圍
  const story = lines.filter((l) => !l.role);
  const bodyFrom = story[0]?.from ?? intro;
  const bodyTo = hasOutro ? last.from : storyEnd;
  return { intro, timed, lines, storyEnd, total, hasHook, hasOutro, bodyFrom, bodyTo };
}

/** 一句的聲音：從整集 mp3 剪出 [start-PAD, end+PAD]，前後 3 格淡入淡出避免爆音 */
const LineAudio: React.FC<{ src: string; start: number; end: number; frames: number }> = ({ src, start, end, frames }) => {
  const fps = T.FPS, pad = Math.round(PAD * fps), n = frames + 2 * pad;
  return (
    <Audio src={staticFile(src)} trimBefore={Math.max(0, Math.round((start - PAD) * fps))} trimAfter={Math.round((end + PAD) * fps)}
      volume={(f) => Math.max(0, Math.min(1, f / 3, (n - f) / 3))} />
  );
};

const Sky: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${T.sky}, ${T.skyLow})` }}>
      {Array.from({ length: 40 }, (_, i) => {
        const tw_ = 0.45 + 0.55 * Math.abs(Math.sin(f / 25 + i * 1.7));
        return <div key={i} style={{ position: 'absolute', left: random(`x${i}`) * T.W, top: random(`y${i}`) * 900, width: 6, height: 6, borderRadius: 3, background: '#fff', opacity: tw_ * 0.8 }} />;
      })}
      <div style={{ position: 'absolute', right: 120, top: 330, width: 170, height: 170, borderRadius: '50%', background: T.moon, boxShadow: `0 0 80px 20px ${T.moon}55` }} />
    </AbsoluteFill>
  );
};

const Header: React.FC<{ ep: StoryProps['episode']; lang?: Lang }> = ({ ep, lang }) => (
  <AbsoluteFill style={{ fontFamily: T.font, pointerEvents: 'none' }}>
    <div style={{ position: 'absolute', top: 70, left: 60, color: T.cream, fontSize: 40, fontWeight: 900, letterSpacing: 2 }}>{textOf(lang).brand}｜{textOf(lang).ep(ep.no)}</div>
    {/* AI 標示固定顯示：只剪中段時聽不到 podcast 開場的 AI 揭露 */}
    <div style={{ position: 'absolute', top: 66, right: 50, background: T.cream, color: T.ink, fontSize: 28, fontWeight: 900, padding: '8px 18px', borderRadius: 12 }}>{textOf(lang).aiLabel}</div>
    <div style={{ position: 'absolute', top: 160, left: 60, right: 60, color: T.yellow, fontSize: 58, fontWeight: 900, lineHeight: 1.3 }}>{ep.question}</div>
  </AbsoluteFill>
);

/** 說話者頭像（有角色圖用圖，沒有就用 emoji） */
const Speaker: React.FC<{ speaker: string; lang?: Lang }> = ({ speaker, lang }) => {
  const f = useCurrentFrame();
  const c = charOf(speaker);
  const s = tw(f, 0, 12, 'back.out(2)', 0.7, 1);
  const bob = Math.sin(f / 8) * 6;
  return (
    <AbsoluteFill style={{ alignItems: 'center', top: 620, fontFamily: T.font }}>
      <div style={{ position: 'relative', width: 420, height: 420, transform: `scale(${s}) translateY(${bob}px)` }}>
        <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 200, overflow: 'hidden' }}>
          {c.img ? <Img src={staticFile(c.img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : c.emoji}
        </div>
        <RoughMark w={420} h={420} color={T.cream} sw={6} seed={speaker.length} />
      </div>
      <div style={{ marginTop: 20, color: c.color, fontSize: 52, fontWeight: 900, letterSpacing: lang === 'en' ? 1 : 4 }}>{nameOf(speaker, lang)}</div>
    </AbsoluteFill>
  );
};

/** 開場：旁白提問。問題放大（「孩子問你」交給字幕），字幕在下面跟著旁白念 */
const HookCard: React.FC<{ ep: StoryProps['episode']; lang?: Lang }> = ({ ep, lang }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ fontFamily: T.font, textAlign: 'center', alignItems: 'center' }}>
      <div style={{ position: 'absolute', top: 66, right: 50, background: T.cream, color: T.ink, fontSize: 28, fontWeight: 900, padding: '8px 18px', borderRadius: 12 }}>{textOf(lang).aiLabel}</div>
      <div style={{ margin: '620px 60px 0', color: T.yellow, fontSize: 84, fontWeight: 900, lineHeight: 1.3, opacity: tw(f, 4, 16), transform: `scale(${tw(f, 4, 18, 'back.out(1.6)', 0.85, 1)})` }}>{ep.question}</div>
    </AbsoluteFill>
  );
};

/** 片尾：旁白導流。三個角色的夜景合照（上下邊緣淡進夜空、慢慢推近）＋節目名 */
const OutroCard: React.FC<{ lang?: Lang }> = ({ lang }) => {
  const f = useCurrentFrame();
  const fade = 'linear-gradient(transparent, #000 12%, #000 80%, transparent)';
  return (
    <AbsoluteFill style={{ fontFamily: T.font, textAlign: 'center', alignItems: 'center', opacity: tw(f, 0, 10) }}>
      <div style={{ position: 'absolute', top: 200, width: T.W, height: T.W, overflow: 'hidden', WebkitMaskImage: fade, maskImage: fade }}>
        <Img src={staticFile('characters/outro.png')} style={{ width: '100%', display: 'block', transform: `scale(${1 + f * 0.0004})` }} />
      </div>
      <div style={{ position: 'absolute', top: 1200, width: '100%', color: T.yellow, fontSize: 88, fontWeight: 900, letterSpacing: 6, textShadow: '0 4px 18px #000a' }}>{textOf(lang).brand}</div>
      <div style={{ position: 'absolute', top: 1320, width: '100%', color: T.cream, fontSize: 40, fontWeight: 700, textShadow: '0 2px 10px #000a' }}>{textOf(lang).tagline}</div>
      <div style={{ position: 'absolute', top: 66, right: 50, background: T.cream, color: T.ink, fontSize: 28, fontWeight: 900, padding: '8px 18px', borderRadius: 12 }}>{textOf(lang).aiLabel}</div>
    </AbsoluteFill>
  );
};

const Card: React.FC<{ big: string; small: string }> = ({ big, small }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily: T.font, textAlign: 'center', padding: 80, opacity: tw(f, 0, 10) }}>
      <div style={{ color: T.cream, fontSize: 44, fontWeight: 700, marginBottom: 30 }}>{small}</div>
      <div style={{ color: T.yellow, fontSize: 80, fontWeight: 900, lineHeight: 1.3 }}>{big}</div>
    </AbsoluteFill>
  );
};

export const StoryReel: React.FC<StoryProps> = (p) => {
  const tl = timeline(p);
  return (
    <AbsoluteFill style={{ background: T.sky }}>
      <Sky />
      {p.audio && tl.timed && tl.lines.map((l, i) => {
        const pad = Math.round(PAD * T.FPS);
        return (
          <Sequence key={`a${i}`} from={Math.max(0, l.from - pad)} durationInFrames={l.frames + 2 * pad}>
            <LineAudio src={l.audio ?? p.audio!} start={l.start!} end={l.end!} frames={l.frames} />
          </Sequence>
        );
      })}
      {p.bed && (
        <Audio src={staticFile(p.bed.src)} loop
          volume={(f) => p.bed!.volume * Math.min(1, f / 15, Math.max(0, (tl.total - f) / 30))} />
      )}
      {!tl.hasHook && (
        <Sequence durationInFrames={tl.intro}>
          <Card small={`${textOf(p.lang).brand}｜${textOf(p.lang).ep(p.episode.no)}`} big={p.episode.question} />
        </Sequence>
      )}
      {tl.lines.map((l, i) => {
        // 停頓時字幕留在畫面上，直到下一句開始；hook 從第 0 格開始，outro 留到片尾
        const from = l.role === 'hook' ? 0 : l.from;
        const until = l.role === 'outro' ? tl.total : i + 1 < tl.lines.length ? tl.lines[i + 1].from : tl.storyEnd;
        return (
          <Sequence key={i} from={from} durationInFrames={Math.max(1, until - from)}>
            {l.role === 'hook' ? <HookCard ep={p.episode} lang={p.lang} /> : l.role === 'outro' ? <OutroCard lang={p.lang} /> : <Speaker speaker={l.speaker} lang={p.lang} />}
            <Sequence from={l.from - from}>
              <Captions narration={l.text} highlights={[]} frames={l.frames} lang={p.lang} />
            </Sequence>
          </Sequence>
        );
      })}
      <Sequence from={tl.bodyFrom} durationInFrames={Math.max(1, tl.bodyTo - tl.bodyFrom)}>
        <Header ep={p.episode} lang={p.lang} />
      </Sequence>
      {!tl.hasOutro && (
        <Sequence from={tl.storyEnd}>
          <Card small={p.episode.title} big={textOf(p.lang).outro} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

/** Reel 封面（靜態圖，render.mjs 輸出 mp4 後一起輸出 out/<集名>_cover.png）。
 *  IG 個人頁格狀只顯示中間 3:4（1080×1440，上下各裁 240），所以文字都放在 y 240–1680 之間。 */
export const ReelCover: React.FC<StoryProps> = ({ episode, lang }) => {
  const fade = 'linear-gradient(transparent, #000 10%, #000 70%, transparent)';
  const t = textOf(lang);
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${T.sky}, ${T.skyLow})`, fontFamily: T.font, textAlign: 'center', alignItems: 'center' }}>
      {/* 只有星星：角色圖裡已經有月亮，再畫 Sky 的月亮會疊在一起 */}
      {Array.from({ length: 30 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: random(`cx${i}`) * T.W, top: random(`cy${i}`) * 360, width: 6, height: 6, borderRadius: 3, background: '#fff', opacity: 0.3 + 0.5 * random(`co${i}`) }} />
      ))}
      <div style={{ position: 'absolute', top: 340, width: T.W, height: T.W, overflow: 'hidden', WebkitMaskImage: fade, maskImage: fade }}>
        <Img src={staticFile('characters/outro.png')} style={{ width: '100%', display: 'block' }} />
      </div>
      <div style={{ position: 'absolute', top: 270, right: 50, background: T.cream, color: T.ink, fontSize: 28, fontWeight: 900, padding: '8px 18px', borderRadius: 12 }}>{t.aiLabel}</div>
      <div style={{ position: 'absolute', top: 1210, width: '100%', color: T.cream, fontSize: 44, fontWeight: 900, letterSpacing: lang === 'en' ? 2 : 4, textShadow: '0 2px 12px #000c' }}>{t.brand}｜{t.ep(episode.no)}</div>
      <div style={{ position: 'absolute', top: 1300, left: 60, right: 60, color: T.yellow, fontSize: lang === 'en' ? 84 : 82, fontWeight: 900, lineHeight: 1.25, textWrap: 'balance', textShadow: '0 6px 24px #000c' } as React.CSSProperties}>{episode.question}</div>
    </AbsoluteFill>
  );
};
