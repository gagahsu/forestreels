# CLAUDE.md

給 Claude Code 在這個 repo 工作時的說明。

## 專案是什麼

把兒童睡前故事 podcast「為什麼森林」（`../podcast`）的某一段，做成 1080×1920 的精華 Reel。用 Remotion 繪製畫面：夜空背景、說話角色的頭像、逐句字幕、片頭／片尾卡。

- 由 `../finreels`（台股盤前 Reel）衍生：`src/anim.ts`、`src/components/Rough.tsx`、`src/components/Captions.tsx`、`render.mjs` 是從那邊複製來的，之後兩邊各自發展，不共用程式碼。
- 使用者在台灣，用 Windows ＋ PowerShell（指令請給 PowerShell 語法），回覆與註解用**繁體中文（台灣用語）**。
- Reel 的觀眾是**家長**（不是睡前的孩子），片尾引導寫給家長看。

## 跟 podcast 的分工

- **這個 repo 不做 TTS，也不呼叫 Gemini。** 聲音一律用 podcast 已經生成、試聽過的音檔。podcast 的 Gemini 免費額度一天只有 10 次，不要為了 Reel 重新配音。
- 時間軸來源：podcast 每次組裝都會輸出 `build/<集名>.timeline.json`（每句的 `speaker`、`text`、`start`、`end`，單位是秒，對應整集 mp3）。已生成的集數在 podcast 執行 `python generate_episode.py episodes/<集名>.md --offline --timeline-only` 補出，不花額度。在 podcast repo 改程式時，要遵守它的 CLAUDE.md（不改快取鍵、用假 SDK 測試、不打真的 API）。
- Reel 結構：**旁白提問（hook）→ 角色選段 → 旁白導流（outro）**。旁白是另外配的「Reel 旁白」，在 podcast 的 `episodes/reels_s1.md`（第一季 13 集的提問＋共用導流，整份 1 次 API，已生成），輸出 `build/reels_s1.mp3`／`.timeline.json`。改它任何字都要整批重新生成。
- 選段設定 `data/clips/<集名>.json`：
  - `ranges` 是 `[起句片段, 迄句片段]` 的清單（只寫一個就是單句），用台詞片段定位，不寫死秒數。片段對不到、或對到不只一句，就停下來，不猜。選「小實驗 → 答案」，角色說話 45–55 秒（加上旁白整支約 70 秒）。
  - `narration`（例如 `reels_s1`）、`hook`、`outro`：從 Reel 旁白用片段挑出開場提問和片尾導流。
- `scripts/make-props.mjs` 會：
  - 核對 mp3 長度跟時間軸是否一致（腳本改過卻沒重新生成時會對不上）
  - 把整集 mp3 複製到 `public/<集名>/episode.mp3`，Reel 旁白複製到 `public/<narration>/narration.mp3`
  - 把環境音轉成 `public/bed/*.m4a`
  - 寫出 `build/<集名>/props.json`

## 做新一集的 Reel

用專案 skill `/new-reel <集名>`（`.claude/skills/new-reel/SKILL.md`）：補時間軸 → 選段 → 停下來等確認 → 輸出。改了流程要同步更新 skill。

## 常用指令

不需要建置，沒有測試。需要 Node 20 以上。

```powershell
npm install
node scripts/make-props.mjs data/clips/ep01_moon.json          # 選段 → build/ep01_moon/props.json（需要 ffmpeg；可用 $env:FFMPEG 指定）
node render.mjs build/ep01_moon/props.json out/ep01_moon.mp4   # 正式輸出
node render.mjs data/sample_ep01.json out/preview.mp4          # 無聲預覽（依字數估算時間）
node render.mjs data/sample_ep01.json out/x.png --still=200    # 單一畫格，改畫面時先用它看
node render.mjs <props.json> out/x.mp4 --frames=0-90           # 只輸出一段
npx remotion studio src/index.ts                               # 互動預覽
```

`REMOTION_CHROME` 環境變數可以指定 Chrome 執行檔。

## 程式架構

- props（`StoryProps`，定義在 `src/Reel.tsx`）：
  - `episode`：`{ no, title, question }`
  - `audio`：可省略，整集 mp3 在 `public/` 底下的相對路徑
  - `maxGap`：句間停頓的上限（秒），預設 0.6
  - `bed`：可省略，`{ src, volume }`，整支片循環播放的環境音
  - `lines`：`[{ speaker, text, start?, end?, audio?, role? }]`，`start`／`end` 是音檔裡的秒數；`audio` 是這句用的音檔（旁白句指向 narration.mp3，沒寫就用 `audio`）。`role: 'hook' | 'outro'` 是旁白提問／導流，有專用畫面（`HookCard`／`OutroCard`）。只要有一句缺時間，就全部改用字數估算（`T.charsPerSec`），這是無聲預覽模式。
- `timeline(props)` 是**唯一**的時間計算：`Root.tsx` 的 `calculateMetadata` 也呼叫它，時間邏輯不要寫到別的地方。
  - 第一句是 hook 就只留 `LEAD` 秒空白、不放片頭卡；最後一句是 outro 就不放片尾卡，說完再停 `TAIL` 秒。沒有旁白時退回「片頭卡 `T.introSec` → 台詞 → 片尾卡 `T.outroSec`」。
  - 台詞依序排：每句在上一句結束後，再加 min(原本的停頓, `maxGap`) 才開始；換音檔（旁白 ↔ 正片）時固定停 `SWITCH_GAP`。
- 聲音：每句一個 `<Audio>`，用 `trimBefore`／`trimAfter` 從整集 mp3 剪出 `[start-PAD, end+PAD]`，前後各淡入淡出 3 格。句子之間的空白由 `bed` 環境音蓋住。mp3 本身已經混了 podcast 的背景音，所以 `bed` 音量要低（預設 0.15，還沒經使用者試聽確認）。
- 字幕：`clean()` 去掉 Gemini 聲音標記（`<chuckle>` 等）。每句一個 `Sequence`，停頓時字幕留在畫面上，直到下一句開始。`Captions` 在句子裡依字數平均分配時間，切成短句輪流顯示。
- `src/theme.ts`：配色、品牌字、`CHARACTERS`（角色 → 顏色、頭像）。角色名稱要跟 podcast 腳本的 `@角色` 完全一樣。
- 頭像：栗栗、棉棉、咕咕爺爺用 `public/characters/` 的圖（從根目錄 `charaters.png` 用 ffmpeg 裁出大頭照），片尾用 `outro.png`（使用者提供的三角色夜景合照，原檔是根目錄 `片尾.png`，縮成 1080）。旁白沒有圖，還是 emoji（Linux 可能沒有彩色 emoji 字型，只在 Windows 算繪）。來源記在 `public/characters/SOURCES.md`（使用者用 AI 生成）。

## 不要做的事

- 不要拿掉畫面上的「AI 配音」標示（`T.aiLabel`）。Reel 只剪中段，聽不到 podcast 開場的 AI 揭露。
- 不要在這裡加 TTS 或任何 Gemini 呼叫（理由見上方「跟 podcast 的分工」）。
- 素材比照 podcast：只用 CC0、公有領域或自己生成的圖，並記錄來源。

## 待辦

1. 試聽 ep01：剪接點聽不聽得出來、`bed` 音量、`maxGap` 長度；Reel 旁白的語氣（podcast 的旁白基本 style 是哄睡，可能壓過 `not sleepy`）、「podcast」念得對不對。ep01 選段為了壓時間拿掉了「山」那一段，要確認還聽得懂。
2. 角色表情（每個角色 2–3 個），以及每集一張場景背景（慢速推近，Ken Burns）。
3. `okinawa_adventure`／`penghu_adventure` 是單一講者上台分享的格式，要另外做一個模板（照片投影片加字幕）。
4. mp4 大小：ep01（70.6 秒）約 14 MB，比 finreels 的 8 MB 大（插畫頭像比較難壓），需要的話調 crf。
