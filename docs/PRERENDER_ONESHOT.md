# Route 3 — 预渲染一镜（照片级目标）

对齐 `artifacts/target-vision/` 两张目标图，用 **长视频 scroll-scrub** 冲 ~90% 观感。

## 默认模式

| URL | 模式 |
|-----|------|
| `/` 或 `?v=pr1` | **预渲染一镜**（默认） |
| `?webgl=1` | 实时 WebGL 中环 |
| `?photo=1` | 旧静帧 ladder |

## 资产（B only · 已弃用 A 拼接）

| 文件 | 用途 |
|------|------|
| `assets/video/hero-prerender-oneshot.mp4` | **主一镜 = B 走廊**（money shot 推镜，~10s，seekable） |
| `assets/video/hero-prerender-corridor.mp4` | B 源片备份 |
| `assets/video/hero-prerender-sky.mp4` | **A 废弃**（另一条街，不可接 B） |
| `assets/images/hero-prerender-plate.jpg` | 目标 money shot 底板 |
| `artifacts/v3-prerender/join-check/` | A/B 接缝对照（证明不可拼） |

## 行为

- 只 scrub **同一德辅道中 / IFC 构图**
- 开场略 hold money-shot（tLin 0–18% → 片头 10%）
- PPT stage：钉在末帧
- `slides.js` 零改字

## 再冲 95% / 真仰天

若要加 sky 建立：必须从 **同一 money shot 同轴** 生成仰天再 i2v 接 B 首帧；禁止再拼旧 A。
