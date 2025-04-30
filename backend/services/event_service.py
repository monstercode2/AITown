from typing import List, Optional
from backend.models import Event, Memory
from backend.services.supabase_client import supabase
from backend.services.memory_service import MemoryService
from backend.services.agent_service import AgentService
from backend.services.llm_service import LLMService
import time
import json

class EventService:
    def get_events(self, type: Optional[str] = None, limit: Optional[int] = None, offset: int = 0) -> List[Event]:
        # 添加重试机制和异常处理
        for i in range(3):  # 最多重试2次
            try:
                # 获取数据库连接状态
                try:
                    test_query = supabase.table("events").select("count(*)", count='exact').execute()
                    print(f"数据库连接状态: 表events共有{test_query.count if hasattr(test_query, 'count') else '未知'}行数据")
                except Exception as e:
                    print(f"获取数据库表总行数失败: {e}")
                
                # 构建更灵活的查询
                print(f"开始查询事件数据: type={type}, limit={limit}, offset={offset}")
                query = supabase.table("events").select("*")
                
                # 如果指定了类型，则过滤
                if type and type.strip():
                    query = query.eq("type", type)
                    print(f"按类型筛选: type={type}")
                
                # 强制按时间倒序排序
                try:
                    query = query.order("created_at", desc=True)
                except Exception:
                    # 如果created_at排序失败，尝试按start_time排序
                    try:
                        query = query.order("start_time", desc=True)
                    except Exception:
                        print("排序字段不存在，跳过排序")
                
                # 分页控制
                if offset > 0:
                    end_offset = offset + (limit or 100) - 1
                    print(f"分页范围: {offset} - {end_offset}")
                    query = query.range(offset, end_offset)
                elif limit and limit > 0:
                    print(f"仅限制数量: {limit}")
                    query = query.limit(limit)
                else:
                    # 默认最多返回50条
                    print("使用默认限制: 50条")
                    query = query.limit(50)
                
                # 执行查询
                print("执行Supabase查询...")
                res = query.execute()
                print(f"查询完成，获取到{len(res.data)}条事件")
                
                if not res.data:
                    # 无结果，再查询一次不带任何条件的
                    print("无查询结果，尝试不带条件查询...")
                    raw_query = supabase.table("events").select("*").limit(10).execute()
                    print(f"原始查询结果: {len(raw_query.data)}条")
                    if raw_query.data:
                        print(f"数据示例: {raw_query.data[0]}")
                
                # 处理数据，确保所有必要字段都存在
                events = []
                for e_data in res.data:
                    # 确保字段名称一致
                    if 'affected_agents' in e_data and isinstance(e_data['affected_agents'], str):
                        try:
                            e_data['affected_agents'] = json.loads(e_data['affected_agents'])
                        except Exception as er:
                            print(f"解析affected_agents失败: {er}")
                            e_data['affected_agents'] = []
                    
                    # 确保时间戳是整数
                    if 'start_time' in e_data and e_data['start_time'] is not None:
                        try:
                            e_data['start_time'] = int(e_data['start_time'])
                        except Exception:
                            e_data['start_time'] = int(time.time() * 1000)
                    
                    # 创建事件对象
                    try:
                        event = Event(**e_data)
                        events.append(event)
                    except Exception as ex:
                        print(f"创建事件对象失败: {ex}, 数据: {e_data}")
                        # 尝试创建最小事件对象
                        try:
                            event = Event(
                                id=e_data.get('id', f"error-{int(time.time())}"),
                                type=e_data.get('type', "ERROR"),
                                description=e_data.get('description', str(e_data)),
                                affectedAgents=e_data.get('affected_agents', []),
                                startTime=e_data.get('start_time', int(time.time() * 1000)),
                                duration=e_data.get('duration', 0)
                            )
                            events.append(event)
                        except Exception:
                            pass  # 如果连最小对象都创建失败则跳过
                
                print(f"成功转换{len(events)}个事件对象")
                return events
            except Exception as e:
                if i < 2:  # 如果不是最后一次尝试
                    print(f"警告: 获取Event列表第{i+1}次尝试失败，将重试: {e}")
                    time.sleep(0.5)  # 休眠一小段时间再重试
                else:
                    print(f"错误: 获取Event列表失败，已重试{i}次: {e}")
                    # 在最终失败时返回空列表，而不是抛异常中断整个API请求
                    return []

    def add_event(self, event: Event) -> Event:
        # 创建要存储的事件数据字典
        event_dict = event.dict(exclude_none=True)
        
        # 键名转换：确保与数据库字段匹配（驼峰转下划线）
        if 'affectedAgents' in event_dict:
            event_dict['affected_agents'] = event_dict.pop('affectedAgents')
        if 'startTime' in event_dict:
            event_dict['start_time'] = event_dict.pop('startTime')
        
        # 添加created_at字段到字典中，而不是直接设置到Event对象上
        event_dict['created_at'] = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())
        
        # 自动生成 embedding
        if getattr(event, 'embedding', None) is None and getattr(event, 'description', None):
            try:
                embedding = LLMService().get_embedding(event.description)
                event_dict['embedding'] = embedding
            except Exception as e:
                print(f"警告: 生成Event embedding失败: {e}")
        
        # 强制校验 affected_agents 字段
        if 'affected_agents' in event_dict and (not isinstance(event_dict['affected_agents'], list) or not all(isinstance(a, str) for a in event_dict['affected_agents'])):
            print(f"[add_event] affected_agents 字段类型异常: {event_dict['affected_agents']}")
            event_dict['affected_agents'] = []
        
        # 环境类记忆自动同步（如政策/税率变动）
        is_policy = event.type.upper() == 'POLICY' or \
            ('税' in event.description or '政策' in event.description or (event.meta and ('税' in str(event.meta) or '政策' in str(event.meta))))
        if is_policy:
            try:
                agent_service = AgentService()
                memory_service = MemoryService()
                agents = agent_service.get_agents()
                for agent in agents:
                    # 删除旧的政策/税率相关记忆
                    old_memories = memory_service.get_memories(agent.id, limit=100)
                    for mem in old_memories:
                        if '税' in mem.content or '政策' in mem.content:
                            memory_service.delete_memory(mem.id)
                    # 写入最新政策记忆
                    mem = Memory(
                        id=f"{event.id}-{agent.id}-policy",
                        agent_id=agent.id,
                        content=f"最新政策/税率: {event.description}",
                        timestamp=event.startTime,
                        importance=3,
                        type="POLICY",
                        related_agents=[],
                        tags=["policy"]
                    )
                    memory_service.add_memory(mem)
            except Exception as e:
                print(f"警告: 同步政策记忆失败: {e}")
        
        # 写入事件，添加异常处理
        try:
            print(f"准备写入事件数据: {event_dict}")
            supabase.table("events").insert(event_dict).execute()
            # 成功才执行后续操作
            try:
                # 自动为受影响 agent 写入记忆，并同步属性
                self._write_event_memories_and_update_agents(event)
                # 事件后自动调整情感和关系分数
                self._auto_adjust_emotion_and_relationship(event)
            except Exception as e:
                print(f"警告: 处理事件后续影响失败: {e}")
            return event
        except Exception as e:
            print(f"错误: 添加Event失败: {e}")
            return event  # 仍返回event对象，但数据库操作失败

    def delete_event(self, event_id: str) -> bool:
        try:
            res = supabase.table("events").delete().eq("id", event_id).execute()
            return bool(res.data)
        except Exception as e:
            print(f"错误: 删除Event {event_id} 失败: {e}")
            return False

    def _write_event_memories_and_update_agents(self, event: Event):
        agent_service = AgentService()
        # 新增：支持互动事件写入双方记忆
        if event.from_agent and event.to_agent and event.content:
            # 发起者记忆
            mem_from = Memory(
                id=f"{event.id}-{event.from_agent}-from",
                agent_id=event.from_agent,
                content=f"你对{event.to_agent}说: {event.content}",
                timestamp=event.startTime,
                importance=2,
                type="DIALOGUE",
                related_agents=[event.to_agent],
                tags=[event.type.lower()]
            )
            MemoryService().add_memory(mem_from)
            # 接收者记忆
            mem_to = Memory(
                id=f"{event.id}-{event.to_agent}-to",
                agent_id=event.to_agent,
                content=f"{event.from_agent}对你说: {event.content}",
                timestamp=event.startTime,
                importance=2,
                type="DIALOGUE",
                related_agents=[event.from_agent],
                tags=[event.type.lower()]
            )
            MemoryService().add_memory(mem_to)
            # 受影响agent属性更新（如有impact）
            for agent_id in [event.from_agent, event.to_agent]:
                if event.impact:
                    agent_service.update_agent(agent_id, {k: v for k, v in event.impact.items()})
        else:
            for agent_id in event.affected_agents:
                # 写入记忆
                mem = Memory(
                    id=f"{event.id}-{agent_id}",
                    agent_id=agent_id,
                    content=f"参与事件: {event.description}",
                    timestamp=event.startTime,
                    importance=2,
                    type="EVENT",
                    related_agents=event.affected_agents,
                    tags=[event.type.lower()]
                )
                MemoryService().add_memory(mem)
                # 更新 agent 属性（如有 impact）
                if event.impact:
                    agent_service.update_agent(agent_id, {k: v for k, v in event.impact.items()})

    def search_events_by_embedding(self, query_embedding: list, top_k: int = 5) -> list:
        res = supabase.rpc("match_events", {"query_embedding": query_embedding, "match_count": top_k}).execute()
        return [Event(**e) for e in res.data]

    def _auto_adjust_emotion_and_relationship(self, event: Event):
        agent_service = AgentService()
        # 只处理有from_agent和to_agent的互动事件
        if event.from_agent and event.to_agent:
            # 获取双方Agent
            agents = {a.id: a for a in agent_service.get_agents() if a.id in [event.from_agent, event.to_agent]}
            from_agent = agents.get(event.from_agent)
            to_agent = agents.get(event.to_agent)
            # 关系调整规则
            positive_types = ["DIALOGUE", "GIFT", "COOPERATION", "REQUEST_HELP"]
            negative_types = ["CONFLICT", "REFUSE", "NEGATIVE"]
            # 默认调整幅度
            rel_delta = 0.0
            emotion_from = None
            emotion_to = None
            if event.type.upper() in positive_types:
                rel_delta = 0.1
                if event.type.upper() == "GIFT":
                    emotion_to = "高兴"
                elif event.type.upper() == "COOPERATION":
                    emotion_from = emotion_to = "积极"
                else:
                    emotion_to = "愉快"
            elif event.type.upper() in negative_types:
                rel_delta = -0.2
                emotion_to = "失落"
                emotion_from = "不满"
            # 调整关系分数
            if from_agent and to_agent:
                # from_agent对to_agent
                rels = from_agent.relationships or {}
                rels[to_agent.id] = round(rels.get(to_agent.id, 0.0) + rel_delta, 2)
                agent_service.update_agent(from_agent.id, AgentUpdateModel(relationships=rels))
                # to_agent对from_agent
                rels2 = to_agent.relationships or {}
                rels2[from_agent.id] = round(rels2.get(from_agent.id, 0.0) + rel_delta, 2)
                agent_service.update_agent(to_agent.id, AgentUpdateModel(relationships=rels2))
                # 情感调整
                if emotion_from:
                    agent_service.update_agent(from_agent.id, AgentUpdateModel(emotion=emotion_from))
                if emotion_to:
                    agent_service.update_agent(to_agent.id, AgentUpdateModel(emotion=emotion_to)) 