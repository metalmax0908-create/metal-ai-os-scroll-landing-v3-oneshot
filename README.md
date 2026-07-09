# Metal AI OS Scroll Landing — v3 oneshot

**接手请先读 [`HANDOFF.md`](./HANDOFF.md)。**

与 v2 目录隔离，不修改  
`/Users/metalmax/Documents/Codex/metal-ai-os-scroll-landing-v2`。

## 当前默认

**预渲染中环一镜**（德辅道中 · IFC · 叮叮 · 红的士）随滚动 scrub。

- 视频：`assets/video/hero-prerender-oneshot.mp4`
- 目标图：`artifacts/target-vision/`
- 文案：`content/slides.js`（零改字）

## 运行

```bash
npm install   # 可选，检查脚本用
python3 -m http.server 4174
# 打开 http://127.0.0.1:4174/
```

| URL | 模式 |
|-----|------|
| `/` | 预渲染 scrub（默认） |
| `?webgl=1` | WebGL 简模 |
| `?photo=1` | 5 帧静帧 |
| `?debug=1` | 工程 chrome |
| `?edit=1` | 只读字段预览 |

## 文档

| 文件 | 内容 |
|------|------|
| `HANDOFF.md` | **真理 + 否决清单 + 下一步** |
| `docs/PRERENDER_ONESHOT.md` | 预渲染细节 |
| `docs/ONESHOT_TRUE_PATH.md` | 一镜路径原则 |
| `docs/REF_PACING.md` | 参考视频节奏 |
| `docs/WEBGL_CENTRAL.md` | WebGL 可选路径 |
| `CONTENT_EDITING.md` | 文案编辑约定 |

## 检查

```bash
npm run check
```
