# AI Town FastAPI 后端项目说明

## 项目结构总览

```
backend/
├── main.py                # FastAPI 应用主入口
├── state.py               # 全局状态/环境变量加载（已弃用数据存储）
├── config.py              # 统一配置文件（模型、预设、全局参数）
├── config_manager.py      # 配置热加载与管理
├── loop.py                # 仿真主循环逻辑
├── models.py              # 全局数据结构定义（Pydantic）
├── requirements.txt       # Python 依赖包列表
├── test.html              # 本地后端 API 测试页面
├── __init__.py            # 包标识
├── routers/               # 路由层（API接口）
├── services/              # 业务逻辑与数据库操作层
```

## 依赖环境

- Python 3.9+
- FastAPI
- Uvicorn
- python-dotenv
- pydantic
- requests
- openai
- supabase-py

安装依赖：
```
pip install -r requirements.txt
```

## 文件与模块详细说明（2025年4月最新）

### config.py
- **作用**：全局配置文件，定义所有agent、事件生成器（镇长/Titan）、LLM模型、全局参数等。
- **主要内容**：
  - AGENT_PRESETS：所有智能体的详细设定，包括name、avatar（前端2D可视化）、llmPrompts（个性化prompt）、职业、性格、经济、政策敏感度等。
  - EVENT_GENERATOR_PRESET：镇长/Titan的设定，支持独立prompt和avatar。
  - LLM_MODELS：支持多大模型灵活切换。
- **典型用法**：前后端均可直接读取，前端用于渲染角色、头像、属性，后端用于驱动LLM决策与事件生成。
- **可扩展点**：可随时新增/调整角色、prompt、经济/政策设定、avatar等。

### models.py
- **作用**：全局数据结构定义，基于Pydantic。
- **主要内容**：
  - Agent、Event、Memory、Relationship等核心模型，支持llmPrompts、avatar等自定义字段。
  - 2024-04-29升级：Agent模型新增emotion（情感状态）和relationships（社会关系）字段，支持情感与社会关系建模。
- **典型用法**：所有API、数据库、服务层严格依赖这些模型，保证数据一致性。
- **可扩展点**：可扩展agent属性、记忆类型、事件结构等。

### main.py
- **作用**：FastAPI应用主入口，注册所有routers，配置CORS、WebSocket、主循环等。
- **主要内容**：API路由注册、服务启动、全局中间件。
- **典型用法**：`uvicorn backend.main:app --reload` 启动。
- **可扩展点**：可扩展全局API、中间件、异常处理等。

### state.py
- 早期用于全局状态，现仅用于环境变量加载（如 API KEY）。
- 业务数据已迁移到数据库。

### loop.py
- **作用**：仿真主循环逻辑，推进agent状态、定时生成事件。
- **主要内容**：main_loop函数，支持多线程。
- **典型用法**：由main.py启动仿真线程。
- **可扩展点**：可扩展仿真节奏、事件生成策略等。

### config_manager.py
- **作用**：配置热加载与管理。
- **主要内容**：get_agent_presets、reload等方法。
- **典型用法**：state.py等动态加载agent/event配置。
- **可扩展点**：支持前端热更新、配置版本管理等。

### test.html
- **作用**：本地后端API测试页面，支持agent决策、事件生成、WebSocket推送等。
- **主要内容**：可视化测试所有API，便于开发调试。
- **典型用法**：浏览器直接打开。
- **可扩展点**：可扩展为前端管理后台。

### requirements.txt
- **作用**：依赖包列表。
- **主要内容**：fastapi、uvicorn、pydantic、openai、supabase-py等。

### __init__.py
- **作用**：包标识。

---

## routers/ 路由层

### agent.py
- agent 相关 API 路由（增删查改），全部通过 AgentService 操作 Supabase。
- 可扩展批量导入、分页、复杂查询等。

### event.py
- 事件相关 API 路由（增删查改、LLM 生成），全部通过 EventService 操作 Supabase。
- 支持事件链、批量操作等扩展。

### memory.py
- 记忆相关 API 路由（增删查），全部通过 MemoryService 操作 Supabase。
- 支持多条件检索、批量导入等扩展。

### llm.py
- LLM 相关 API 路由（如 agent 决策），调用 LLMService。
- 可扩展 LLM 事件生成、批量决策等。

### websocket.py
- WebSocket 路由，支持仿真状态/事件/agent 实时推送。
- 可扩展更多推送类型、订阅机制等。

### log.py
- 日志相关 API 路由，查询 agent 相关事件日志。
- 可扩展更多日志类型、导出等。

### simulation.py
- 仿真控制相关 API 路由，控制仿真启动/暂停/重置等。
- 可扩展仿真参数调整、状态查询等。

---

## services/ 业务逻辑与数据库操作层

### supabase_client.py
- 全局 Supabase 连接管理，所有 Service 层通过此 client 操作数据库。
- 如需切换数据库、密钥，修改此文件。

### agent_service.py
- agent 业务逻辑与数据库操作（CRUD）。
- 可扩展批量操作、复杂查询等。

### event_service.py
- 事件业务逻辑与数据库操作（CRUD），事件写入后自动写入记忆/属性。
- 支持事件链、批量操作等扩展。
- 2024-04-29升级：事件写入时自动调整相关Agent的情感和关系分数，正向互动提升好感度，负面事件降低好感度，并写回Agent表。

### memory_service.py
- 记忆业务逻辑与数据库操作（CRUD）。
- 支持多条件检索、批量导入等扩展。

### llm_service.py
- LLM 相关业务逻辑（决策、事件生成等），包括 prompt 拼接、记忆写入等。
- 支持多模型、流式输出、复杂 prompt 等扩展。
- 2024-04-29升级：prompt拼接自动注入情感状态、社会关系分数、历史多轮对话内容，支持更复杂的多轮对话与社会推理。

### log_service.py
- 日志业务逻辑，查询 agent 相关事件日志。
- 可扩展更多日志类型、导出等。

### simulation_service.py
- 仿真控制业务逻辑，实现仿真主循环控制。
- 可扩展更多仿真参数、状态管理等。

### websocket_service.py
- WebSocket 连接与推送管理，实现实时推送。
- 可扩展更多推送类型、订阅机制等。

---

## 关键特色与前后端联动说明

- **agent与事件生成器支持avatar字段**，前端2D可视化渲染友好。
- **llmPrompts支持每个角色完全独立的个性化prompt**，极大提升智能体行为多样性。
- **经济/政策/记忆系统深度集成**，所有决策、事件、记忆均可持久化、可追溯。
- **前端可直接读取所有agent、事件生成器的关键信息**，实现角色列表、地图渲染、详情弹窗、实时日志等。
- **所有API、服务、数据结构均可灵活扩展**，适合持续演化的AI小镇项目。
- **2024-04-29升级：AI小镇已支持多轮对话、情感建模、社会关系推理。Agent决策时会自动感知自身情感、与他人的关系分数，并结合历史多轮对话内容做出更真实的反应。事件写入后会自动调整相关Agent的情感和关系，推动社会网络动态演化。**

如需更细致的开发指导或某一模块的详细用法，请查阅对应文件注释或联系维护者。

## 2025年4月重大升级说明

### 多轮对话闭环
- 智能体决策时会优先处理"别人对我说"的最新DIALOGUE记忆，prompt自动引导"请针对刚刚收到的消息做出回应"。
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

--- 

## 2024年4月AI能力升级
本次升级实现了AI小镇的多轮对话、情感建模、社会关系推理等高级AI能力：
- Agent模型新增emotion（情感状态）和relationships（社会关系）字段，支持情感与社会关系建模。
- LLMService prompt拼接自动注入情感状态、社会关系分数、历史多轮对话内容，支持更复杂的多轮对话与社会推理。
- EventService事件写入时自动调整相关Agent的情感和关系分数，正向互动提升好感度，负面事件降低好感度，并写回Agent表。
升级后，AI小镇的智能体将具备更真实的情感、社会互动和多轮对话能力，行为更具拟人性和社会性。

--- 