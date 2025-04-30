# AI Town FastAPI 后端开发日志

## 一、当前开发进度总结（2025年4月）

### 已完成的主要功能

- 完成多智能体（Agent）自治仿真框架，支持多角色并行决策与互动。
- 实现基于 FastAPI 的 RESTful API，涵盖 agent、event、memory、llm、simulation、websocket 等核心接口。
- 支持 Supabase 云数据库，所有 agent、事件、记忆均持久化存储，支持多端同步。
- 每个 agent 支持独立的 llmPrompts、avatar、性格、职业、模型等设定，极大提升行为多样性。
- 事件生成器（镇长/Titan）可自动生成新事件，驱动仿真循环。
- 前端测试页（test.html）支持自动事件-全员反应-再事件的闭环仿真流程。
- 针对云数据库写入延迟，前端已实现每次 agent 反应后 5 秒延迟刷新，保证数据一致性。
- 记忆系统支持按 agent_id 查询、分页、类型过滤，便于行为追溯与分析。
- 支持多大模型灵活切换，模型选择可全局统一或单 agent 独立配置。
- 编写详细 README、技术报告书，规范团队协作与后续维护。

### 技术难点与解决方案

- **LLM 决策一致性**：通过 prompt 结构化拼接，确保 agent 行为与设定高度一致。
- **数据库写入延迟**：前端增加延迟与多次刷新，保证数据展示准确。
- **仿真流程同步**：采用严格的事件-全员反应-再事件顺序，避免并发错乱。
- **可扩展性**：所有模块均支持热插拔与动态扩展，适应项目持续演化。

## 二、未来开发方向与建议

### 1. 功能扩展

- 增加经济系统、政策系统等复杂社会机制，丰富 agent 行为与互动。
- 支持 2D/3D 地图可视化，提升仿真展示与交互体验。
- 引入更复杂的社会关系建模（如亲属、组织、利益团体等）。
- 支持多轮对话、长期记忆与情感建模，提升智能体拟人化水平。
- 增加前端管理后台，支持角色、事件、记忆的可视化管理与编辑。
- 支持 LLM 流式输出与多轮推理，提升决策复杂度。

### 2. 工程与架构优化

- 优化 API 性能与并发处理能力，适应大规模仿真需求。
- 增强 Supabase 数据一致性保障，探索本地缓存/消息队列等机制。
- 完善单元测试与集成测试，提升系统稳定性。
- 支持配置热更新与版本管理，便于在线调整 agent/事件设定。
- 推进微服务化，拆分核心模块，提升可维护性与扩展性。

### 3. 生态与应用拓展

- 对接外部大模型平台，支持更多 LLM 供应商与自定义模型。
- 探索与 AIGC 游戏、AI 教育、社会学仿真等领域的深度结合。
- 开放 API，支持第三方插件与社区共建。

## 三、2025年4月-智能体互动机制升级

### 主要改动

- **事件结构扩展**：Event模型新增from_agent、to_agent、content字段，支持agent间点对点互动事件（如A对B说话）。
- **记忆写入优化**：EventService写入事件时，若为互动事件，会自动为发起者和接收者分别写入"你对xx说/xx对你说"的DIALOGUE记忆。
- **感知机制升级**：LLMService在生成agent决策prompt时，会自动拼接最近一条别人对自己说的话，让agent能"听见"别人对自己说了什么，做出拟真回应。

### 预期效果

- 智能体之间可以真实"对话"，如王伟对林芳说"你好"，林芳能在prompt中感知到这句话，并结合记忆和环境做出自然回应。
- 互动事件和对话内容会被双方记忆系统记录，便于后续行为追溯和分析。

### 后续建议

- 前端可高亮展示"收到的消息"，提升可视化体验。
- 可进一步扩展互动类型（如赠送物品、协作等），丰富agent行为。

## 四、2025年4月27日 第3次开发

#### 对话记忆深度检索与上下文增强

- **对话记忆深度检索**：当agent收到他人对自己说的话时，系统会自动检索记忆库中与该人相关的所有记忆（relatedAgents包含对方），按重要性和时间排序，取最近10条，拼接为"历史互动片段"插入到prompt。
- **上下文增强**：LLM在生成回应时能结合与对方的历史互动、关系、对话等上下文，做出更拟人、更有逻辑的反应。

**预期效果**：
- 智能体在对话时能"回忆"与对方的所有重要历史，反应更真实、更具情感和连续性。
- 支持后续扩展更多排序算法、筛选规则，进一步提升智能体拟人度。

### 数据库结构与字段说明（2025年4月）

#### agents表
```sql
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT,
    position JSONB,
    state TEXT,
    llm_model TEXT,
    personality TEXT,
    current_action TEXT,
    traits JSONB,
    schedule JSONB,
    needs JSONB,
    attributes JSONB,
    relationships JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### events表
```sql
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    type TEXT,
    description TEXT,
    affected_agents JSONB,
    start_time BIGINT,
    duration INT,
    impact JSONB,
    meta JSONB,
    scope TEXT,
    position JSONB,
    -- 建议新增以下字段以支持互动事件
    from_agent TEXT,   -- 发起者ID
    to_agent TEXT,     -- 接收者ID
    content TEXT,      -- 互动内容
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### memories表
```sql
CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    agent_id TEXT,
    content TEXT,
    timestamp BIGINT,
    importance INT,
    type TEXT,
    related_agents JSONB,
    tags JSONB
);
```

> **说明：**
> - 目前events表建议新增`from_agent`、`to_agent`、`content`字段，以支持点对点互动事件和对话记忆深度检索。
> - agents、memories表结构已满足现有业务需求。

### 2025年4月27日 第4次开发

#### 测试页面WebSocket与记忆显示优化

- WebSocket连接按钮默认连接/ws/simulation，去除clientId等无效参数，彻底避免403 Forbidden报错。
- Agent记忆显示分组优化：每个Agent的记忆分组显示，最新在上，每条记忆显示时间、类型、重要性，LLM_RESPONSE类型高亮，内容自动换行，结构更清晰。
- 提升了测试页面"Agent记忆与最新反应"部分的可读性和开发调试体验。

### 2025年4月28日 互动事件解析机制升级

- **多互动类型支持**：llm_service.py升级，自动解析LLM输出中的ACTION字段，支持SPEAK/TALK/INTERACT（对话）、GIFT（赠送物品）、COOPERATE（协作）、REQUEST_HELP（请求帮助）等多种互动类型。
- **自定义对话格式**：正则表达式优化，自动识别ACTION、TARGET、MESSAGE、ITEM等字段，允许LLM输出如下格式：
  ```
  ACTION: GIFT
  TARGET: 小红
  ITEM: "苹果"
  MESSAGE: "送你一个苹果，希望你开心！"
  ```
- **事件类型自动生成**：根据ACTION类型自动生成DIALOGUE、GIFT、COOPERATION、REQUEST_HELP等事件，写入Supabase events表。
- **兼容旧格式**：对话类ACTION仍兼容原有SPEAK/TALK/INTERACT格式。
- **后续建议**：可继续扩展更多互动类型（如交易、威胁、联盟等），并在前端高亮展示不同类型互动。

## 2025年4月28日 重大机制升级

### 多轮对话闭环
- 智能体决策时优先处理"别人对我说"的最新DIALOGUE记忆，prompt自动引导"请针对刚刚收到的消息做出回应"。
- 若输出为DIALOGUE，系统自动为对方生成"待回应"事件，实现"你说-我听-我回应"的多轮对话流转。

### 行动结果反馈
- 每次agent行动后，自动生成"结果事件"并写入记忆，支持LLM输出具体结果或用默认模板补全，便于后续推理和行动链条延续。

### 环境类记忆自动同步
- 政策/税率等变动时，所有agent的相关旧记忆会被自动删除，并写入最新政策记忆，确保环境信息一致。

### 重要性动态评估
- 记忆重要性可由LLM输出或后端根据内容自动赋值，区分优先级，提升决策合理性。

### 结构化思考链条与自我成长
- prompt为结构化"思考链条"，分段输出身份、社会关系、记忆回溯、目标动机、情感状态、当前环境、自我反思。
- agent的行为将更具一致性、深度、身份关联和互动性。

## 2024年4月AI能力升级
- Agent模型新增emotion（情感状态）和relationships（社会关系）字段，支持情感与社会关系建模。
- LLMService prompt拼接自动注入情感状态、社会关系分数、历史多轮对话内容，支持更复杂的多轮对话与社会推理。
- EventService事件写入时自动调整相关Agent的情感和关系分数，正向互动提升好感度，负面事件降低好感度，并写回Agent表。
- 升级后，AI小镇的智能体将具备更真实的情感、社会互动和多轮对话能力，行为更具拟人性和社会性。

---

**本日志将持续更新，记录项目每一阶段的关键进展与技术思考。** 