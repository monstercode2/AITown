# AI Town 2D Canvas/react-konva 前端开发日志

## 项目目标
- 用 React + react-konva 实现 AI Town 的 2D 网格小镇可视化前端。
- 支持地图渲染、agent 渲染、WebSocket 实时刷新、交互操作。

---

## 技术选型
- **主框架**：React (Next.js 可选)
- **2D 渲染**：react-konva（基于 Canvas，适合复杂2D场景）
- **实时通信**：原生 WebSocket API
- **状态管理**：React useState/useEffect（MVP 阶段无需 Redux）
- **样式**：Tailwind CSS 或简单 CSS

---

## 开发顺序

### 1. 项目初始化
- 创建前端项目（如 `npx create-next-app frontend`）
- 安装依赖：
  ```bash
  npm install react-konva konva
  ```
- 目录结构规划（见 canvas_mvp.md 文档）

### 2. 地图组件开发
- 目标：用 react-konva 渲染 10x10 网格地图
- 步骤：
  - 新建 `components/TownMap.tsx`
  - 用 `<Stage><Layer><Rect/></Layer></Stage>` 渲染网格
  - 支持不同地形/可行走性着色（可后续扩展）
- 技术要点：
  - Konva 的坐标系、尺寸单位（像素）
  - React 组件化，props 传递地图数据

### 3. agent 渲染
- 目标：在地图上渲染 agent（小人/emoji/图片）
- 步骤：
  - TownMap 组件中遍历 agents，渲染 `<Text text="😀"/>` 或 `<Image/>`
  - agent 的 position 决定其在网格中的位置
  - 支持点击 agent 触发事件
- 技术要点：
  - Konva 的元素层级、事件绑定
  - agent 形象可用 emoji、svg、图片，后续可扩展动画

### 4. 后端数据对接
- 目标：页面加载时获取 agent/map/事件数据
- 步骤：
  - 用 fetch 获取 `/api/agent` `/api/simulation` `/api/event` 数据
  - 用 useEffect 初始化数据
- 技术要点：
  - 注意数据结构与后端保持一致
  - 错误处理与 loading 状态

### 5. WebSocket 实时刷新
- 目标：实现前端与后端的实时同步
- 步骤：
  - 新建 `utils/ws.ts`，封装 WebSocket 连接
  - 连接 `/ws/simulation`，收到推送后刷新 agent/map 状态
  - 断线重连、心跳可后续扩展
- 技术要点：
  - WebSocket 生命周期管理（onopen/onmessage/onclose）
  - JSON 数据解析与状态更新

### 6. 交互与弹窗
- 目标：支持点击 agent 查看详情
- 步骤：
  - 新建 `components/AgentDetail.tsx`，用 Modal/Drawer 展示 agent 详细信息
  - TownMap 组件中 onClick 事件触发弹窗
- 技术要点：
  - React 组件通信、props 传递
  - 弹窗/抽屉 UI 选型（可用 Antd/MUI/自定义）

### 7. 控制区开发
- 目标：支持启动/暂停/重置 simulation
- 步骤：
  - 新建 `components/SimulationControl.tsx`，按钮调用后端接口
  - 状态变化后自动刷新页面
- 技术要点：
  - fetch/axios 调用 POST `/api/simulation?action=xxx`
  - 状态同步与按钮禁用逻辑

### 8. 样式与美化
- 目标：基础美观、布局合理
- 步骤：
  - 用 Tailwind CSS 或简单 CSS 优化布局
  - agent/地图/弹窗样式统一
- 技术要点：
  - 响应式布局、适配不同屏幕

---

## 遇到的问题与解决方案

- **WebSocket 断线/重连**：可用 setInterval 心跳包，onclose 时自动重连
- **地图/agent 坐标不对齐**：注意 Konva 的坐标系和 TILE_SIZE 单位
- **后端数据结构变动**：前后端接口需严格对齐，建议用 typescript 类型约束
- **性能问题**：大量 agent/事件时可用 shouldComponentUpdate 优化

---

## 扩展建议
- agent 形象支持自定义图片/动画/心情表情
- 地图支持障碍物、建筑、地形变化
- agent 移动/事件发生时支持动画
- 支持地图缩放/拖拽、迷你地图
- 支持事件/agent 详情弹窗、交互操作
- 支持 LLM 决策、对话气泡等高级交互

---

## 参考资料
- [react-konva 官方文档](https://konvajs.org/docs/react/)
- [Konva.js 官方文档](https://konvajs.org/docs/)
- [AI Town 后端接口文档](http://127.0.0.1:8000/docs)
- [AI Town 2D Canvas MVP 方案](./frontend_2d_canvas_mvp.md)

---

如需具体组件代码、UI 设计稿或遇到新问题，请随时补充！ 