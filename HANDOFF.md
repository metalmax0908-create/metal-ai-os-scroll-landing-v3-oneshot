# Handoff — Metal AI OS Scroll Landing v3

**给接手模型：只读此文件 + `README.md`。**

## 当前真理（2026）

| 项 | 内容 |
|----|------|
| **默认 Hero** | **预渲染一镜 scrub**（Route 3） |
| **主视频** | `assets/video/hero-prerender-oneshot.mp4`（~10s，德辅道中 / IFC / 叮叮 / 红的士） |
| **目标对齐图** | `artifacts/target-vision/` 与 `assets/images/target-vision/` |
| **文案** | `content/slides.js` — **禁止改字**（除非用户明确要求） |
| **入口** | `index.html` · `python3 -m http.server 4174` 或 `npm run serve` |

### URL 模式

| URL | 模式 |
|-----|------|
| `/` | **默认：预渲染 scrub** |
| `?webgl=1` | 实时 WebGL 简模中环（`assets/js/central-webgl.js`） |
| `?photo=1` | 旧 5 帧静帧 ladder（无视频桥） |

### 预渲染 seek 注意

本地 `python -m http.server` **常不支持 Range**，代码里已用 **整文件 fetch → blob URL** 再 scrub。  
`preparePrerenderSeek()` 成功后 `body.is-prerender-ready`。

### 节奏

- Hero 滚程：`heroSpan = 5.0 / (slides.length - 1)`
- 前 18% tLin 略 hold 片头，之后线性 scrub
- PPT / daylight stage：钉在视频 **末帧**

## 已否决（勿复活）

1. **天空段 A + 走廊段 B 硬拼** — 不同街道，接不上。证据已删；结论写在 `docs/PRERENDER_ONESHOT.md`。
2. **多段 AI 静帧换车** — 穿帮；车流连贯只能同世界或单视频。
3. **街景照片贴整栋 WebGL 楼** — 横向拉伸穿帮。
4. **双/三 bridge 短视频叠静帧** — 中间方案，已被单走廊预渲染取代。
5. **纯 WebGL 程序楼冲照片 95%** — 路径可，外观到不了目标图。

## 目标观感

见 `artifacts/target-vision/01-hero-money-shot.jpg`（主构图）与  
`02-oneshot-three-beats.jpg`（仰天 → 中景 → 近景）。  
用户确认 **这两张是对的**；最终要接近照片级 → **预渲染 / 同轴生成**，不是灰盒子。

参考产考视频（Montfort 类）：`~/Downloads/hVYhFA0K4lboogk0.mp4` — 只学 **屏内** WebGL 一镜语法。  
真站是 Immersive Garden WebGL，不是静帧拼。

## 目录（清理后）

```
index.html                 # 主应用
content/slides.js          # 文案 manifest（零改字）
assets/video/hero-prerender-oneshot.mp4
assets/images/
  hero-prerender-plate.jpg # money shot
  hero-prerender-start/end.jpg
  hero-sky|mid-a|city|mid-b|street.png  # ?photo=1 回退
  target-vision/           # 对齐目标
  hero-v3/anchor-refs/     # A1/A2 夜景产考（几何，非 hero 贴图）
assets/js/central-webgl.js # ?webgl=1
docs/PRERENDER_ONESHOT.md
docs/WEBGL_CENTRAL.md
docs/ONESHOT_TRUE_PATH.md
docs/REF_PACING.md
docs/WORLD_CONTENT_TIMELINE.md
artifacts/target-vision/   # 仅保留目标图
```

## 建议接手优先级

1. **同轴仰天**：从 money shot 生成仰天 → 接到 B 首帧（禁止旧 A 街）
2. 提高 `hero-prerender-oneshot` 分辨率/质量
3. 文案钉点 / hero 滚程微调
4. 真机性能与 blob 加载提示

## 不要做

- 把已删 bridge / sky A 拼回去  
- 改 `slides.js` 文案（无指令）  
- 改 v2 目录（本仓是 v3-oneshot，与 v2 分离）

## Deploy

| 项 | URL |
|----|-----|
| GitHub | https://github.com/metalmax0908-create/metal-ai-os-scroll-landing-v3-oneshot |
| Vercel Preview | https://metal-ai-os-scroll-landing-v3-oneshot-k2s896fp9.vercel.app |
| Vercel Production alias | https://metal-ai-os-scroll-landing-v3-onesh.vercel.app |
| Dashboard | https://vercel.com/maxmet-s-projectsa/metal-ai-os-scroll-landing-v3-oneshot |

Push `main` 会触发 GitHub 连接部署（若已开启）。本地 Preview：`vercel deploy --yes`
