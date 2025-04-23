# AI小镇 API文档

## 目录

1. [模拟控制API](#模拟控制api)
2. [Agent管理API](#agent管理api)
3. [事件管理API](#事件管理api)
4. [LLM服务API](#llm服务api)
5. [内部状态管理API](#内部状态管理api)

## 模拟控制API

### 获取模拟状态

获取当前模拟的运行状态、设置和Agent信息。

- **URL**: `/api/simulation`
- **方法**: `GET`
- **响应**: 
  ```json
  {
    "status": "running|paused|idle",
    "settings": {
      "timeScale": 1,
      "eventFrequency": 0.1,
      "autoAgentDecisions": true
    },
    "uptime": 3600,
    "agents": [...]
  }
  ```

### 启动模拟

启动AI小镇模拟。

- **URL**: `/api/simulation?action=start`
- **方法**: `POST`
- **响应**: 
  ```json
  {
    "status": "running",
    "settings": {
      "timeScale": 1,
      "eventFrequency": 0.1,
      "autoAgentDecisions": true
    },
    "agents": [...]
  }
  ```

### 暂停模拟

暂停当前运行的模拟。

- **URL**: `/api/simulation?action=pause`
- **方法**: `POST`
- **响应**: 
  ```json
  {
    "status": "paused",
    "settings": {
      "timeScale": 1,
      "eventFrequency": 0.1,
      "autoAgentDecisions": true
    }
  }
  ```

### 重置模拟

重置模拟状态，清除所有进度。

- **URL**: `/api/simulation?action=reset`
- **方法**: `POST`
- **响应**: 
  ```json
  {
    "status": "idle",
    "settings": {
      "timeScale": 1,
      "eventFrequency": 0.1,
      "autoAgentDecisions": true
    }
  }
  ```

### 更新模拟设置

更新模拟的运行参数。

- **URL**: `/api/simulation?action=settings`
- **方法**: `PUT`
- **请求体**: 
  ```json
  {
    "timeScale": 2,
    "eventFrequency": 0.2,
    "autoAgentDecisions": true
  }
  ```
- **响应**: 
  ```json
  {
    "settings": {
      "timeScale": 2,
      "eventFrequency": 0.2,
      "autoAgentDecisions": true
    }
  }
  ```

## Agent管理API

### 获取所有Agent

获取所有Agent的信息。

- **URL**: `/api/agents`
- **方法**: `GET`
- **响应**: 
  ```json
  {
    "agents": [
      {
        "id": "1",
        "name": "小明",
        "position": {"x": 5, "y": 5},
        "state": "IDLE",
        "attributes": {...},
        "personality": "活泼、好奇、友善",
        "currentAction": "正在探索小镇",
        "memories": [...]
      },
      ...
    ]
  }
  ```

### 获取单个Agent

获取指定ID的Agent信息。

- **URL**: `/api/agents/{id}`
- **方法**: `GET`
- **响应**: 
  ```json
  {
    "id": "1",
    "name": "小明",
    "position": {"x": 5, "y": 5},
    "state": "IDLE",
    "attributes": {...},
    "personality": "活泼、好奇、友善",
    "currentAction": "正在探索小镇",
    "memories": [...]
  }
  ```

### 添加Agent

添加新的Agent到小镇。

- **URL**: `/api/agents`
- **方法**: `POST`
- **请求体**: 
  ```json
  {
    "name": "小刚",
    "position": {"x": 7, "y": 7},
    "personality": "勇敢、直率、好奇",
    "traits": ["热心", "爱冒险", "善解人意"]
  }
  ```
- **响应**: 
  ```json
  {
    "id": "5",
    "name": "小刚",
    "position": {"x": 7, "y": 7},
    "state": "IDLE",
    "personality": "勇敢、直率、好奇",
    "traits": ["热心", "爱冒险", "善解人意"],
    ...
  }
  ```

### 更新Agent

更新指定Agent的属性。

- **URL**: `/api/agents/{id}`
- **方法**: `PUT`
- **请求体**: 
  ```json
  {
    "position": {"x": 8, "y": 8},
    "currentAction": "去商店购物"
  }
  ```
- **响应**: 
  ```json
  {
    "id": "1",
    "name": "小明",
    "position": {"x": 8, "y": 8},
    "currentAction": "去商店购物",
    ...
  }
  ```

### 删除Agent

从小镇中移除指定Agent。

- **URL**: `/api/agents/{id}`
- **方法**: `DELETE`
- **响应**: 
  ```json
  {
    "success": true,
    "message": "成功移除Agent"
  }
  ```

## 事件管理API

### 获取所有事件

获取小镇中的所有事件记录。

- **URL**: `/api/events`
- **方法**: `GET`
- **响应**: 
  ```json
  {
    "events": [
      {
        "id": "1682584832000",
        "type": "ENVIRONMENTAL",
        "scope": "LOCAL",
        "description": "小镇突然下起了雨",
        "affectedAgents": ["1", "2"],
        "startTime": 1682584832000,
        "duration": 300000
      },
      ...
    ]
  }
  ```

### 获取单个事件

获取指定ID的事件详情。

- **URL**: `/api/events/{id}`
- **方法**: `GET`
- **响应**: 
  ```json
  {
    "id": "1682584832000",
    "type": "ENVIRONMENTAL",
    "scope": "LOCAL",
    "description": "小镇突然下起了雨",
    "affectedAgents": ["1", "2"],
    "startTime": 1682584832000,
    "duration": 300000
  }
  ```

### 手动创建事件

手动创建一个新事件。

- **URL**: `/api/events`
- **方法**: `POST`
- **请求体**: 
  ```json
  {
    "type": "SOCIAL",
    "scope": "INDIVIDUAL",
    "description": "小明找到了一本有趣的书",
    "affectedAgents": ["1"],
    "duration": 600000
  }
  ```
- **响应**: 
  ```json
  {
    "id": "1682584956000",
    "type": "SOCIAL",
    "scope": "INDIVIDUAL",
    "description": "小明找到了一本有趣的书",
    "affectedAgents": ["1"],
    "startTime": 1682584956000,
    "duration": 600000
  }
  ```

## LLM服务API

### 生成Agent决策

使用LLM为Agent生成决策。

- **URL**: `/api/llm/decision`
- **方法**: `POST`
- **请求体**: 
  ```json
  {
    "agentId": "1",
    "prompt": "环境信息：当前位置(5,5)，附近有商店，其他Agent在做什么..."
  }
  ```
- **响应**: 
  ```json
  {
    "decision": "ACTION: MOVE\nDIRECTION: RIGHT\nTARGET: 商店\nMESSAGE: \"我想去看看商店里有什么新商品\"",
    "tokens": {
      "input": 150,
      "output": 45
    }
  }
  ```

### 生成事件

使用LLM生成随机事件。

- **URL**: `/api/llm/event`
- **方法**: `POST`
- **请求体**: 
  ```json
  {
    "context": "{\"time\":\"上午\",\"day\":1,\"agents\":[{...},{...}]}"
  }
  ```
- **响应**: 
  ```json
  {
    "event": "在上午8点，小镇的广场上突然传来一阵悦耳的音乐声。原来是一位神秘的街头艺人出现了...",
    "tokens": {
      "input": 200,
      "output": 320
    }
  }
  ```

## 内部状态管理API

以下API用于内部状态管理，通常由系统自动调用，不建议直接使用。

### 时间系统API

- **更新游戏时间**: `useTimeStore.getState().incrementTime(seconds)`
- **设置时间**: `useTimeStore.getState().setTime(seconds)`
- **获取当前时间**: `useTimeStore.getState().currentTime`
- **获取当前天数**: `useTimeStore.getState().dayCount`

### Agent存储API

- **获取Agent**: `useAgentStore.getState().getAgent(id)`
- **设置Agent**: `useAgentStore.getState().setAgent(id, agent)`
- **添加Agent**: `useAgentStore.getState().addAgent(agent)`
- **更新Agent**: `useAgentStore.getState().updateAgent(id, updates)`
- **添加记忆**: `useAgentStore.getState().addMemory(agentId, memory)`
- **获取所有Agent**: `useAgentStore.getState().getAllAgents()`

### 事件存储API

- **添加事件**: `useEventStore.getState().addEvent(event)`
- **移除事件**: `useEventStore.getState().removeEvent(id)`
- **清除所有事件**: `useEventStore.getState().clearEvents()`

### 网格存储API

- **获取网格**: `useGridStore.getState().grid`
- **设置网格**: `useGridStore.getState().setGrid(grid)`
- **获取图块**: `useGridStore.getState().getTile(x, y)`
- **更新图块**: `useGridStore.getState().updateTile(x, y, updates)` 