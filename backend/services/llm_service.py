import time
from typing import Optional
from backend.models import Memory, Agent, Event
from backend.state import DASHSCOPE_API_KEY, events
from openai import OpenAI
import os
import json
from backend.config import LLM_MODELS, EVENT_GENERATOR_PRESET

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

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
        # 3. 记忆回溯（优先用向量检索，补充最近3条重要记忆）
        context_text = ''
        for m in sorted(agent.memories, key=lambda m: -m.timestamp):
            if m.type == 'DIALOGUE' and m.content and '对你说' in m.content:
                context_text = m.content
                break
        if not context_text and agent.memories:
            context_text = agent.memories[-1].content
        vector_memories = []
        if context_text:
            try:
                embedding = self.get_embedding(context_text)
                from backend.services.memory_service import MemoryService
                vector_memories = MemoryService().search_memories_by_embedding(embedding, 5)
            except Exception as e:
                vector_memories = []
        vector_mem_str = ''
        if vector_memories:
            vector_mem_str = "\n【与当前情境最相关的历史记忆】\n" + "\n".join([f"- {m.content}" for m in vector_memories])
        # 新增：相关事件推荐
        event_str = ''
        if context_text:
            try:
                similar_events = self.get_similar_events_by_context(context_text, 3)
                if similar_events:
                    event_str = "\n【与当前情境最相关的历史事件】\n" + "\n".join([f"- {e.description}" for e in similar_events])
            except Exception as e:
                event_str = ''
        # 新增：相关Agent推荐
        agent_str = ''
        if context_text:
            try:
                similar_agents = self.get_similar_agents_by_context(context_text, 3)
                if similar_agents:
                    agent_str = "\n【与你最相似的Agent】\n" + "\n".join([f"- {a.name}" for a in similar_agents if a.id != agent.id])
            except Exception as e:
                agent_str = ''
        # 依然保留最近3条重要记忆
        important_memories = sorted(agent.memories, key=lambda m: (-m.importance, -m.timestamp))[:3]
        mem_str = "最近记忆片段：" + "; ".join([m.content for m in important_memories]) if important_memories else ''
        # 4. 目标动机
        goals = getattr(agent, 'goals', None) or getattr(agent, 'goal', None) or '暂无明确目标'
        # 5. 情感状态
        mood = getattr(agent, 'emotion', None) or getattr(agent, 'mood', '普通')
        emotion_str = f"【情感状态】你当前的情感是：{mood}。\n"
        # 6. 社会关系（与所有可见Agent的关系分数）
        relationships_str = ""
        if hasattr(agent, 'relationships') and agent.relationships:
            rels = []
            for other_id, score in agent.relationships.items():
                rels.append(f"与{other_id}的关系分数：{score}")
            if rels:
                relationships_str = "【社会关系】" + "; ".join(rels) + "\n"
        # 7. 历史多轮对话（与最近互动对象的DIALOGUE记忆）
        dialogue_history = []
        for m in sorted(agent.memories, key=lambda m: -m.timestamp):
            if m.type == 'DIALOGUE' and m.content:
                dialogue_history.append(m.content)
            if len(dialogue_history) >= 5:
                break
        dialogue_history_str = ""
        if dialogue_history:
            dialogue_history_str = "【历史对话】\n" + "\n".join(dialogue_history) + "\n"
        # 8. 当前环境
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
            f"【身份自觉】{identity}\n" +
            relationships_str +
            emotion_str +
            dialogue_history_str +
            f"【社会关系】{rel_str}\n" +
            vector_mem_str +
            event_str +
            agent_str +
            f"\n【记忆回溯】{mem_str}\n" +
            f"【目标动机】{goals}\n" +
            f"【当前环境】\n{env_str}\n" +
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
        context_text = event.description or ''
        vector_memories = []
        if context_text:
            try:
                embedding = self.get_embedding(context_text)
                from backend.services.memory_service import MemoryService
                vector_memories = MemoryService().search_memories_by_embedding(embedding, 5)
            except Exception as e:
                vector_memories = []
        vector_mem_str = ''
        if vector_memories:
            vector_mem_str = "\n【与当前事件最相关的历史记忆】\n" + "\n".join([f"- {m.content}" for m in vector_memories])
        # 新增：相关事件推荐
        event_str = ''
        if context_text:
            try:
                similar_events = self.get_similar_events_by_context(context_text, 3)
                if similar_events:
                    event_str = "\n【与当前事件最相关的历史事件】\n" + "\n".join([f"- {e.description}" for e in similar_events])
            except Exception as e:
                event_str = ''
        # 新增：相关Agent推荐
        agent_str = ''
        if context_text:
            try:
                similar_agents = self.get_similar_agents_by_context(context_text, 3)
                if similar_agents:
                    agent_str = "\n【与你最相似的Agent】\n" + "\n".join([f"- {a.name}" for a in similar_agents if a.id != agent.id])
            except Exception as e:
                agent_str = ''
        memories = agent.memories[-5:]
        mem_str = '\n'.join(f"- {m.content}" for m in memories) or '（无）'
        relationships = ', '.join(f"{k}: 好感度{v.affinity}" for k, v in agent.relationships.items()) or '（无）'
        traits = ', '.join(agent.traits) if getattr(agent, 'traits', None) else ''
        needs = ', '.join(f"{k}:{v}" for k, v in getattr(agent, 'needs', {}).items()) if getattr(agent, 'needs', None) else ''
        attributes = ''
        if getattr(agent, 'attributes', None):
            attrs = agent.attributes.dict() if hasattr(agent.attributes, 'dict') else (agent.attributes if isinstance(agent.attributes, dict) else vars(agent.attributes))
            attributes = ', '.join(f"{k}:{v}" for k, v in attrs.items())
        mood = getattr(agent, 'emotion', None) or getattr(agent, 'mood', '普通')
        role = getattr(agent, 'role', '未知')
        income = getattr(agent, 'income', '未知')
        sensitivity = getattr(agent, 'sensitivity', {})
        from backend.state import events as global_events
        policies = [e for e in global_events if '政策' in e.description or 'policy' in (e.meta or {})]
        policy_str = '\n'.join(f"- {p.description}" for p in policies[-3:]) if policies else '无'
        impact_str = ''
        if hasattr(event, 'impact') and event.impact:
            impact_str = '\n你受到的影响：' + ', '.join(f"{k}:{v}" for k,v in event.impact.items())
        # 关系分数（与事件相关Agent）
        relationships_str = ""
        if hasattr(agent, 'relationships') and agent.relationships:
            rels = []
            if event and event.from_agent and event.from_agent in agent.relationships:
                rels.append(f"与{event.from_agent}的关系分数：{agent.relationships[event.from_agent]}")
            if event and event.to_agent and event.to_agent in agent.relationships:
                rels.append(f"与{event.to_agent}的关系分数：{agent.relationships[event.to_agent]}")
            if rels:
                relationships_str = "【与事件相关Agent的关系】" + "; ".join(rels) + "\n"
        # 历史多轮对话（与事件相关Agent的DIALOGUE记忆）
        dialogue_history = []
        for m in sorted(agent.memories, key=lambda m: -m.timestamp):
            if m.type == 'DIALOGUE' and m.content and (
                (event and event.from_agent and event.from_agent in (m.relatedAgents or [])) or
                (event and event.to_agent and event.to_agent in (m.relatedAgents or []))
            ):
                dialogue_history.append(m.content)
            if len(dialogue_history) >= 5:
                break
        dialogue_history_str = ""
        if dialogue_history:
            dialogue_history_str = "【历史对话】\n" + "\n".join(dialogue_history) + "\n"
        from backend.services.memory_service import MemoryService
        return (
            vector_mem_str +
            event_str +
            agent_str +
            emotion_str +
            relationships_str +
            dialogue_history_str +
            f"\n你是AI小镇的居民（{agent.name}）。\n" +
            f"职业：{role}\n" +
            f"性格特点：{agent.personality or '平和友善'}\n" +
            f"当前心情：{mood}\n" +
            f"特征：{traits}\n" +
            f"当前需求：{needs}\n" +
            f"当前属性：{attributes}\n" +
            f"收入：{income}\n" +
            f"政策敏感度：{sensitivity}\n" +
            f"你的记忆片段如下：\n{mem_str}\n" +
            f"你与其他人的关系：{relationships}\n" +
            f"你当前状态：{agent.state}，{agent.currentAction or ''}\n" +
            f"当前全局政策：\n{policy_str}\n" +
            f"{impact_str}" +
            f"请针对以下事件做出你的反应（只描述你自己的行动、情绪和经济行为，不要生成事件本身）。\n\n事件内容：\n{event.description}\n" +
            f"如果你的反应会引发新的事件或影响其他agent，请在JSON中用 triggeredEvent 字段详细描述（如通知、协作、经济反馈、请求帮助等）。\n请输出你的反应，格式为JSON。"
        )

    def llm_decide(self, agent: Agent, prompt: str, mode: str = 'decision', event: Optional[Event] = None) -> Optional[Memory]:
        from backend.services.memory_service import MemoryService
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
        # 优先解析多步行为链（JSON数组）
        def parse_llm_action_chain(llm_output: str):
            try:
                actions = json.loads(llm_output)
                if isinstance(actions, list):
                    return actions
            except Exception:
                pass
            return None
        actions = parse_llm_action_chain(content)
        if actions:
            for act in actions:
                action_type = act.get('action', '').upper()
                # MOVE
                if action_type == 'MOVE' and 'target_position' in act:
                    x, y = act['target_position']
                    x = max(0, min(800, int(x)))
                    y = max(0, min(600, int(y)))
                    AgentService().update_agent(agent.id, AgentUpdateModel(position={'x': x, 'y': y}))
                # 互动类
                elif action_type in ('SPEAK', 'TALK', 'INTERACT', 'GIFT', 'COOPERATE', 'REQUEST_HELP'):
                    target_name = act.get('target')
                    item = act.get('item') if action_type == 'GIFT' else None
                    message = act.get('message', '')
                    all_agents = self.get_all_agents()
                    to_agent = next((a for a in all_agents if a.name == target_name or a.id == target_name), None)
                    if to_agent:
                        event_type = {
                            'SPEAK': 'DIALOGUE',
                            'TALK': 'DIALOGUE',
                            'INTERACT': 'DIALOGUE',
                            'GIFT': 'GIFT',
                            'COOPERATE': 'COOPERATION',
                            'REQUEST_HELP': 'REQUEST_HELP',
                        }.get(action_type, 'DIALOGUE')
                        event = Event(
                            id=str(int(time.time() * 1000)),
                            type=event_type,
                            description=f"{agent.name}对{to_agent.name}执行{action_type}{'，物品：'+item if item else ''}{'，内容：'+message if message else ''}",
                            affectedAgents=[agent.id, to_agent.id],
                            startTime=int(time.time() * 1000),
                            duration=10000,
                            impact={},
                            meta={"action": action_type, "from": agent.name, "to": to_agent.name, "item": item, "message": message},
                            from_agent=agent.id,
                            to_agent=to_agent.id,
                            content=message or item or action_type
                        )
                        EventService().add_event(event)
            # 行为链已处理，后续单步解析不再执行
        else:
            # 自动解析移动指令并驱动Agent移动
            import re, json
            from backend.services.agent_service import AgentService
            from backend.models import AgentUpdateModel
            def parse_llm_move_action(llm_output: str):
                try:
                    data = json.loads(llm_output)
                    if data.get('action', '').upper() == 'MOVE' and 'target_position' in data:
                        x, y = data['target_position']
                        return int(x), int(y)
                except Exception:
                    pass
                match = re.search(r'ACTION\s*[:：]?\s*MOVE.*?TARGET_POSITION\s*[:：]?\s*\(?\s*(\d+)\s*,\s*(\d+)\s*\)?', llm_output, re.IGNORECASE | re.DOTALL)
                if match:
                    x, y = match.groups()
                    return int(x), int(y)
                return None
            pos = parse_llm_move_action(content)
            if pos:
                x, y = pos
                x = max(0, min(800, x))
                y = max(0, min(600, y))
                AgentService().update_agent(agent.id, AgentUpdateModel(position={'x': x, 'y': y}))
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
        import logging
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
        print(f"[LLM事件生成] 原始返回: {content}")
        # 尝试解析 LLM 返回的 JSON
        try:
            event_obj = json.loads(content)
            print(f"[LLM事件生成] 解析后: {event_obj}")
        except Exception as e:
            print(f"[LLM事件生成] JSON解析失败: {e}, 使用原始文本")
            event_obj = {"description": content}
        # 强制校验 affectedAgents 字段
        affected_agents = event_obj.get('affectedAgents', event_obj.get('affected_agents', []))
        if not isinstance(affected_agents, list) or not all(isinstance(a, str) for a in affected_agents):
            print(f"[LLM事件生成] affectedAgents 字段类型异常: {affected_agents}")
            affected_agents = []
        from backend.models import Event
        import time as _time
        event = Event(
            id=str(int(_time.time() * 1000)),  # 强制唯一ID，避免主键冲突
            type=event_obj.get('type', 'LLM'),
            description=event_obj.get('description', ''),
            affectedAgents=affected_agents,
            startTime=event_obj.get('startTime', event_obj.get('start_time', int(_time.time() * 1000))),
            duration=event_obj.get('duration', 300000),
            impact=event_obj.get('impact', {}),
            meta=event_obj.get('meta', {}),
            scope=event_obj.get('scope'),
            position=event_obj.get('position'),
            from_agent=event_obj.get('from_agent'),
            to_agent=event_obj.get('to_agent'),
            content=event_obj.get('content')
        )
        print(f"[LLM事件生成] 写入数据库前事件对象: {event}")
        from backend.services.supabase_client import supabase
        try:
            res = supabase.table("events").insert(event.dict(by_alias=True, exclude_none=True)).execute()
            print(f"[LLM事件生成] 数据库写入结果: {res}")
        except Exception as e:
            print(f"[LLM事件生成] 写入数据库失败: {e}")
        return event.dict()

    def get_embedding(self, text: str) -> list:
        """
        调用阿里百炼 DashScope embedding API 生成文本向量，并自动补齐/截断为1536维。
        """
        if not DASHSCOPE_API_KEY:
            raise RuntimeError("DASHSCOPE_API_KEY 未配置")
        client = OpenAI(
            api_key=DASHSCOPE_API_KEY,
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
        )
        resp = client.embeddings.create(input=[text], model="text-embedding-v3")
        emb = resp.data[0].embedding
        # 自动补齐/截断为1536维
        if len(emb) < 1536:
            emb = emb + [0.0] * (1536 - len(emb))
        elif len(emb) > 1536:
            emb = emb[:1536]
        return emb

    def get_similar_events_by_context(self, context_text: str, top_k: int = 5):
        from backend.services.event_service import EventService
        embedding = self.get_embedding(context_text)
        return EventService().search_events_by_embedding(embedding, top_k)

    def get_similar_agents_by_context(self, context_text: str, top_k: int = 5):
        from backend.services.agent_service import AgentService
        embedding = self.get_embedding(context_text)
        return AgentService().search_agents_by_embedding(embedding, top_k) 