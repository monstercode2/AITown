# AI Town 2D 前端 MVP 开发文档（Canvas/react-konva 方案）

## 目标
- 用 Canvas 或 react-konva 实现一个 MVP 版的 2D 小镇前端：
  - 网格地图渲染
  - agent（小人/emoji/图片）渲染
  - 实时刷新（WebSocket 推送）
  - 支持点击 agent 查看详情

---

## 技术选型
- **推荐框架**：React + [react-konva](https://konvajs.org/docs/react/)（Canvas 2D 渲染，易于组件化）
- 也可用原生 Canvas + 纯 JS/TS 实现原型
- 状态管理：React useState/useEffect 即可
- 实时通信：原生 WebSocket API

---

## 目录结构建议

```
frontend/
  ├── pages/
  │     └── index.tsx         # 主页，2D 小镇主界面
  ├── components/
  │     ├── TownMap.tsx       # 地图和 agent 渲染（react-konva）
  │     ├── AgentDetail.tsx   # agent 详情弹窗
  │     └── SimulationControl.tsx # 控制区
  ├── utils/
  │     └── ws.ts             # WebSocket 工具
  ├── types/
  │     └── index.ts          # Agent/Event/Map 类型定义
  └── ...
```

---

## MVP 功能拆解

### 1. 地图渲染
- 用 react-konva 的 `<Stage><Layer><Rect/></Layer></Stage>` 渲染 10x10 网格
- 每个格子可根据地形/可行走性着色

### 2. agent 渲染
- 用 `<Image/>` 或 `<Text text="😀"/>` 渲染 agent
- agent 的 position 决定其在网格中的坐标
- 可用 emoji、svg 或小图片作为形象

### 3. 实时刷新
- 页面加载时 fetch `/api/agent` `/api/simulation` `/api/event` 获取初始数据
- 连接 WebSocket `/ws/simulation` 或 `/ws/agent/{id}`，收到推送后刷新 agent/事件状态

### 4. 交互
- 点击 agent 显示弹窗，展示详细属性、记忆、关系等
- 控制区支持启动/暂停/重置 simulation

---

## 关键代码片段

### 1. 安装依赖
```bash
npm install react-konva konva
```

### 2. 地图与 agent 渲染（简化版）
```tsx
// components/TownMap.tsx
import { Stage, Layer, Rect, Text } from 'react-konva';

const GRID_SIZE = 10;
const TILE_SIZE = 48;

export default function TownMap({ agents, map }) {
  return (
    <Stage width={GRID_SIZE * TILE_SIZE} height={GRID_SIZE * TILE_SIZE}>
      <Layer>
        {/* 渲染网格 */}
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
          const x = i % GRID_SIZE, y = Math.floor(i / GRID_SIZE);
          return (
            <Rect
              key={i}
              x={x * TILE_SIZE}
              y={y * TILE_SIZE}
              width={TILE_SIZE}
              height={TILE_SIZE}
              fill="#f0f0f0"
              stroke="#ccc"
            />
          );
        })}
        {/* 渲染 agent */}
        {agents.map(agent => (
          <Text
            key={agent.id}
            text="😀"
            x={agent.position.x * TILE_SIZE}
            y={agent.position.y * TILE_SIZE}
            fontSize={32}
            onClick={() => alert(agent.name)}
          />
        ))}
      </Layer>
    </Stage>
  );
}
```

### 3. WebSocket 实时刷新
```ts
// utils/ws.ts
export function connectSimulationWS(onData: (data: any) => void) {
  const ws = new WebSocket('ws://127.0.0.1:8000/ws/simulation');
  ws.onmessage = e => {
    try { onData(JSON.parse(e.data)); } catch {}
  };
  return ws;
}
```

### 4. 页面集成
```tsx
// pages/index.tsx
import { useEffect, useState } from 'react';
import TownMap from '../components/TownMap';
import { connectSimulationWS } from '../utils/ws';

export default function Home() {
  const [agents, setAgents] = useState([]);
  useEffect(() => {
    fetch('/api/agent').then(r => r.json()).then(res => setAgents(res.data));
    const ws = connectSimulationWS(data => {
      if (data.agents) setAgents(data.agents);
    });
    return () => ws.close();
  }, []);
  return <TownMap agents={agents} map={[]} />;
}
```

---

## 扩展建议
- agent 形象可用图片/emoji/svg，支持心情/状态变化动画
- 地图可支持不同地形、障碍物、建筑等
- 支持 agent 移动动画、事件气泡、对话等
- 支持地图缩放/拖拽
- 支持事件/agent 详情弹窗、交互操作

---

## 参考资料
- [react-konva 官方文档](https://konvajs.org/docs/react/)
- [Konva.js 官方文档](https://konvajs.org/docs/)
- [AI Town 后端接口文档](http://127.0.0.1:8000/docs)

---

如需完整 React 组件代码或纯 HTML+Canvas 版本，请随时告知！ 