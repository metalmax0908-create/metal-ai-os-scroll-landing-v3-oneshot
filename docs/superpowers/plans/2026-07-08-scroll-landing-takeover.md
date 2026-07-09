# Metal AI OS Scroll Landing Takeover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把現有 32 頁灰盒 animatic 修成可對外演示的 cinematic scroll landing，且不偏離 PPT v0.6 文案順序。

**Architecture:** `content/slides.js` 繼續做唯一內容來源，`index.html` 做 manifest-driven renderer。先修渲染/截圖/導出鏈路，再清內部標籤，再重做 hero 一鏡，最後只提升高價值頁面的 SVG / UI 動畫。

**Tech Stack:** HTML / CSS / vanilla JS, Playwright, existing Node scripts, CSS sticky/transform/opacity timeline, SVG/DOM UI animation. 不先引入新框架；如後期需要更精細時間線，再評估 GSAP / HyperFrames。

---

## 0. 不可偏移邊界

本計劃的參考對象只包括參考視頻中「電腦屏幕裏的網頁內容」。

不包括：

- 電腦外殼
- 鍵盤
- 手
- 桌面反光
- 手機 / 筆記本拍攝感
- 鏡頭晃動或真實拍攝噪點

如果後續要做「設備拍攝外殼版」，必須另開分支計劃，不混進本計劃。

## 0.1 Max 已確認決策

- Hero 不要黃昏方向。
- Hero 要更像中環海港 / 真實維多利亞港現貌；不要沿用 Round B 的 Hero A/B 示意。
- Hero 允許生成三張連續關鍵幀，但三張圖必須服務同一個一鏡到底運動。
- Hero 要更像 Apple 的空間感：清晰景深、分層視差、光線乾淨、文字像在空間裏被打開，不做暗夜科技背景。
- 整體接受轉亮，不保留暗夜科技主調。
- S13 的 `風險` 可以用紅色 / 琥珀色明顯標出。
- S22 可以出現 `送審` 作為狀態動畫，但不得表示自動外發。
- S12 不接受「文字卡片 + 箭頭」作為 loop 主呈現；loop 必須用人能理解的圖形和少量文字表達。

## 1. 鎖偏移機制

每一步都必須留下這些驗收物：

- `npm run check` 結果
- `npm run contact-sheet` 結果
- 32 頁 contact sheet
- hero / S13 / S18 / S22 / CTA 關鍵截圖
- 本步完成了甚麼
- 下一步還剩甚麼
- 是否觸碰文案；如觸碰，必須列出頁碼和原因

禁止：

- 重寫 32 頁文案
- 重排 PPT v0.6 順序
- 把頁面做成視頻背景
- 把參考方向滑成「拍攝電腦」
- 在 public mode 顯示內部工程標籤
- 加價格區間或禁用承諾

## 2. 品質參考，只用屏幕內容

以下只作動效和信息呈現參考，不模仿品牌內容：

1. Apple Vision Pro product page  
   用途：scroll-tied spatial reveal、單一主物件跟隨滾動變形。  
   參考點：一個場景隨 scroll 逐步展開，而不是每屏換卡片。  
   Link: https://www.apple.com/apple-vision-pro/

2. Stripe Connect front-end experience  
   用途：viewport-triggered product animation、元素進場和狀態轉換。  
   參考點：產品 UI 動畫應該解釋流程，不做裝飾。  
   Link: https://stripe.com/blog/connect-front-end-experience

3. Linear homepage  
   用途：克制的產品 UI、清楚的信息層級、少量高質動效。  
   參考點：B2B 工具不靠花哨，而靠精準排版和產品感。  
   Link: https://linear.app/

本地參考：

- `artifacts/review/reference-real-sheet.png`：只看屏幕內網頁節奏，不看電腦、手、桌面。
- `artifacts/review/current-export-sheet.png`：用作反例，檢查是否仍停留在暗色 PPT animatic。

---

## Task 1: 修復演示鏈路

**目的：** 先讓 32 頁定位、截圖和導出可信。這一步不改視覺風格，不改文案。

**Files:**

- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/index.html`
- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/scripts/capture-contact-sheet.mjs`
- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/package.json`

**現在已完成：**

- `content/slides.js` 已有 32 頁。
- `index.html` 已讀 manifest。
- `scripts/capture-contact-sheet.mjs` 已存在。
- P0 已修復：`npm run contact-sheet` 可獨立啟動臨時服務並生成 32 頁截圖。
- P0 已修復：`npm run check` 已包含實際 contact sheet 生成。
- P0 已驗證：`npm run export` 可輸出 18 秒、1920x1080、30fps、540 frames MP4。

**原問題：**

- `npm run contact-sheet` 實跑失敗：Slide 3 被 Slide 2 覆蓋。
- `npm run check` 只檢查 contact-sheet 腳本語法，沒有跑實際截圖。

**要做：**

- [x] 修 `applyProgress()` 裏 H0 hero 特殊 opacity 規則。
- [x] Hero 結束後，Slide 1 / Slide 2 必須退出普通 slide 層。
- [x] 修 `window.renderAt(seconds)`，確保 1-32 頁可準確定位。
- [x] 修改 `npm run check`，讓它真正執行 contact sheet，或新增 `npm run check:visual` 並在交付時固定執行。
- [x] 重新生成 32 頁 contact sheet。

**技術 / skill：**

- vanilla JS timeline debugging
- Playwright screenshot capture
- `superpowers:executing-plans`
- `playwright`
- `product-design:audit` 用於截圖審計

**驗收：**

```bash
npm run check
npm run contact-sheet
```

Expected:

- 兩個命令都通過。
- `artifacts/contact-sheet/slide-01.png` 到 `slide-32.png` 都存在。
- 每張圖最高可見頁等於文件名頁碼。

**品質可提升效果：**

- 截圖節奏參考 Apple scroll reveal：每一頁是連續時間點，不是亂跳。
- 導出節奏參考 Stripe viewport animation：元素只在該出場時出場。
- 驗收視角參考 Linear：每屏信息密度可讀，不靠 debug 標籤理解。

**需要 Max 確認：**

- 不需要。這是 P0 修復。

---

## Task 2: Public / Debug 模式分離

**目的：** 默認頁面變成對外展示，不再像工程稿。

**Files:**

- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/index.html`
- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/scripts/capture-contact-sheet.mjs`
- Create: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/artifacts/round-b-options/reference-options.html`

**現在已完成：**

- 頁面已有 `?edit=1` 預覽面板。
- 內部資料能從 manifest 讀出。
- Round B 已完成：public mode 隱藏內部標籤，`?debug=1` 顯示工程標籤。
- Round B 已完成：`npm run check` 會用真實瀏覽器檢查 public mode 不出現內部標籤。
- Round B 已完成：Hero / S12 選型示意已輸出到 `artifacts/round-b-options/`。

**原問題：**

- public 畫面可見 `S13 / P1 / DEMO MOMENT`。
- public 畫面可見 `INQUIRY-BRANCH`、`APPROVAL-GATE`。
- public 畫面可見 `Manifest driven`、`32 slides / 8 scene groups`。

**要做：**

- [x] 新增 `isDebug = new URLSearchParams(location.search).get('debug') === '1'`。
- [x] public mode 隱藏 eyebrow、template label、manifest status、scene group debug text。
- [x] `?debug=1` 顯示工程標籤，方便檢查。
- [x] `?edit=1` 保留內容預覽，但不在 public mode 自動出現。
- [x] `capture-contact-sheet.mjs` 加 public mode 禁止詞檢查。

**技術 / skill：**

- CSS conditional class
- URLSearchParams
- Playwright public/debug screenshot comparison
- `frontend-design`
- `product-design:audit`

**驗收：**

```bash
npm run check
```

Public URL 截圖中不得出現：

- `S01`
- `H0`
- `DEMO MOMENT`
- `INQUIRY-BRANCH`
- `APPROVAL-GATE`
- `Manifest driven`
- `32 slides`
- `Not a video background`

Debug URL `?debug=1` 可以出現。

**品質可提升效果：**

- 參考 Linear：少量導航，不顯示製作資訊。
- 參考 Apple：屏幕只服務故事，不暴露結構標籤。
- 參考 Stripe：技術過程藏在背後，前台只看用戶理解的流程。

**需要 Max 確認：**

- 不需要。我會直接把內部標籤移到 debug mode。

---

## Task 3: 重做 Hero 一鏡

**目的：** 修正第一屏，按你的明確方向做：香港天空 → 城市平視 → 街頭俯視。只做屏幕裏的網頁，不做電腦外殼。

**Files:**

- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/index.html`
- Do not use: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/assets/images/hero-daylight-master.png`
- Maybe create: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/assets/images/hero-sky.png`
- Maybe create: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/assets/images/hero-city.png`
- Maybe create: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/assets/images/hero-street.png`

**現在已完成：**

- 有亮色 hero 初稿。
- 有 `hero-cinema` DOM 和 CSS variables。

**目前問題：**

- 海港、街頭、樓宇透視混在一起。
- 不是連續鏡頭。
- Slide 1 / Slide 2 文案跟鏡頭節點關係不夠清楚。
- 不夠像中環海港 / 真實維多利亞港現貌。
- 空間層次仍像合成背景，不像 Apple 式 scroll spatial reveal。

**要做：**

- [ ] 定義三個 hero camera states：`sky`, `city`, `street`。
- [ ] 先完成 `ROUND_C0_VISUAL_MOTION_BOARD.md`，鎖定觀看者視角、三張關鍵幀和每段文字出場。
- [ ] 以 scroll progress 綁定三段 motion。
- [ ] Slide 1 title 在 `city` 階段出現。
- [ ] Slide 1 subtitle/body 在 `street` 初段出現。
- [ ] Slide 2 chatbot 對比文案在 `street` 後段出現。
- [ ] 移除當前透視衝突的合成感。

**技術 / skill：**

- CSS transform / opacity / scale
- vanilla JS scroll progress timeline
- image compositing if assets are local
- `frontend-design`
- `product-design:ideate` 如需先做視覺方向圖
- `creative-production:shot-explorer` 如需找鏡頭構圖方向
- `image` / `media-gen` 如需生成或補素材

**驗收：**

- 0-3 秒或前兩個 scroll stops 能清楚看見一鏡運動。
- 正常 URL 不出現電腦外殼或拍攝感。
- Page 1 主標題在城市平視階段出現。
- 副文案和 Slide 2 在街頭階段出現。
- 三張 keyframe 看起來像同一鏡頭的三個時間點，不像三張不同海報。
- 畫面能辨認為中環維港：海面、港島中環天際線、海濱 / 碼頭 / 街道經營訊號的關係清楚。

**品質可提升效果：**

- Apple Vision Pro：一個主場景隨 scroll 逐步揭示。
- 參考視頻屏幕內容：畫面像一個完整網頁體驗，不像 PPT 切頁。
- Linear：標題要像產品頁主張，不像 demo debug overlay。

**需要 Max 確認：**

- 已確認：不要黃昏；中環海港 / 真實維多利亞港現貌；允許三張連續關鍵幀；要 Apple 式空間感。
- 仍可能需要 Max 提供：如果要精準到某個碼頭、商廈角度或街口，需要指定參考圖。

---

## Task 4: S13 Demo Moment 改成產品事件

**目的：** 讓觀眾看到「一句客戶查詢如何變成 5 個經營判斷」。

**Files:**

- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/index.html`

**現在已完成：**

- S13 文案在 manifest 中正確。
- 畫面已有訊息泡和五張輸出卡。

**目前問題：**

- 它仍像 PPT 卡片。
- `Customer inquiry` 這類英文工程標籤不應 public 顯示。
- 五個判斷沒有強弱和順序。

**要做：**

- [ ] S13 使用專屬 visual treatment，不再用普通 `inquiry-branch` 卡片模板。
- [ ] 左側固定客戶訊息。
- [ ] 右側五張 action cards 逐一生成：商機、報價、缺資料、風險、行動。
- [ ] `缺資料`、`風險`、`行動` 三項提高權重。
- [ ] 用線條或 glow 表示從一句話拆出多個判斷。

**技術 / skill：**

- CSS keyframe or scroll-progress class
- SVG connector lines
- DOM card sequencing
- `frontend-design`
- `motion-graphics`
- `hyperframes:gsap` 如果 vanilla JS 不夠精準

**驗收：**

- 不改 S13 文案。
- public 截圖看不到工程標籤。
- 一眼看懂「不是聊天，是經營判斷」。

**品質可提升效果：**

- Stripe：產品 UI 動畫解釋流程。
- Linear：卡片像真產品資料，不像裝飾玻璃板。
- Apple：少量元素有節奏地出現，而不是所有內容同時上屏。

**需要 Max 確認：**

- 是否要把 `風險` 用紅色/琥珀色明顯標出。
- 是否要把 `行動：今日 14:00 前補充資料` 做成最終主卡。

---

## Task 5: S22 Daily Action Card 改成老闆視角

**目的：** 讓 Quote #27 看起來像可以直接決策的產品 UI。

**Files:**

- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/index.html`

**現在已完成：**

- Quote #27 文案和字段已存在。

**目前問題：**

- 左側大標題和右側大卡內容重複。
- 卡片像排版展示，不像可用產品。

**要做：**

- [ ] S22 使用專屬 action-card layout。
- [ ] 一張大卡作主體，左側只保留極短標題或直接退為背景。
- [ ] 字段做成產品 UI：負責人、截止時間、證據、狀態、寫回。
- [ ] 證據 badges 小型化。
- [ ] 狀態從 `待審批` 到 `送審 / 寫回` 做微動畫，但不承諾自動外發。

**技術 / skill：**

- CSS grid
- DOM state badges
- small SVG status path
- `frontend-design`
- `motion-graphics`

**驗收：**

- 不改 Quote #27 文案。
- 不出現自動外發、自動改價、自動合同、自動付款承諾。
- 觀眾能在 3 秒內看懂：誰負責、何時截止、憑甚麼審、寫回哪裏。

**品質可提升效果：**

- Linear：B2B action card 的克制層級。
- Stripe：證據和狀態服務流程，不做炫技。
- 參考視頻屏幕內容：文字出場要像網頁段落被打開，不像 PPT 飛入。

**需要 Max 確認：**

- 是否允許加入 `送審` 作為中間狀態；如不允許，只做 `待審批` 的高亮。

---

## Task 6: S18 Gate / S12 Loop / S21 Control 改成系統圖事件

**目的：** 把流程頁從卡片列表變成真正的 SVG / 系統圖動畫。

**Files:**

- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/index.html`

**現在已完成：**

- S12 / S18 / S21 的 steps 已在 manifest。

**目前問題：**

- 流程頁只是列表。
- 無法表達 Gate、Loop、Control 的機制。

**要做：**

- [ ] S12：做 circular loop，六步按 scroll 亮起。
- [ ] S18：做 horizontal gate，五步從來源檢查到跟進隊列。
- [ ] S21：做 four-layer stack，來源 / 理由規則 / 審批 / 紀錄回滾。
- [ ] 所有圖形只用 manifest 文案，不新增承諾。

**技術 / skill：**

- Inline SVG or DOM diagram
- CSS stroke-dashoffset animation
- scroll progress state
- `motion-graphics`
- `hyperframes-animation`
- `figma:figma-generate-diagram` 如需先出圖形方向

**驗收：**

- 三頁看起來是三種不同機制，不是同一種卡片模板。
- 圖形能解釋文案。
- mobile 不水平溢出。

**品質可提升效果：**

- Apple：一個物件隨 scroll 改變狀態。
- Stripe：流程動畫按業務邏輯觸發。
- Linear：系統圖少即是多，避免流程線太花。

**需要 Max 確認：**

- S12 是否一定要圓環，還是可以用垂直 loop。
- S21 是否可以用四層堆疊，還是你想要控制塔/審批鏈路視覺。

---

## Task 7: 全局質感統一

**目的：** 從暗色 PPT animatic 變成高級 landing。

**Files:**

- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/index.html`
- Maybe replace images under: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/assets/images/`

**現在已完成：**

- 有一致的深色背景和玻璃卡片。

**目前問題：**

- 太多頁都像同一張暗色 PPT。
- 香港夜景/街景偏暗。
- 玻璃卡片重複，降低高級感。

**要做：**

- [ ] 建立 public 色彩和文字層級，不再依賴 debug labels。
- [ ] 減少黑色遮罩。
- [ ] 對 C1 / C2 / M1 / P1 / P2 / G1 / A1 做背景節奏差異。
- [ ] 控制玻璃卡片使用量，只保留在產品 UI / action card。
- [ ] 檢查 1440 x 900、1280 x 720、390 mobile。

**技術 / skill：**

- CSS design tokens
- responsive CSS
- Playwright screenshots
- `frontend-design`
- `product-design:audit`
- `playwright`

**驗收：**

- 32 頁 contact sheet 看起來像同一個高級網站。
- 不再像 32 張深色 PPT。
- mobile 沒有文字互相壓住或溢出。

**品質可提升效果：**

- Linear：B2B 工具的精準排版和產品感。
- Apple：場景亮度和空間感。
- Stripe：流程圖和 UI 卡片的節奏。

**需要 Max 確認：**

- 已接受整體轉向更亮的香港日間方向，不保留暗夜科技感，也不走黃昏方向。
- 是否有你想保留的品牌色或 logo 規則。

---

## Task 8: 後期文案可調整流程

**目的：** 讓 Max 後續改文案不容易破壞版式。

**Files:**

- Modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/CONTENT_EDITING.md`
- Maybe create: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/content/slides.json`
- Maybe modify: `/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2/content/slides.js`

**現在已完成：**

- `CONTENT_EDITING.md` 已有基礎說明。
- `check-text-fit.mjs` 已有文字長度檢查。

**目前問題：**

- 文案仍要改 JS。
- `?edit=1` 只能預覽，不能寫回。

**要做：**

- [ ] 短期保留 `content/slides.js`，完善可改字段規則。
- [ ] 明確哪些字段可改，哪些字段不能改。
- [ ] 每次改文案後固定跑 text fit + contact sheet。
- [ ] 中期再決定是否拆成 `slides.json`。

**技術 / skill：**

- existing manifest
- Node validation scripts
- `technical-writing`
- `chinese-writing`

**驗收：**

- Max 能知道改哪裏。
- 改文案後有檢查命令。
- 不需要先做完整 CMS。

**品質可提升效果：**

- 參考 Linear：文案短、準、產品感強。
- 參考 Stripe：字段命名讓人知道下一步。
- 參考 Apple：大標題少而重，不堆解釋。

**需要 Max 確認：**

- 是否現在就拆 `slides.json`。我的建議是先不拆，等視覺穩定後再拆。

---

## 交付節奏

### Round A：可靠性

做 Task 1。

交付：

- 修復後的 contact sheet
- `npm run check` 結果
- `npm run contact-sheet` 結果

### Round B：對外展示清理

做 Task 2。

交付：

- public 截圖
- debug 截圖
- 禁止內部標籤檢查結果

### Round C：Hero 一鏡

做 Task 3。

交付：

- hero 3-5 張 keyframe
- `ROUND_C0_VISUAL_MOTION_BOARD.md`
- mobile hero 截圖
- 你確認是否進入細修

### Round D：重點產品事件

做 Task 4 / 5 / 6。

交付：

- S13 / S18 / S21 / S22 截圖
- 32 頁 contact sheet

### Round E：全局統一

做 Task 7 / 8。

交付：

- 全頁 contact sheet
- mobile / desktop QA
- 後期文案修改說明

## 需要 Max 先確認的問題

1. Hero 是否要精準指定某個維港 / 中環海濱角度。
2. S12 採用圓環，還是採用 vertical loop。

## 不需要 Max 確認、可以直接做的事

- 修 `renderAt()` / contact sheet。
- 把內部標籤移入 `?debug=1`。
- 保持 32 頁文案順序。
- 不做電腦外殼、不做手、不做桌面反光。
- 不新增禁用承諾。
