# Metal AI OS V3 内容编辑说明

这个版本的目标是：**页面文字、顺序、模板、图形需求都集中在一个 manifest 里维护**，不要再到 `index.html` 里逐页找硬编码文案。

## 1. 内容源在哪里

主要内容源：

```text
content/slides.js
```

里面有三类导出：

- `sceneGroups`：8 个章节世界，决定一组 slide 属于哪个场景段落。
- `slides`：32 页正式顺序，决定每页文案、模板、图形需求和动画意图。
- `templates`：从 `slides` 自动推导出的模板列表，用于检查 manifest 是否一致。

页面 `index.html` 会直接 import：

```js
import { sceneGroups, slides, templates } from './content/slides.js';
```

所以以后改文案，优先改 `content/slides.js`。

## 2. 一页 slide 可以安全修改哪些字段

常改字段：

```js
title
subtitle
body
supporting
items
steps
modules
outputs
fields
entries
cta
visualPurpose
animation
needs
```

建议不要随便改的字段：

```js
number
source
part
sceneGroup
pageType
template
visualType
```

这些字段会影响顺序、模板和 QA 检查。要改也可以，但改完一定跑 `npm run check`。

## 3. 页面模板怎么理解

`template` 决定 `index.html` 用哪种灰盒布局渲染这一页。

当前支持的主要模板包括：

- `hero-cinematic`：开场大标题。
- `statement-large`：一句话大判断。
- `chapter-break`：章节幕封。
- `problem-list`：痛点列表。
- `model-diagram`：C / P / WTP 模型。
- `process-loop` / `process-diagram`：流程或循环。
- `inquiry-branch`：询盘拆解 demo。
- `module-map`：产品模块地图。
- `ui-mock`：产品界面灰盒。
- `action-card`：Daily Action Card。
- `approval-gate` / `control-stack`：审批、权限、证据层。
- `pilot-path` / `pilot-checklist`：试点路径。
- `role-entry-map`：不同角色入口。
- `cta-final`：最终 CTA。

如果只是改文字，通常不用改 `template`。

## 4. 怎么预览页面

启动本地服务：

```bash
npm run serve
```

打开：

```text
http://127.0.0.1:4174/
```

页面是 scroll-driven，不是视频背景。滚动时会按 32 页顺序切换。

## 5. 编辑预览模式

打开：

```text
http://127.0.0.1:4174/?edit=1
```

右侧会出现当前 slide 的只读编辑预览面板，方便你快速看到这一页 manifest 里有哪些文字字段。

注意：这一版 `?edit=1` 还不是完整 CMS，不会直接写回文件。正式修改仍然改 `content/slides.js`。

## 6. 每次改完要跑什么检查

```bash
npm run check
```

当前 `check` 会做：

1. `scripts/check-static.mjs`  
   检查页面仍然是 manifest-driven、没有嵌入 MP4/video、图片资源存在。

2. `scripts/check-slides-manifest.mjs`  
   检查 32 页顺序、8 个 scene group、必要字段、禁用表述。

3. `scripts/check-text-fit.mjs`  
   做文字长度和布局风险检查。

4. `node --check scripts/export-video.mjs`  
   确认导出脚本语法没坏。

## 7. 文字太长时怎么处理

优先顺序：

1. **先删字**：一句话保留一个核心判断。
2. **拆成 `body` 多段**：不要把一大段塞进一个字符串。
3. **把细节放到 `supporting`**：主视觉只放核心判断。
4. **把列表压成 3–5 项**：超过 6 项通常会显得像报告页。
5. **必要时拆 slide**：如果一页承担两个判断，宁愿拆成两页。

不要为了塞更多字，第一反应就把字号调小。这个 landing page 的质感来自留白和节奏。

## 8. 常见字段示例

### 普通正文

```js
body: [
  '第一句核心判断。',
  '第二句补充说明。',
]
```

### 痛点列表

```js
items: [
  { title: '訊號分散', body: 'WhatsApp、Email、Excel、POS 各自散落。' },
  { title: '無人負責', body: '每個人都看過，但沒有人接手下一步。' },
]
```

### Daily Action Card 字段

```js
fields: [
  { label: 'Customer', value: 'ABC Trading' },
  { label: 'Risk', value: '毛利低於規則，需要審批。' },
]
```

## 9. 如果检查报错怎么办

- `Slide numbers are not sequential`：检查 `number` 是否从 1 到 32 连续。
- `Scene group coverage mismatch`：检查 `sceneGroups` 里的 `slides` 是否覆盖所有页。
- `Found blocked terms`：用了当前定位不允许的承诺型或误导型表述。
- `text fit severe issues`：某页文字明显太长，先删字或拆段。

Soft warning 不一定阻止预览，但代表这一页后期做精视觉时要特别看。

## 10. 导出视频前

先确认页面顺序和文字节奏，再导出。

推荐流程：

```bash
npm run check
npm run serve
# 浏览器看 32 页顺序
npm run export
```

导出的 MP4 只是展示物；页面实现仍然是 HTML/CSS/JS + manifest。
