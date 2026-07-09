# WebGL 中环一镜

对齐 Montfort（Immersive Garden）路线：**同一 WebGL 世界 + scroll 相机 + 主体持续运动**。

## 入口

| URL | 模式 |
|-----|------|
| `http://127.0.0.1:4174/` | **默认 WebGL 中环** |
| `?photo=1` | 回退旧静帧/视频 ladder |

## 文件

- `assets/js/central-webgl.js` — Three.js r170 场景
- `index.html` — canvas `#centralWebGL` + `body.is-webgl-central`

## 场景内容（v2 · 真实中环语言）

产考几何：**德辅道中 / A1 高架 + 叮叮 + IFC**

| 元素 | 真实参照 | 实现 |
|------|----------|------|
| 地标 | IFC Two 圆冠 | 锥柱 + 半球冠 + 天线 |
| 左结构 | 高架/行人桥 | 桥面 + 墩柱 + 红钢点缀 |
| 中轴 | 双轨电车 | 四轨条 + 枕木 + 黄边线 |
| 叮叮 | 经典双层 | 米白 + 橙，无顶玩偶 |
| 车流 | 外车道 | 红的士 + 私家车，不占电车区 |
| 楼 | 中环幕墙峡谷 | podium+塔身+setback，程序幕墙贴图 |
| 细节 | 花槽/灯杆/红绿灯 | Instanced 灯杆 + 橙花 |

### 1 写实外观 (P0 / R16)
- **真实街景裁贴**：`assets/images/webgl-tex/facade-*.jpg`（从 hero 静帧裁）
- 沥青 / 橱窗 / IFC strip 异步加载，失败回退程序贴图
- PMREM + ACES

### 2 几何更中环
- IFC 更近更高 + 圆冠；高架更高更长（A1）
- 叮叮双层比例；的士顶灯+银顶条
- 楼高错落 + podium/setback

### 3 性能
- 移动端：DPR≤1.5、关阴影、少车/杆
- InstancedMesh：虚线、枕木、灯杆

## API

```js
window.__centralWebGL.setProgress(tLin, isDaylightStage)
window.__centralWebGL.resize()
window.__heroMode // 'webgl-central' | 'photo-ladder'
```

## 后续升级（电影级）

1. 用真实中环简模 / photogrammetry 替换 box 楼
2. 楼面贴图（玻璃反射 env map / HDRI）
3. 更准的车模型 + 车灯
4. 性能：InstancedMesh、移动端降配
5. 可选：把 hero 照片 bake 进 2.5D plane 作过渡

## 与产考技术对齐

| Montfort | 我们 v1 |
|----------|---------|
| WebGL 连续世界 | ✅ Three.js |
| Scroll 绑相机 | ✅ hero tLin |
| 主体持续动 | ✅ 车/叮叮 |
| 工作室级 DCC 资产 | ❌ 程序化盒子（下一阶段） |
