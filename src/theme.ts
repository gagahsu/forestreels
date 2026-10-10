export const T = {
  W: 1080, H: 1920, FPS: 30,
  font: '"Noto Sans TC","Noto Sans CJK TC","PingFang TC","Microsoft JhengHei",sans-serif',
  sky: '#14203F',     // 夜空（上）
  skyLow: '#2B3A63',  // 夜空（下）
  moon: '#F6E7B0',
  yellow: '#FFD84A',  // 字幕強調色（Captions 用）
  cream: '#FBF5E6',
  ink: '#1E1E22',
  brand: '為什麼森林',
  aiLabel: 'AI 配音',
  outro: '完整故事在 podcast「為什麼森林」',
  charsPerSec: 4.2,   // 範例資料沒有真實時間時估算用（podcast 語速偏慢）
  introSec: 2.5,      // 片頭卡
  outroSec: 3,        // 片尾卡
};

/** 角色 → 顯示名稱的顏色與頭像底色。名稱要跟 podcast 腳本的 @角色 一致。 */
// img：public/ 底下的頭像（從 charaters.png 裁切），沒有圖的角色用 emoji
export const CHARACTERS: Record<string, { color: string; emoji: string; img?: string }> = {
  旁白: { color: '#C9D6FF', emoji: '📖' },
  栗栗: { color: '#F2A65A', emoji: '🐿️', img: 'characters/lili.png' },
  棉棉: { color: '#F7C6D9', emoji: '🐰', img: 'characters/mianmian.png' },
  咕咕爺爺: { color: '#B9A37E', emoji: '🦉', img: 'characters/gugu.png' },
};
export const charOf = (s: string): (typeof CHARACTERS)[string] => CHARACTERS[s] ?? { color: '#DDDDDD', emoji: '💬' };
