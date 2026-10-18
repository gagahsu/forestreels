---
name: weekly-posts
description: 「為什麼森林」每週的圖文貼文（1080×1350 IG 輪播）：週三的中文著色畫（兩集，各一張 AI 生成的線稿）、週六的英文單字卡（兩集，每集 5–8 個關鍵單字＋中文意思）。使用者說「做這週的著色畫」「做第 N、M 集的著色畫」「做單字貼文」「/weekly-posts」時使用。只產出圖卡和文案，不發文。
argument-hint: "<著色|單字> <集數> <集數>，例如：著色 1 2、單字 1 2"
---

# 每週圖文貼文

發布排程（使用者定的）：週一、四中文 podcast＋Reel；週二、五英文 podcast＋Reel；**週三中文著色畫**（兩集）；**週六英文單字卡**（兩集）。Reel 用 `/new-reel` 做，這個 skill 只做週三、週六的圖文貼文。

- **只產出，不發文**：圖卡在 `out/posts/<貼文名>/01.png…`，文案在同一個資料夾的 `caption.txt`，使用者自己上傳。
- 不呼叫任何 API，也不生圖：著色畫的線稿由**使用者用 AI 生圖**，Claude 寫提示詞、檢查圖、排版。
- 使用者沒說哪兩集：問一句（不要猜哪幾集已經上架）。

## 著色畫（週三，中文）

### 1. 寫生圖提示詞，停下來等使用者生圖

0. 先看兩集中文腳本 `../podcast/episodes/epNN_xxx.md` 最後的「製作備註」：有「著色畫提示詞（Coloring page prompt）」（`/new-episode` 生成時寫的）就直接用，跳到第 3 點；沒有（例如第 1–13 集，那時還沒有這個慣例）才照下面自己寫，寫好也補進那集的製作備註。
1. 讀兩集的中文腳本 `../podcast/episodes/epNN_xxx.md`，每集挑一個**安靜、好塗**的畫面：通常是小實驗或故事前段的場景（例如栗栗和棉棉坐在樹洞口看月亮）。不要挑會嚇到孩子或太刺激的畫面。
2. 每集寫一段英文提示詞（生圖模型對英文比較穩），固定包含：
   - 風格：`black and white coloring page for kids aged 3–6, clean thick black outlines, no shading, no gray, no filled black areas, pure white background, large simple shapes that are easy to color, cute storybook style`
   - 構圖：`portrait 4:5`，主角大、背景簡單（幾棵樹、月亮、星星、草就好），**不要有任何文字或字母**
   - 角色（照 `charaters.png` 的設定，要畫到的才寫）：
     - Lili：`a small squirrel with a big curly fluffy tail, pointed ears with little tufts, big round eyes, smiling`
     - Mumu（棉棉）：`a small fluffy bunny with long upright ears, round body, big round eyes, sitting`
     - Grandpa Gugu：`a big round owl wearing round glasses, ear tufts, kind face, standing on a branch`
   - 場景：照腳本寫具體的東西（大橡樹的樹洞、河邊、螢火蟲…）
   - 結尾：`Use the attached character sheet as reference for the characters' look.`
3. 寫 `data/posts/coloring_epNN_epMM.json`：
   ```json
   {
     "type": "coloring",
     "pages": [
       { "no": 1, "question": "為什麼月亮會跟著我走？", "image": "coloring/ep01_moon.png", "prompt": "<提示詞>" },
       { "no": 2, "question": "魚會睡覺嗎？", "image": "coloring/ep02_fish.png", "prompt": "<提示詞>" }
     ],
     "caption": "<見第 3 步>"
   }
   ```
   `question` 照中文腳本第一行的問題。
4. **停下來**，把兩段提示詞貼給使用者，說明：生圖時附上根目錄的 `charaters.png` 當角色參考；生好存成 `public/coloring/<集名>.png`（直式，4:5 最好）。

### 2. 檢查線稿（使用者放好圖之後）

用 Read 看每一張圖，確認：
- 真的是線稿：沒有灰階、陰影、大片塗黑（孩子塗不了，印出來也很耗墨）
- 角色認得出來（尾巴、長耳朵、眼鏡），沒有多一隻腳、怪手指這類 AI 錯誤
- 圖裡沒有文字或亂碼字母
- 沒有可怕的東西

有問題就說哪裡不對，建議怎麼改提示詞，請使用者重生；**不要自己修圖**。

### 3. 文案、輸出

文案寫進 JSON 的 `caption`（給家長看，中文）：
```
睡前著色時間 🖍️ 第 N、M 集的森林朋友，等孩子來塗上顏色！

EP N｜<問題>：<一句畫面說明>
EP M｜<問題>：<一句畫面說明>

🖨️ A4 列印版 PDF 歡迎自由列印、分享：
・家裡有印表機 → 主頁連結下載
・到 7-11 ibon 列印 → 取件編號 XXXXXXXX（M/D 前有效）

完整故事 🔍 [CHT] 為什麼森林
🎧 收聽連結在主頁

著色畫由 AI 生成。

#著色畫 #睡前故事 #為什麼森林
```
PDF 的下載連結放在 IG 主頁（使用者放 Google 雲端）。ibon 取件編號要等使用者上傳後才有（約 3 天過期），先留 `XXXXXXXX`、`M/D`，使用者給了再填；只放限時動態就刪掉 ibon 那行。

然後 `node scripts/render-post.mjs data/posts/coloring_epNN_epMM.json`，用 Read 看輸出的每一張，再把文案全文貼給使用者。

同一個指令也會輸出 **A4 列印版** `print/<集名>.pdf`（`src/PostCards.tsx` 的 `ColoringPrint`：白底省墨、頁首集數＋問題＋「名字：」、頁尾 AI 生成標示和 IG）。給家長下載自己印（使用者放 Google 雲端），或上傳 ibon 列印。IG 圖卡有深色外框，不要拿來印。要看版面就用 `npx remotion still src/index.ts ColoringPrint <暫存.png> --props=...` 轉成 PNG 再 Read。

## 單字卡（週六，英文）

1. 兩集的英文腳本 `../podcast/episodes/en/epNN_xxx_en.md` 最後「製作備註」裡有「關鍵單字（Key words）」表（`/en-episode` 寫的）。沒有英文版或沒有單字表：停下來告訴使用者，請先做那集的英文版，**不要自己另外挑字**。
2. 寫 `data/posts/vocab_epNN_epMM.json`，格式照 `data/posts/sample_vocab.json`：`question` 用英文腳本第一行的英文問題；`words` 照表抄（word、zh、example 一字不改）。
3. 文案（`caption`）：給台灣家長參考的單字貼文，以中文說明為主、單字和例句用英文：
   ```
   英文睡前故事裡的單字 🌙 Words from the Story

   EP N｜<英文問題>
   <單字1> <中文>・<單字2> <中文>・…
   EP M｜<英文問題>
   …

   聽完故事，跟孩子一起說說看。例句都是故事裡的句子！
   完整故事 🔍 [EN] Why Forest
   🎧 收聽連結在主頁

   故事由人與 AI 共同創作，聲音由 AI 生成。

   #兒童英文 #英文睡前故事 #WhyForest #為什麼森林
   ```
4. `node scripts/render-post.mjs data/posts/vocab_epNN_epMM.json`，用 Read 看每一張：8 個單字時字不能擠出畫面、例句不能折成三行以上（太長就請使用者同意後在單字表換短一點的例句，並同步改英文腳本的單字表）。
5. 把文案全文貼給使用者。

## 收尾

- `data/posts/*.json` 進版控（記錄發過什麼、用了哪段提示詞）；`out/` 和著色畫的圖 `public/coloring/` 不進（使用者定的，已加進 .gitignore）。圖不見了可以照 JSON 裡的提示詞重生。
- 改了版型（`src/PostCards.tsx`）或文案格式，要同步更新這份 skill 和 CLAUDE.md。
- 使用者要求時才 commit。
