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
        # 1. 身份自觉
        identity = f"我是{getattr(agent, 'role', '未知角色')}{agent.name}，职责是{getattr(agent, 'duty', getattr(agent, 'role', '履行本职工作'))}。"
        # 2. 高频互动对象分析
        from collections import Counter
        partners = []
        for m in agent.memories:
            if hasattr(m, 'relatedAgents') and m.relatedAgents:
                partners.extend(m.relatedAgents)
        top_partners = [p for p, _ in Counter(partners).most_common(3)]
        rel_str = f"我最近经常和{', '.join(top_partners)}互动。" if top_partners else ''
        # 3. 记忆回溯（最近3条重要记忆）
        important_memories = sorted(agent.memories, key=lambda m: (-m.importance, -m.timestamp))[:3]
        mem_str = "最近记忆片段：" + "; ".join([m.content for m in important_memories]) if important_memories else ''
        # 4. 目标动机
        goals = getattr(agent, 'goals', None) or getattr(agent, 'goal', None) or '暂无明确目标'
        # 5. 情感状态
        mood = getattr(agent, 'mood', '普通')
        # 6. 当前环境
        visible_agents_str = ''
        for other in filter(lambda a: a.id != agent.id, self.get_all_agents()):
            rel = agent.relationships.get(other.id)
            if rel:
                visible_agents_str += f"- {other.name}（好感度:{rel.affinity} 互动:{rel.interactions} 最近:{rel.lastInteraction or '无'}) 正在{other.currentAction or '这里'}\n"
            else:
                visible_agents_str += f"- {other.name}（初次见面）正在{other.currentAction or '这里'}\n"
        from backend.state import events as global_events
        policies = [e for e in global_events if '政策' in e.description or 'policy' in (e.meta or {})]
        policies_str = ''
        for p in policies[-3:]:
            meta = p.meta or {}
            policies_str += f"- {p.description} 类型:{meta.get('type','未知')} 目标:{meta.get('target','未知')} 影响:{meta.get('affectedAgents',meta.get('affected_agents','未知'))}\n"
        env_str = (
            f"你现在在({agent.position.get('x')}, {agent.position.get('y')})，地形：{getattr(agent, 'tileType', '未知地形')}。时间：{getattr(agent, 'timeOfDay', getattr(agent, 'state', '未知时间'))}\n"
            f"你视野内的人：\n{visible_agents_str.strip()}\n"
            f"当前全局政策：\n{policies_str.strip()}"
        )
        # 8. 自我反思与成长机制
        # 简单实现：统计最近10条记忆的关键词，生成自我反思
        recent_memories = sorted(agent.memories, key=lambda m: -m.timestamp)[:10]
        all_text = ' '.join([m.content for m in recent_memories])
        import re
        words = re.findall(r'[\u4e00-\u9fa5A-Za-z]+', all_text)
        from collections import Counter
        top_words = [w for w, _ in Counter(words).most_common(5)]
        reflection = ''
        if top_words:
            reflection = f"我最近最常思考/经历的主题包括：{', '.join(top_words)}。"
        if recent_memories:
            first = recent_memories[-1].content
            last = recent_memories[0].content
            if first != last:
                reflection += f" 与最早的记忆相比，我最近的经历有了新的变化。"
        if not reflection:
            reflection = "我最近没有特别的成长或困惑。"
        # 多轮对话闭环：优先拼接"别人对我说"的最新DIALOGUE记忆
        recent_dialogue = None
        from_agent = None
        for m in sorted(agent.memories, key=lambda m: -m.timestamp):
            if m.type == 'DIALOGUE' and m.content and '对你说' in m.content:
                recent_dialogue = m.content
                from_agent = m.content.split('对你说')[0]
                break
        dialogue_str = f"你刚刚收到消息：{recent_dialogue}\n" if recent_dialogue else ''
        # 7. 结构化思考链条prompt拼接
        prompt = (
            dialogue_str +
            f"【身份自觉】{identity}\n"
            f"【社会关系】{rel_str}\n"
            f"【记忆回溯】{mem_str}\n"
            f"【目标动机】{goals}\n"
            f"【情感状态】{mood}\n"
            f"【当前环境】\n{env_str}\n"
            f"【自我反思】{reflection}\n"
            + ("请针对刚刚收到的消息做出回应，并结合你的身份、记忆和目标给出决策理由。\n" if recent_dialogue else "") +
            "请详细描述你的具体行动计划、预期结果和可能遇到的问题。\n"
            "请分析你视野内其他人的行为、意图和需求，并思考如何与他们产生有意义的互动。\n"
            "最后，请详细描述你的思考过程和下一步决策，并说明理由。"
        )
        return prompt

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
        # 动态评估重要性
        importance = 2
        # 若LLM输出中有"重要性"字段，优先采用
        import re
        imp_match = re.search(r'["\']?重要性["\']?\s*[:：]\s*([0-9])', content)
        if imp_match:
            try:
                importance = int(imp_match.group(1))
            except Exception:
                importance = 2
        else:
            # 根据内容关键词和类型赋值
            if any(k in content for k in ['政策', '税', '重大', '紧急']):
                importance = 3
            elif any(k in content for k in ['日常', '普通', '打招呼', '观察']):
                importance = 1
            else:
                importance = 2
        mem = Memory(
            id=f"llm-{int(time.time() * 1000)}",
            agent_id=agent.id,
            content=content,
            timestamp=int(time.time() * 1000),
            importance=importance,
            type="LLM_RESPONSE",
            relatedAgents=None,
            tags=["llm"]
        )
        MemoryService().add_memory(mem)
        # 若输出为DIALOGUE，自动为对方生成"待回应"事件
        import re
        from backend.services.event_service import EventService
        pattern = re.compile(r"ACTION:\s*(SPEAK|TALK|INTERACT)[^\n]*\n.*?TARGET:\s*([\u4e00-\u9fa5A-Za-z0-9_\-]+)[^\n]*\n.*?MESSAGE:\s*['\"]?(.+?)['\"]?($|\n)", re.IGNORECASE|re.DOTALL)
        match = pattern.search(content)
        if match:
            action_type = match.group(1).upper()
            target_name = match.group(2)
            message = match.group(3).strip()
            all_agents = self.get_all_agents()
            to_agent = next((a for a in all_agents if a.name == target_name or a.id == target_name), None)
            if to_agent and message:
                event = Event(
                    id=str(int(time.time() * 1000)),
                    type="DIALOGUE",
                    description=f"{agent.name}对{to_agent.name}说: {message}",
                    affectedAgents=[agent.id, to_agent.id],
                    startTime=int(time.time() * 1000),
                    duration=10000,
                    impact={},
                    meta={"action": action_type, "from": agent.name, "to": to_agent.name, "message": message, "pending_response": True},
                    from_agent=agent.id,
                    to_agent=to_agent.id,
                    content=message
                )
                EventService().add_event(event)
        # 行动结果反馈：若LLM输出有"结果"字段则写入，否则用默认模板
        result_match = re.search(r'结果[：:]\s*([\u4e00-\u9fa5A-Za-z0-9_\-，。,.！!\s]+)', content)
        result_text = result_match.group(1).strip() if result_match else None
        if result_text:
            result_mem = Memory(
                id=f"result-{int(time.time() * 1000)}",
                agent_id=agent.id,
                content=f"你完成了本次行动，结果是：{result_text}",
                timestamp=int(time.time() * 1000),
                importance=importance,
                type="RESULT",
                relatedAgents=None,
                tags=["result"]
            )
            MemoryService().add_memory(result_mem)
        else:
            # 默认模板
            result_mem = Memory(
                id=f"result-{int(time.time() * 1000)}",
                agent_id=agent.id,
                content=f"你完成了本次行动，结果待观察。",
                timestamp=int(time.time() * 1000),
                importance=1,
                type="RESULT",
                relatedAgents=None,
                tags=["result"]
            )
            MemoryService().add_memory(result_mem)
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