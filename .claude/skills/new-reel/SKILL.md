---
name: new-reel
description: 把「為什麼森林」podcast 的某一集做成精華 Reel：補時間軸 → 選段 → 等使用者確認 → make-props → 檢查畫格 → 輸出 mp4。使用者說「做 epNN 的 Reel」「幫我做新一集的 Reel」「/new-reel epNN_xxx」時使用；可以一次給好幾集。
argument-hint: "<集名，例如 ep02_fish；可給多個>"
---

# 做一集的 Reel

使用者通常只給集名（或集數）。其他規則都在這份 skill 和 CLAUDE.md 裡，不要叫使用者補資料；判斷不了的先依原則決定，在摘要裡說明。

**這個 repo 不呼叫任何 API。** 整個流程都不花 Gemini 額度；只有「Reel 旁白缺這一集」時才要到 podcast 生成（見第二步），而且要先問使用者。

## 第一步：找到這一集、補時間軸

1. 集數 → 集名：看 `../podcast/episodes/` 的檔名（例如 2 → `ep02_fish`）。
2. 確認 `../podcast/build/<集名>.mp3` 存在；沒有就是 podcast 還沒生成這集，停下來告訴使用者。
3. 沒有 `../podcast/build/<集名>.timeline.json` 就在 podcast 補出（**不花額度**，只讀快取）：
   ```bash
   cd ../podcast && PYTHONUTF8=1 py generate_episode.py episodes/<集名>.md --offline --timeline-only
   ```
   失敗（例如快取不完整）就停下來說明，**不要拿掉 `--offline`**。
   Bash 工具要用 `py`；`python` 在這台電腦也可以，但 podcast 的 CLAUDE.md 以 `py` 為準。

## 第二步：確認 Reel 旁白有這一集

開場提問（hook）和片尾導流（outro）來自 podcast 的 Reel 旁白腳本：第 1–13 集在 `episodes/reels_s1.md`，第 14–26 集在 `reels_s2.md`，以此類推（一季一份）。

- 找到這集所屬那一季的檔案，確認裡面有「孩子問你：「<本集問題>」」那一句，而且 `build/reels_sN.timeline.json` 已經存在。
- 問題要跟集數腳本第一行標題的問題一致（podcast 臨時換題時，旁白可能還是舊題目）。
- **缺檔、缺句或題目不一致**：停下來告訴使用者。補旁白要改那季的檔案並重新生成，整批 1 次 API，**一定要先得到使用者同意**，在 podcast 照它的 CLAUDE.md 做（不要用 `--limit`）。

## 第三步：選段

讀 `../podcast/episodes/<集名>.md` 和時間軸（每句的秒數），挑出角色選段。

- 內容：**栗栗發問 → 咕咕爺爺的小實驗 → 答案**。開場旁白已經問過問題了，前段「發現問題」的對話通常可以省略。
- 長度：角色說話 **45–55 秒**（加上旁白、停頓，整支約 70 秒）。超過時優先拿掉：重複的鋪陳、「這個問題真好」這類過場、小實驗裡比較次要的一輪；**答案那句不能拿掉**。
- 不要選：放鬆引導、共用片段（開場、咕咕爺爺登場的旁白介紹）、後段哄睡和結尾儀式。
- 選段裡不要有旁白的故事台詞（Reel 的旁白是對家長說話的那個聲音，兩者混在一起會亂）；真的需要時在摘要裡說明。
- 拿掉中間的句子後，前後要接得起來：每一段的第一句要能在少了前文的情況下聽懂。

寫出 `data/clips/<集名>.json`，格式照 `data/clips/ep01_moon.json`：

```json
{
  "episode": "<集名>",
  "no": <集數>,
  "title": "為什麼森林｜第 N 集",
  "question": "<本集問題，含問號>",
  "emoji": "<貼文第一行結尾的 emoji，配合本集主題，例如 🌙、🐟>",
  "narration": "reels_s1",
  "hook": "<本集問題的片段，例如：為什麼月亮會跟著我走>",
  "outro": "完整的睡前故事",
  "ranges": [["起句片段", "迄句片段"], ["單句片段"]],
  "maxGap": 0.6,
  "bed": "<環境音檔名>",
  "bedVolume": 0.15
}
```

- 片段要夠長、在整集裡唯一；`make-props` 對到 0 句或不只一句會停下來，那就改片段，**不要猜**。
- `bed`：用這集選段那個場景的環境音，檔名從 `../podcast/generate_episode.py` 的 `SOUNDS` 查（例如 `夜晚蟲鳴` → `night_crickets.wav`，`河水` → `river_flowing.wav`）。

然後跑 `node scripts/make-props.mjs data/clips/<集名>.json`，它會印出角色句數和說話秒數，並寫出 Reel 貼文文案 `build/<集名>/caption.txt`（固定格式，只換問題、集數和 `emoji`）。

## 第四步：停下來給使用者確認

給一份簡短摘要：

- 選了哪幾句（角色＋台詞，一行一句），以及拿掉了哪些、為什麼
- 角色說話秒數、旁白秒數、預估整支長度
- 用的環境音

一次做好幾集時，每集都列好再一起問。**使用者確認選段後才輸出 mp4**（輸出一支要好幾分鐘）。

## 第五步：檢查畫格、輸出

1. 先輸出三張畫格看（`--still=<格數>`，30 fps）：開場提問（約第 90 格）、角色段中間、片尾（最後 2 秒內）。
   ```bash
   node render.mjs build/<集名>/props.json out/<集名>_hook.png --still=90
   ```
   要確認：問題沒有斷成只剩一兩個字的第二行、字幕沒有怪符號、頭像是對的角色、「AI 配音」標示都在。
   有出現新角色（`CHARACTERS` 裡沒有）時，頭像會是 💬，要告訴使用者，請他提供角色圖。
2. 輸出：`node render.mjs build/<集名>/props.json out/<集名>.mp4`，用 ffprobe 量長度和檔案大小。
3. 給使用者試聽清單：
   - 每個剪接點的大概秒數（旁白 → 角色、拿掉句子的地方），聽得出來嗎
   - 環境音音量（`bedVolume`）
   - 有聲音標記（`<chuckle>` 等）的句子
4. 附上 `build/<集名>/caption.txt` 的貼文文案全文，讓使用者直接複製。

## 收尾

- 使用者要求時才 commit。`public/ep*/`、`public/reels_*/`、`build/`、`out/` 都不進版控；`data/clips/*.json` 要進。
- 改了流程或慣例，要同步更新這份 skill 和 CLAUDE.md。
