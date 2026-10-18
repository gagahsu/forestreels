import React from 'react';
import { AbsoluteFill, Img, random, staticFile } from 'remotion';
import { T, charOf } from './theme';
import { RoughMark } from './components/Rough';

/** 每週的圖文貼文（1080×1350，4:5），資料在 data/posts/<貼文>.json，用 scripts/render-post.mjs 輸出。
 *  - coloring（週三，中文）：兩集各一張著色畫。線稿是使用者用 AI 生成的圖，放在 public/coloring/。
 *  - vocab（週六，英文）：封面＋每集一張單字卡（5–8 個關鍵單字＋中文意思＋故事裡的例句）。 */
export const POST_W = 1080, POST_H = 1350;

export type ColoringPost = {
  type: 'coloring';
  pages: { no: number; question: string; image: string }[];   // image：public/ 底下的相對路徑
};
export type VocabPost = {
  type: 'vocab';
  episodes: { no: number; question: string; words: { word: string; zh: string; example: string }[] }[];
};
export type Post = (ColoringPost | VocabPost) & { caption?: string };
export type PostProps = { post: Post; page: number };

/** 貼文有幾張：著色畫一集一張；單字卡是封面＋一集一張 */
export const postPages = (post: Post) => (post.type === 'coloring' ? post.pages.length : 1 + post.episodes.length);

const Sky: React.FC = () => (
  <AbsoluteFill style={{ background: `linear-gradient(${T.sky}, ${T.skyLow})` }}>
    {Array.from({ length: 36 }, (_, i) => (
      <div key={i} style={{ position: 'absolute', left: random(`px${i}`) * POST_W, top: random(`py${i}`) * POST_H, width: 5, height: 5, borderRadius: 3, background: '#fff', opacity: 0.25 + 0.5 * random(`po${i}`) }} />
    ))}
  </AbsoluteFill>
);

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'absolute', top: 52, right: 56, background: T.cream, color: T.ink, fontSize: 26, fontWeight: 900, padding: '6px 16px', borderRadius: 12 }}>{children}</div>
);

/** 著色畫：上面是集數和問題，下面一大張白紙放線稿 */
const Coloring: React.FC<{ p: ColoringPost['pages'][number]; page: number; total: number }> = ({ p, page, total }) => (
  <AbsoluteFill style={{ fontFamily: T.font, color: T.cream }}>
    <Sky />
    <div style={{ position: 'absolute', top: 56, left: 64, fontSize: 34, fontWeight: 900, letterSpacing: 3 }}>🖍️ {T.brand}｜第 {p.no} 集</div>
    {/* 線稿是 AI 生成的圖，跟 Reel 的「AI 配音」一樣標示 */}
    <Badge>AI 繪圖</Badge>
    <div style={{ position: 'absolute', top: 128, left: 64, right: 64, color: T.yellow, fontSize: 52, fontWeight: 900, lineHeight: 1.3 }}>{p.question}</div>
    <div style={{ position: 'absolute', top: 230, left: 56, right: 56, bottom: 110, background: '#fff', borderRadius: 24, padding: 28, boxShadow: '0 8px 30px #0006' }}>
      <Img src={staticFile(p.image)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
    <div style={{ position: 'absolute', bottom: 40, left: 64, fontSize: 30, opacity: 0.85 }}>存下來印出來，陪孩子一起塗顏色</div>
    <div style={{ position: 'absolute', bottom: 40, right: 64, fontSize: 28, opacity: 0.6 }}>{page} / {total}</div>
  </AbsoluteFill>
);

const Avatar: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  const c = charOf(name);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div style={{ position: 'absolute', inset: size * 0.07, borderRadius: '50%', background: c.color, overflow: 'hidden' }}>
        {c.img && <Img src={staticFile(c.img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      <RoughMark w={size} h={size} color={T.cream} sw={4} seed={name.length} dur={1} start={-1} style={{ left: 0, top: 0 }} />
    </div>
  );
};

/** 單字卡封面 */
const VocabCover: React.FC<{ post: VocabPost; total: number }> = ({ post, total }) => (
  <AbsoluteFill style={{ fontFamily: T.font, color: T.cream, textAlign: 'center' }}>
    <Sky />
    <div style={{ position: 'absolute', top: 56, left: 64, fontSize: 34, fontWeight: 900, letterSpacing: 2 }}>🌙 Why Forest</div>
    <div style={{ position: 'absolute', top: 260, width: '100%', fontSize: 40, fontWeight: 700, opacity: 0.85 }}>英文睡前故事裡的單字</div>
    <div style={{ position: 'absolute', top: 330, left: 60, right: 60, color: T.yellow, fontSize: 104, fontWeight: 900, lineHeight: 1.15 }}>Words from<br />the Story</div>
    <div style={{ position: 'absolute', top: 640, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 22 }}>
      {post.episodes.map((e) => (
        <div key={e.no} style={{ fontSize: 40, fontWeight: 700 }}>
          <span style={{ background: T.yellow, color: T.ink, fontWeight: 900, borderRadius: 10, padding: '2px 14px', marginRight: 16, fontSize: 32 }}>EP{e.no}</span>{e.question}
        </div>
      ))}
    </div>
    <div style={{ position: 'absolute', top: 940, width: '100%', display: 'flex', justifyContent: 'center', gap: 24 }}>
      {['栗栗', '棉棉', '咕咕爺爺'].map((n) => <Avatar key={n} name={n} size={150} />)}
    </div>
    <div style={{ position: 'absolute', bottom: 110, width: '100%', fontSize: 34, opacity: 0.85 }}>給爸媽參考：聽完故事，一起說說看 👉</div>
    <div style={{ position: 'absolute', bottom: 40, right: 64, fontSize: 28, opacity: 0.6 }}>1 / {total}</div>
  </AbsoluteFill>
);

/** 一集的單字：單字、中文、故事裡的例句 */
const VocabList: React.FC<{ e: VocabPost['episodes'][number]; page: number; total: number }> = ({ e, page, total }) => {
  const dense = e.words.length > 6;
  return (
    <AbsoluteFill style={{ fontFamily: T.font, color: T.cream }}>
      <Sky />
      <div style={{ position: 'absolute', top: 56, left: 64, fontSize: 34, fontWeight: 900, letterSpacing: 2 }}>🌙 Why Forest｜Episode {e.no}</div>
      <div style={{ position: 'absolute', top: 128, left: 64, right: 64, color: T.yellow, fontSize: 50, fontWeight: 900, lineHeight: 1.25 }}>{e.question}</div>
      <div style={{ position: 'absolute', top: 270, left: 64, right: 64, display: 'flex', flexDirection: 'column', gap: dense ? 18 : 28 }}>
        {e.words.map((w) => (
          <div key={w.word} style={{ borderLeft: `6px solid ${T.yellow}`, paddingLeft: 24 }}>
            <div style={{ fontSize: dense ? 44 : 50, fontWeight: 900 }}>
              {w.word}<span style={{ fontSize: dense ? 34 : 38, fontWeight: 700, color: T.yellow, marginLeft: 20 }}>{w.zh}</span>
            </div>
            <div style={{ fontSize: dense ? 27 : 30, opacity: 0.8, marginTop: 4, fontStyle: 'italic' }}>{w.example}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 40, right: 64, fontSize: 28, opacity: 0.6 }}>{page} / {total}</div>
    </AbsoluteFill>
  );
};

export const PostCard: React.FC<PostProps> = ({ post, page }) => {
  const total = postPages(post);
  if (post.type === 'coloring') return <Coloring p={post.pages[page - 1]} page={page} total={total} />;
  return page === 1 ? <VocabCover post={post} total={total} /> : <VocabList e={post.episodes[page - 2]} page={page} total={total} />;
};
