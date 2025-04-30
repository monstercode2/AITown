<template>
  <div class="log-panel">
    <h3>事件/互动日志</h3>
    <div v-if="events.length === 0 && allMemories.length === 0" class="log-empty">暂无事件或记忆</div>
    <ul v-else class="log-list">
      <li v-for="event in filteredEvents" :key="event.id" :class="['log-'+event.type.toLowerCase(), { 'log-emotion': event.emotion, 'log-rel': event.relationships }]">
        <span class="log-time">{{ formatTime(event.createdAt) }}</span>
        <span class="log-type">[{{ event.type }}]</span>
        <span class="log-content">
          <template v-if="event.type && event.type.toUpperCase() === 'DIALOGUE'">
            <span class="dialogue-bubble log-bubble">
              <span class="bubble-author">{{ agentName(event.fromAgent || '') }}</span>
              <span class="bubble-arrow">→</span>
              <span class="bubble-author">{{ agentName(event.toAgent || '') }}</span>
              <span class="bubble-content">{{ event.content || event.description }}</span>
            </span>
          </template>
          <template v-else>
            {{ event.content || event.description }}
          </template>
          <template v-if="event.emotion">
            <span class="log-emotion-emoji">{{ emotionEmoji(event.emotion) }}</span>
            <span class="log-emotion-label">{{ event.emotion }}</span>
          </template>
          <template v-if="event.relationships">
            <span class="log-rel-label">关系变化：</span>
            <span v-for="(v, k) in event.relationships" :key="k" class="log-rel-item">{{ agentName(k) }}: {{ v > 0 ? '+' : '' }}{{ v }}</span>
          </template>
        </span>
        <span v-if="event.fromAgent || event.toAgent" class="log-agent">
          <template v-if="event.fromAgent">{{ agentName(event.fromAgent) }}</template>
          <template v-if="event.fromAgent && event.toAgent">→</template>
          <template v-if="event.toAgent">{{ agentName(event.toAgent) }}</template>
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Event } from '../types/event'
import type { Agent } from '../types/agent'

const props = defineProps<{
  events: Event[]
  agents: Agent[]
}>()

const sortedEvents = computed(() =>
  [...props.events].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
)

const filteredEvents = computed(() =>
  sortedEvents.value.filter(e => {
    // ENVIRONMENTAL事件总是显示
    if (e.type === 'ENVIRONMENTAL') return true
    
    // 没有明确目标的事件也显示
    if (Array.isArray(e.affectedAgents) && e.affectedAgents.length === 0) return true
    
    // 显示DIALOGUE、GIFT、COOPERATION等重要互动
    if (e.type === 'DIALOGUE' || e.type === 'GIFT' || e.type === 'COOPERATION') return true
    
    // 默认只显示有全局影响的事件
    return e.scope === 'GLOBAL' || e.meta?.isGlobalEvent === true;
  })
)

const allMemories = computed(() =>
  props.agents.flatMap(a => a.memories || [])
)

function formatTime(ts?: string | number) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'number' ? ts : Date.parse(ts))
  return d.toLocaleTimeString()
}

function agentName(id: string) {
  const agent = props.agents.find(a => a.id === id)
  return agent ? agent.name : id
}

function emotionEmoji(emo?: string) {
  if (!emo) return ''
  if (emo.includes('高兴') || emo.includes('愉快') || emo.includes('积极')) return '😊'
  if (emo.includes('愤怒') || emo.includes('生气')) return '😡'
  if (emo.includes('悲伤') || emo.includes('失落')) return '😢'
  if (emo.includes('平静') || emo.includes('普通')) return '😐'
  return '😐'
}
</script>

<style scoped>
.log-panel {
  position: absolute;
  right: 16px;
  top: 16px;
  width: 340px;
  max-height: 80vh;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.10);
  padding: 16px 20px 12px 20px;
  overflow-y: auto;
  z-index: 200;
}
.log-panel h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: bold;
}
.log-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.log-list li {
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.log-list li:last-child {
  border-bottom: none;
}
.log-time {
  color: #888;
  font-size: 12px;
  min-width: 60px;
}
.log-type {
  color: #fff;
  background: #888;
  border-radius: 4px;
  padding: 1px 6px;
  font-size: 12px;
}
.log-content {
  flex: 1;
  color: #222;
}
.log-agent {
  color: #0077cc;
  font-size: 13px;
}
.log-dialogue .log-type { background: #ff8800; }
.log-gift .log-type { background: #ff66cc; }
.log-cooperation .log-type { background: #00ccff; }
.log-panel .log-empty {
  color: #aaa;
  text-align: center;
  padding: 24px 0;
}
.dialogue-bubble.log-bubble {
  display: inline-flex;
  align-items: center;
  background: #ffe066;
  border-radius: 12px;
  padding: 2px 10px;
  margin: 0 4px;
  font-size: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.bubble-author {
  font-weight: bold;
  margin: 0 2px;
  color: #888;
}
.bubble-arrow {
  color: #aaa;
  margin: 0 2px;
}
.bubble-content {
  color: #222;
  margin-left: 6px;
}
.log-emotion-emoji {
  font-size: 18px;
  margin-left: 6px;
}
.log-emotion-label {
  background: #ffe066;
  color: #333;
  border-radius: 6px;
  padding: 1px 6px;
  margin-left: 2px;
  font-size: 13px;
}
.log-rel-label {
  color: #888;
  font-size: 12px;
  margin-left: 6px;
}
.log-rel-item {
  color: #e67e22;
  font-size: 13px;
  margin-left: 2px;
}
.mem-important {
  background: #fffbe6 !important;
}
</style> 