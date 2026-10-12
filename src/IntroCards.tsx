import React from 'react';
import { AbsoluteFill, Img, random, staticFile } from 'remotion';
import { T, charOf } from './theme';
import { RoughMark } from './components/Rough';

/** IG 自我介紹輪播（1080×1350，4:5）。一頁一張靜態圖，page 從 1 開始。
 *  用 scripts/render-intro.mjs 一次輸出全部頁面。 */
export const INTRO_W = 1080, INTRO_H = 1350;
export type IntroProps = { page: number };

const Sky: React.FC = () => (
  <AbsoluteFill style={{ background: `linear-gradient(${T.sky}, ${T.skyLow})` }}>
    {Array.from({ length: 36 }, (_, i) => (
      <div key={i} style={{ position: 'absolute', left: random(`ix${i}`) * INTRO_W, top: random(`iy${i}`) * INTRO_H, width: 5, height: 5, borderRadius: 3, background: '#fff', opacity: 0.25 + 0.5 * random(`io${i}`) }} />
    ))}
  </AbsoluteFill>
);

/** 每頁共用：左上品牌、右上 AI 標示、右下頁碼 */
const Frame: React.FC<{ page: number; children: React.ReactNode }> = ({ page, children }) => (
  <AbsoluteFill style={{ fontFamily: T.font, color: T.cream }}>
    <Sky />
    <div style={{ position: 'absolute', top: 56, left: 64, fontSize: 34, fontWeight: 900, letterSpacing: 3 }}>🌙 {T.brand}</div>
    <div style={{ position: 'absolute', top: 52, right: 56, background: T.cream, color: T.ink, fontSize: 26, fontWeight: 900, padding: '6px 16px', borderRadius: 12 }}>{T.aiLabel}</div>
    {children}
    <div style={{ position: 'absolute', bottom: 48, right: 64, fontSize: 28, opacity: 0.6 }}>{page} / {PAGES.length}</div>
  </AbsoluteFill>
);

const Title: React.FC<{ tag: string; children: React.ReactNode }> = ({ tag, children }) => (
  <div style={{ position: 'absolute', top: 170, left: 80, right: 80 }}>
    <div style={{ display: 'inline-block', background: T.yellow, color: T.ink, fontSize: 30, fontWeight: 900, padding: '6px 18px', borderRadius: 10, marginBottom: 24 }}>{tag}</div>
    <div style={{ color: T.yellow, fontSize: 64, fontWeight: 900, lineHeight: 1.35 }}>{children}</div>
  </div>
);

const Avatar: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  const c = charOf(name);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: size * 0.07, borderRadius: '50%', background: c.color, overflow: 'hidden' }}>
        {c.img && <Img src={staticFile(c.img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <RoughMark w={size} h={size} color={T.cream} sw={4} seed={name.length} dur={1} start={-1} />
    </div>
  );
};

const Cover: React.FC = () => {
  const fade = 'linear-gradient(#000 70%, transparent)';
  return (
    <AbsoluteFill style={{ fontFamily: T.font, background: T.sky, textAlign: 'center' }}>
      <div style={{ position: 'absolute', top: 0, width: INTRO_W, height: INTRO_W, WebkitMaskImage: fade, maskImage: fade }}>
        <Img src={staticFile('characters/outro.png')} style={{ width: '100%', display: 'block' }} />
      </div>
      <div style={{ position: 'absolute', top: 52, right: 56, background: T.cream, color: T.ink, fontSize: 26, fontWeight: 900, padding: '6px 16px', borderRadius: 12 }}>{T.aiLabel}</div>
      <div style={{ position: 'absolute', top: 930, width: '100%', color: T.yellow, fontSize: 120, fontWeight: 900, letterSpacing: 10, textShadow: '0 6px 24px #000c' }}>{T.brand}</div>
      <div style={{ position: 'absolute', top: 1095, width: '100%', color: T.cream, fontSize: 46, fontWeight: 700 }}>給 3–6 歲孩子的睡前故事 podcast</div>
      <div style={{ position: 'absolute', top: 1170, width: '100%', color: T.cream, fontSize: 36, opacity: 0.8 }}>每集回答一個孩子的「為什麼」</div>
    </AbsoluteFill>
  );
};

const Mission: React.FC = () => (
  <Frame page={2}>
    <Title tag="我們想做的事">孩子睡前的「為什麼」，<br />是一天裡最可愛的好奇心</Title>
    <div style={{ position: 'absolute', top: 540, left: 80, right: 80, fontSize: 44, lineHeight: 1.75 }}>
      不用一句「快睡覺」打斷它。<br />
      我們用一個溫柔、說得通的小故事回答，<br />
      再陪孩子慢慢放鬆、<span style={{ color: T.yellow, fontWeight: 900 }}>安心睡著</span>。
    </div>
    <div style={{ position: 'absolute', right: 130, top: 930, width: 200, height: 200, borderRadius: '50%', background: T.moon, boxShadow: `0 0 90px 24px ${T.moon}55` }} />
    <div style={{ position: 'absolute', left: 80, top: 980, display: 'flex', gap: 20 }}>
      {FRIENDS.map(([name]) => <Avatar key={name} name={name} size={130} />)}
    </div>
  </Frame>
);

const FRIENDS: [string, string, string][] = [
  ['栗栗', '小松鼠', '住在大橡樹的樹洞，什麼都想問「為什麼」'],
  ['棉棉', '小兔子', '栗栗的好朋友，慢慢的、很容易想睡'],
  ['咕咕爺爺', '貓頭鷹', '晚上醒著守護森林，回答大家的問題'],
];
const Friends: React.FC = () => (
  <Frame page={3}>
    <Title tag="森林裡的朋友">每天晚上，<br />栗栗都會帶著一個問題</Title>
    <div style={{ position: 'absolute', top: 560, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 44 }}>
      {FRIENDS.map(([name, kind, desc]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <Avatar name={name} size={190} />
          <div>
            <div style={{ fontSize: 50, fontWeight: 900, color: charOf(name).color }}>{name}<span style={{ fontSize: 34, color: T.cream, opacity: 0.75, marginLeft: 16 }}>{kind}</span></div>
            <div style={{ fontSize: 36, lineHeight: 1.5, marginTop: 8 }}>{desc}</div>
          </div>
        </div>
      ))}
    </div>
  </Frame>
);

const EACH: [string, string, string][] = [
  ['🌙', '一個孩子真的會問的「為什麼」', '答案簡單、查得到可靠來源'],
  ['🛏️', '躺在床上做的小實驗', '看、聽、想像、慢慢呼吸，不用起床開燈'],
  ['😴', '故事慢慢收到睡覺', '最後栗栗在樹洞裡睡著，咕咕爺爺說晚安'],
  ['🌿', '10 分鐘助眠環境音', '故事約 8 分鐘，之後是蟲鳴和流水聲'],
];
const Episode: React.FC = () => (
  <Frame page={4}>
    <Title tag="每一集有什麼">從好奇，<br />到安心睡著</Title>
    <div style={{ position: 'absolute', top: 560, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 46 }}>
      {EACH.map(([icon, head, sub]) => (
        <div key={head} style={{ display: 'flex', gap: 30, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 64, lineHeight: 1.1 }}>{icon}</div>
          <div>
            <div style={{ fontSize: 46, fontWeight: 900 }}>{head}</div>
            <div style={{ fontSize: 34, opacity: 0.8, marginTop: 6 }}>{sub}</div>
          </div>
        </div>
      ))}
    </div>
  </Frame>
);

const QUESTIONS = ['為什麼月亮會跟著我走？', '魚會睡覺嗎？', '為什麼會打哈欠？', '為什麼天上有星星？', '為什麼螢火蟲會發光？', '為什麼種子會長大？'];
const RELEASED = 1;  // 已上架的集數：QUESTIONS 前幾題標「已上架」，其餘標「即將推出」
const Topics: React.FC = () => (
  <Frame page={5}>
    <Title tag="第一季的問題">你家孩子<br />也問過嗎？</Title>
    <div style={{ position: 'absolute', top: 540, left: 80, right: 80, display: 'flex', flexWrap: 'wrap', gap: 26 }}>
      {QUESTIONS.map((q, i) => {
        const on = i < RELEASED;
        return (
          <div key={q} style={{ background: on ? T.yellow : '#ffffff14', color: on ? T.ink : T.cream, border: `3px solid ${on ? T.yellow : T.cream + '55'}`, borderRadius: 60, padding: '18px 34px', fontSize: 40, fontWeight: on ? 900 : 700, opacity: on ? 1 : 0.75, transform: `rotate(${(random(`q${i}`) - 0.5) * 3}deg)` }}>
            {on && <span style={{ fontSize: 28, marginRight: 12 }}>EP{i + 1}</span>}{q}
          </div>
        );
      })}
    </div>
    <div style={{ position: 'absolute', top: 1110, left: 80, right: 80, fontSize: 38, opacity: 0.85 }}>
      <span style={{ color: T.yellow, fontWeight: 900 }}>{RELEASED === 1 ? '第 1 集' : `第 1–${RELEASED} 集`}已上架</span>，其他「為什麼」即將推出
    </div>
  </Frame>
);

const Listen: React.FC = () => (
  <Frame page={6}>
    <Title tag="收聽方式">今天晚上，<br />陪孩子一起聽吧</Title>
    <div style={{ position: 'absolute', top: 580, left: 80, right: 80, fontSize: 46, lineHeight: 1.9 }}>
      🔍 各大 podcast 平台搜尋<span style={{ color: T.yellow, fontWeight: 900 }}>「為什麼森林」</span><br />
      🎧 <span style={{ fontSize: 38 }}>Spotify・Apple Podcast・KKBOX・SoundOn</span><br />
      👆 收聽連結在主頁
    </div>
    <div style={{ position: 'absolute', top: 960, left: 80, display: 'flex', gap: 24 }}>
      {FRIENDS.map(([name]) => <Avatar key={name} name={name} size={150} />)}
    </div>
    <div style={{ position: 'absolute', bottom: 110, left: 80, right: 80, fontSize: 28, opacity: 0.7 }}>故事由人與 AI 共同創作，聲音由 AI（Gemini TTS）生成。</div>
  </Frame>
);

const PAGES: React.FC[] = [Cover, Mission, Friends, Episode, Topics, Listen];
export const INTRO_PAGES = PAGES.length;

export const IntroCard: React.FC<IntroProps> = ({ page }) => {
  const P = PAGES[page - 1] ?? Cover;
  return <P />;
};
