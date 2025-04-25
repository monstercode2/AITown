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

## 目录与文件详细说明

### main.py
- FastAPI 应用主入口，注册所有 routers，配置 CORS、WebSocket、主循环等。
- 直接用 `uvicorn backend.main:app --reload` 启动服务。
- 可扩展全局 API、中间件、异常处理等。

### state.py
- 早期用于全局状态，现仅用于环境变量加载（如 API KEY）。
- 业务数据已迁移到数据库。

### config.py
- 统一配置文件，包含 LLM 模型、agent 预设、全局参数等。
- 可直接编辑或通过 ConfigManager 热更新。

### config_manager.py
- 动态加载和管理 config.py 配置。
- 提供 reload、get_llm_models、get_agent_presets 等方法。

### loop.py
- 仿真主循环逻辑，定时生成事件、推进 agent 状态。
- 由 main.py 启动线程运行。

### models.py
- 全局数据结构定义（Pydantic BaseModel）。
- 包含 Agent、Event、Memory、ResponseModel、SimulationSettings、AgentUpdateModel 等。
- 所有 API 入参/出参、数据库映射都用这些模型。

### requirements.txt
- Python 依赖包列表。
- 用 `pip install -r requirements.txt` 安装。

### test.html
- 本地后端 API 测试页面，浏览器直接打开。
- 可测试所有 API、事件、记忆、WebSocket 推送等。

### __init__.py
- Python 包标识文件。

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

### memory_service.py
- 记忆业务逻辑与数据库操作（CRUD）。
- 支持多条件检索、批量导入等扩展。

### llm_service.py
- LLM 相关业务逻辑（决策、事件生成等），包括 prompt 拼接、记忆写入等。
- 支持多模型、流式输出、复杂 prompt 等扩展。

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

## 其他说明

- 所有 Service 层均已与 Supabase 云数据库深度集成，所有数据操作都持久化。
- 所有 API 路由均通过 Service 层操作，前端页面所有功能均为真实数据。
- 如需扩展新业务，只需在 models、service、router 三层分别扩展即可。

---

如需更细致的开发指导或某一模块的详细用法，请查阅对应文件注释或联系维护者。 