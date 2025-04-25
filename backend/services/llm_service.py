import time
from typing import Optional
from backend.models import Memory, Agent, Event
from backend.state import DASHSCOPE_API_KEY, events
from openai import OpenAI
import os
import json
from backend.services.memory_service import MemoryService
from backend.config import LLM_MODELS, EVENT_GENERATOR_PRESET

class LLMService:
    def generate_environment_prompt(self, agent: Agent) -> str:
        if not hasattr(agent, 'llmPrompts') or 'decision' not in agent.llmPrompts:
            raise ValueError(f"Agent {agent.name} 未配置决策prompt (llmPrompts['decision'])")
        prompt_template = agent.llmPrompts['decision']
        # 记忆区分类型
        memories_by_type = {'政策': [], '事件': [], '对话': [], '其他': []}
        for m in sorted(agent.memories, key=lambda m: -m.importance)[:5]:
            if '政策' in m.content or m.type == 'POLICY':
                memories_by_type['政策'].append(m)
            elif m.type == 'EVENT':
                memories_by_type['事件'].append(m)
            elif m.type == 'DIALOGUE':
                memories_by_type['对话'].append(m)
            else:
                memories_by_type['其他'].append(m)
        memories_str = ''
        for k, v in memories_by_type.items():
            if v:
                memories_str += f"[{k}]\n" + '\n'.join([f"- [{m.importance}级] {m.content}" for m in v]) + '\n'
        # 关系与互动
        visible_agents_str = ''
        for other in filter(lambda a: a.id != agent.id, self.get_all_agents()):
            rel = agent.relationships.get(other.id)
            if rel:
                visible_agents_str += f"- {other.name}（好感度:{rel.affinity} 互动:{rel.interactions} 最近:{rel.lastInteraction or '无'}) 正在{other.currentAction or '这里'}\n"
            else:
                visible_agents_str += f"- {other.name}（初次见面）正在{other.currentAction or '这里'}\n"
        # policies字段详细化
        from backend.state import events as global_events
        policies = [e for e in global_events if '政策' in e.description or 'policy' in (e.meta or {})]
        policies_str = ''
        for p in policies[-3:]:
            meta = p.meta or {}
            policies_str += f"- {p.description} 类型:{meta.get('type','未知')} 目标:{meta.get('target','未知')} 影响:{meta.get('affectedAgents',meta.get('affected_agents','未知'))}\n"
        # 其他字段
        params = {
            'x': agent.position.get('x'),
            'y': agent.position.get('y'),
            'tileType': getattr(agent, 'tileType', '未知地形'),
            'timeOfDay': getattr(agent, 'timeOfDay', getattr(agent, 'state', '未知时间')),
            'visibleAgents': visible_agents_str.strip(),
            'memories': memories_str.strip(),
            'events': '\n'.join([f"- {e.description}" for e in (events[-5:] if len(events) >= 5 else events)]),
            'needs': ', '.join(f"{k}:{v}" for k, v in (agent.needs or {}).items()),
            'attributes': ', '.join(f"{k}:{v}" for k, v in (agent.attributes.dict() if hasattr(agent.attributes, 'dict') else (agent.attributes if isinstance(agent.attributes, dict) else vars(agent.attributes))).items()),
            'traits': ', '.join(agent.traits) if getattr(agent, 'traits', None) else '',
            'mood': getattr(agent, 'mood', '普通'),
            'schedule': '\n'.join([f"{k}:{v}" for k,v in (getattr(agent, 'schedule', {}) or {}).items()]),
            'tags': ', '.join(getattr(agent, 'tags', [])) if hasattr(agent, 'tags') else '',
            'policies': policies_str.strip()
        }
        return prompt_template.format(**params)

    def get_all_agents(self):
        # 避免循环依赖，延迟导入
        from backend.state import agents
        return agents

    def generate_system_prompt(self, agent: Agent) -> str:
        if not hasattr(agent, 'llmPrompts') or 'system' not in agent.llmPrompts:
            raise ValueError(f"Agent {agent.name} 未配置system prompt (llmPrompts['system'])")
        return agent.llmPrompts['system']

    def generate_role_prompt(self, agent: Agent) -> str:
        if not hasattr(agent, 'llmPrompts') or 'role' not in agent.llmPrompts:
            raise ValueError(f"Agent {agent.name} 未配置role prompt (llmPrompts['role'])")
        return agent.llmPrompts['role']

    def generate_agent_reaction(self, agent: Agent, event: Event) -> str:
        memories = agent.memories[-5:]
        mem_str = '\n'.join(f"- {m.content}" for m in memories) or '（无）'
        relationships = ', '.join(f"{k}: 好感度{v.affinity}" for k, v in agent.relationships.items()) or '（无）'
        traits = ', '.join(agent.traits) if getattr(agent, 'traits', None) else ''
        needs = ', '.join(f"{k}:{v}" for k, v in getattr(agent, 'needs', {}).items()) if getattr(agent, 'needs', None) else ''
        attributes = ''
        if getattr(agent, 'attributes', None):
            attrs = agent.attributes.dict() if hasattr(agent.attributes, 'dict') else (agent.attributes if isinstance(agent.attributes, dict) else vars(agent.attributes))
            attributes = ', '.join(f"{k}:{v}" for k, v in attrs.items())
        mood = getattr(agent, 'mood', '普通')
        # 经济属性
        role = getattr(agent, 'role', '未知')
        income = getattr(agent, 'income', '未知')
        sensitivity = getattr(agent, 'sensitivity', {})
        # 当前政策
        from backend.state import events as global_events
        policies = [e for e in global_events if '政策' in e.description or 'policy' in (e.meta or {})]
        policy_str = '\n'.join(f"- {p.description}" for p in policies[-3:]) if policies else '无'
        # 事件impact
        impact_str = ''
        if hasattr(event, 'impact') and event.impact:
            impact_str = '\n你受到的影响：' + ', '.join(f"{k}:{v}" for k,v in event.impact.items())
        return (
            f"你是AI小镇的居民（{agent.name}）。\n"
            f"职业：{role}\n"
            f"性格特点：{agent.personality or '平和友善'}\n"
            f"当前心情：{mood}\n"
            f"特征：{traits}\n"
            f"当前需求：{needs}\n"
            f"当前属性：{attributes}\n"
            f"收入：{income}\n"
            f"政策敏感度：{sensitivity}\n"
            f"你的记忆片段如下：\n{mem_str}\n"
            f"你与其他人的关系：{relationships}\n"
            f"你当前状态：{agent.state}，{agent.currentAction or ''}\n"
            f"当前全局政策：\n{policy_str}\n"
            f"{impact_str}"
            f"请针对以下事件做出你的反应（只描述你自己的行动、情绪和经济行为，不要生成事件本身）。\n\n事件内容：\n{event.description}\n"
            f"如果你的反应会引发新的事件或影响其他agent，请在JSON中用 triggeredEvent 字段详细描述（如通知、协作、经济反馈、请求帮助等）。\n请输出你的反应，格式为JSON。"
        )

    def llm_decide(self, agent: Agent, prompt: str, mode: str = 'decision', event: Optional[Event] = None) -> Optional[Memory]:
        if not DASHSCOPE_API_KEY:
            raise RuntimeError("DASHSCOPE_API_KEY未配置")
        if mode == 'reaction' and event is not None:
            full_prompt = self.generate_agent_reaction(agent, event)
        else:
            env_prompt = self.generate_environment_prompt(agent)
            full_prompt = (
                self.generate_system_prompt(agent) + '\n' +
                self.generate_role_prompt(agent) + '\n' +
                env_prompt + '\n' +
                f"用户输入：{prompt}\n"
                f"请决定你的下一步行动："
            )
        # 使用 openai.OpenAI 兼容阿里云百炼
        client = OpenAI(
            api_key=DASHSCOPE_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        model = agent.llmModel or "qwen-max"
        messages = [
            {"role": "user", "content": full_prompt}
        ]
        # QwQ等模型只支持流式输出，其他模型可选stream=False
        stream = model.startswith("qwq") or model.startswith("qwen")
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=stream
        )
        content = ""
        if stream:
            for chunk in completion:
                if chunk.choices and hasattr(chunk.choices[0], 'delta'):
                    delta = chunk.choices[0].delta
                    if hasattr(delta, 'content') and delta.content:
                        content += delta.content
        else:
            content = completion.choices[0].message.content
        from backend.models import Memory
        mem = Memory(
            id=f"llm-{int(time.time() * 1000)}",
            agent_id=agent.id,
            content=content,
            timestamp=int(time.time() * 1000),
            importance=2,
            type="LLM_RESPONSE",
            relatedAgents=None,
            tags=["llm"]
        )
        MemoryService().add_memory(mem)
        return mem

    def generate_event_via_llm(self, context: dict) -> dict:
        # context拼接包含所有agent状态、经济总览、政策历史
        from backend.state import agents, events as global_events
        agents_summary = '\n'.join([
            f"{a.name}({a.id}) 职业:{getattr(a,'role','未知')} 收入:{getattr(a,'income','未知')} 状态:{a.state} 需求:{a.needs} 属性:{a.attributes.dict() if hasattr(a.attributes,'dict') else a.attributes}" for a in agents
        ])
        economy_summary = f"总居民数:{len(agents)} 平均收入:{sum([getattr(a,'income',0) or 0 for a in agents])//max(1,len(agents))}"
        policy_history = '\n'.join([
            f"{e.description} 类型:{(e.meta or {}).get('type','未知')} 目标:{(e.meta or {}).get('target','未知')} 影响:{(e.meta or {}).get('affectedAgents',(e.meta or {}).get('affected_agents','未知'))}" for e in global_events if '政策' in e.description or 'policy' in (e.meta or {})][-5:])
        context_full = f"{context}\n\n[居民摘要]\n{agents_summary}\n[经济总览]\n{economy_summary}\n[政策历史]\n{policy_history}"
        prompts = EVENT_GENERATOR_PRESET.get('llmPrompts', {})
        if 'event_system' not in prompts or 'event_decision' not in prompts:
            raise ValueError("事件生成器未配置完整的llmPrompts (event_system/event_decision)")
        prompt = prompts['event_system'] + '\n' + prompts['event_decision'].format(context=context_full)
        client = OpenAI(
            api_key=DASHSCOPE_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        # 事件生成器模型独立选择
        model = EVENT_GENERATOR_PRESET.get('llmModel', LLM_MODELS.get('qwq-plus', {}).get('model', 'qwq-plus'))
        messages = [
            {"role": "user", "content": prompt}
        ]
        completion = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True
        )
        content = ""
        for chunk in completion:
            if chunk.choices and hasattr(chunk.choices[0], 'delta'):
                delta = chunk.choices[0].delta
                if hasattr(delta, 'content') and delta.content:
                    content += delta.content
        # 尝试解析 LLM 返回的 JSON
        try:
            event_obj = json.loads(content)
        except Exception:
            event_obj = {"description": content}
        # 自动写入 Supabase events 表
        from backend.models import Event
        import time as _time
        affected_agents = event_obj.get('affectedAgents', event_obj.get('affected_agents', []))
        if not affected_agents:
            affected_agents = []
        start_time = event_obj.get('start_time') or event_obj.get('startTime') or int(_time.time() * 1000)
        event = Event(
            id=event_obj.get('id', str(int(_time.time() * 1000))),
            type=event_obj.get('type', 'LLM'),
            description=event_obj.get('description', ''),
            affectedAgents=affected_agents,
            startTime=start_time,
            duration=event_obj.get('duration', 300000),
            impact=event_obj.get('impact', {}),
            meta=event_obj,
            scope=event_obj.get('scope'),
            position=event_obj.get('position'),
        )
        from backend.services.supabase_client import supabase
        supabase.table("events").insert(event.dict(by_alias=True, exclude_none=True)).execute()
        return event.dict() 