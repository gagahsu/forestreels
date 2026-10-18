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

/** Reel 上的文字，依語言切換（props 的 lang；沒寫就是中文）。
 *  英文版（podcast 的 episodes/en/*_en.md）：節目名 Why Forest，角色名音譯。 */
export type Lang = 'zh' | 'en';
export const TEXT: Record<Lang, { brand: string; aiLabel: string; outro: string; tagline: string; ep: (no: number) => string; charsPerSec: number }> = {
  zh: { brand: T.brand, aiLabel: T.aiLabel, outro: T.outro, tagline: '睡前故事 podcast', ep: (no) => `第 ${no} 集`, charsPerSec: T.charsPerSec },
  en: { brand: 'Why Forest', aiLabel: 'AI voice', outro: 'Full story on the Why Forest podcast', tagline: 'Bedtime story podcast', ep: (no) => `Episode ${no}`,
    charsPerSec: 13 },  // 無聲預覽用：英文以字母數估算（約每秒 2.2 個單字）
};
export const textOf = (lang?: Lang) => TEXT[lang ?? 'zh'];

/** 角色 → 顯示名稱的顏色與頭像底色。名稱要跟 podcast 腳本的 @角色 一致（英文版腳本也用中文的角色名）。 */
// img：public/ 底下的頭像（從 charaters.png 裁切），沒有圖的角色用 emoji
// en：英文版畫面上顯示的名字（音譯）
export const CHARACTERS: Record<string, { color: string; emoji: string; img?: string; en?: string }> = {
  旁白: { color: '#C9D6FF', emoji: '📖', en: 'Narrator' },
  栗栗: { color: '#F2A65A', emoji: '🐿️', img: 'characters/lili.png', en: 'Lili' },
  棉棉: { color: '#F7C6D9', emoji: '🐰', img: 'characters/mianmian.png', en: 'Mumu' },
  咕咕爺爺: { color: '#B9A37E', emoji: '🦉', img: 'characters/gugu.png', en: 'Grandpa Gugu' },
};
export const charOf = (s: string): (typeof CHARACTERS)[string] => CHARACTERS[s] ?? { color: '#DDDDDD', emoji: '💬' };
export const nameOf = (s: string, lang?: Lang) => (lang === 'en' ? CHARACTERS[s]?.en ?? s : s);
