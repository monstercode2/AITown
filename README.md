# AI小镇 (AI Town)

AI小镇是一个基于大语言模型的多智能体模拟系统，它模拟了一个小镇中多个AI角色的互动、决策和生活。每个角色都拥有自己的记忆、性格和社交关系，可以自主决策并与其他角色和环境互动。

![AI小镇预览图](./public/preview.png)

## 项目特点

- **自主智能体**：每个小镇居民都是一个具有独特记忆和个性的智能体，能够进行自主决策
- **记忆系统**：智能体拥有长期和短期记忆，会影响其决策和行为
- **社交关系**：智能体之间可以建立不同类型的社交关系，并随着互动而变化
- **生活模拟**：模拟小镇居民的日常活动、工作、社交和娱乐
- **随机事件**：基于LLM生成的随机事件，为小镇生活增添变数
- **可视化界面**：直观的网格化地图和角色展示，清晰呈现模拟结果

## 技术栈

- **前端框架**：Next.js 14 + React 18 + TypeScript
- **状态管理**：Zustand
- **UI组件**：Tailwind CSS
- **实时通信**：Socket.IO
- **AI服务**：阿里百炼(qwen-plus), Gemini
- **开发工具**：ESLint + Prettier

## 核心功能

### 1. 地图系统

使用网格化地图表示小镇布局，包含不同类型的地形和建筑：
- 地面 (GROUND)
- 房屋 (HOUSE)
- 商店 (SHOP)
- 公园 (PARK)
- 道路 (ROAD)

每个格子有属性如位置坐标、是否可行走、当前占用状态等。

### 2. Agent系统

每个Agent（小镇居民）拥有：
- 基本属性（ID、名称、位置）
- 状态（休息、工作、社交等）
- 个性特点和性格特征
- 社交关系网络
- 记忆系统
- 需求系统（能量、社交、娱乐等）
- 日程安排

### 3. 记忆系统

Agent的记忆分为多种类型：
- 互动记忆 (INTERACTION)：与其他Agent的交互
- 事件记忆 (EVENT)：发生的事件
- 观察记忆 (OBSERVATION)：观察到的现象
- 情感记忆 (EMOTION)：情感体验

记忆具有重要性级别，会随时间衰减，并影响Agent的决策。

### 4. 事件系统

事件可以是环境事件、社交事件、个人事件或小镇事件，会影响一个或多个Agent。
事件包含：
- 描述内容
- 影响范围
- 影响对象
- 影响效果
- 持续时间

### 5. 决策系统

基于大语言模型(LLM)的决策系统，考虑：
- 环境信息
- 个人状态
- 记忆内容
- 社交关系
- 个性特点

Agent可以决定移动、交互、对话或其他行为。

### 6. 时间系统

模拟时间流逝，包括：
- 日/夜循环
- 时间加速功能
- 基于时间的事件触发
- 时间相关的Agent行为变化

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建`.env.local`文件，添加以下内容：

```
DASHSCOPE_API_KEY=你的阿里百炼API密钥
GEMINI_API_KEY=你的Gemini API密钥（可选）
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看项目。

### 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── components/           # React组件
│   ├── Agent/            # Agent相关组件
│   ├── Grid/             # 地图相关组件
│   ├── Event/            # 事件相关组件
│   └── UI/               # 界面组件
├── types/                # TypeScript类型定义
│   ├── agent.ts          # Agent类型
│   ├── grid.ts           # 地图类型
│   ├── event.ts          # 事件类型
│   └── memory.ts         # 记忆类型
├── store/                # 状态管理
│   ├── agentStore.ts     # Agent状态
│   ├── gridStore.ts      # 地图状态
│   ├── eventStore.ts     # 事件状态
│   └── timeStore.ts      # 时间状态
├── systems/              # 核心系统
│   ├── agent/            # Agent相关系统
│   ├── event/            # 事件系统
│   └── main.ts           # 主循环系统
├── lib/                  # 工具库
│   ├── llm/              # LLM集成
│   └── socket/           # WebSocket集成
├── utils/                # 工具函数
│   ├── pathfinding.ts    # 寻路算法
│   └── logger.ts         # 日志工具
└── pages/                # Next.js页面
    ├── api/              # API路由
    └── index.tsx         # 主页
```

## 扩展与自定义

### 添加新Agent

可以通过API或在初始化阶段添加新的Agent，示例：

```javascript
useAgentStore.getState().addAgent({
  id: '5',
  name: '小刚',
  position: { x: 12, y: 12 },
  state: AgentStateEnum.IDLE,
  relationships: new Map(),
  memories: [],
  attributes: {
    energy: 100,
    mood: 65,
    sociability: 75
  },
  personality: '热情、乐观、有创造力',
  currentAction: '正在做手工',
  traits: ['创意丰富', '手巧', '爱帮助人'],
  schedule: { ... },
  needs: { ... }
});
```

### 自定义地图

可以修改`src/components/Grid/constants.ts`中的`INITIAL_MAP_LAYOUT`常量来自定义地图布局：

```javascript
export const INITIAL_MAP_LAYOUT = [
  [TileType.GROUND, TileType.GROUND, TileType.HOUSE, ...],
  [TileType.ROAD, TileType.ROAD, TileType.ROAD, ...],
  ...
];
```

### 修改LLM提示词

LLM提示词模板位于`src/lib/llm/prompts/`目录下，可以根据需要修改以改变Agent的行为模式或事件生成风格。

## API文档

详细API文档请参考[API文档](./apidoc.md)。

## 贡献指南

欢迎为AI小镇项目做出贡献！请参考以下步骤：

1. Fork项目仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 详情请查看[LICENSE](LICENSE)文件

## 联系方式

如有任何问题或建议，请创建issue或通过以下方式联系我们：

- 电子邮件：[your-email@example.com](mailto:your-email@example.com)
- 微信公众号：AI小镇官方

---

**AI小镇** - 由大语言模型驱动的多智能体模拟系统
