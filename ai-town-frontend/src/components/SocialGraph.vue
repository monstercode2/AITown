<template>
  <div class="social-graph-panel">
    <h3>社会关系网络</h3>
    <svg :width="width" :height="height">
      <!-- 关系边 -->
      <g>
        <line v-for="edge in edges" :key="edge.id"
          :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2"
          :stroke="edge.color" :stroke-width="edge.width" :opacity="0.7" />
      </g>
      <!-- Agent节点 -->
      <g>
        <g v-for="node in nodes" :key="node.id" @click="selectAgent(node.id)" style="cursor:pointer;">
          <circle :cx="node.x" :cy="node.y" r="28" :fill="node.color" :stroke="selectedId===node.id?'#ff8800':'#fff'" :stroke-width="selectedId===node.id?4:2" />
          <text :x="node.x" :y="node.y+8" text-anchor="middle" font-size="28">{{ node.emoji }}</text>
          <text :x="node.x" :y="node.y+38" text-anchor="middle" font-size="13" fill="#333">{{ node.name }}</text>
        </g>
      </g>
    </svg>
    <div v-if="selectedAgent" class="agent-graph-detail">
      <h4>{{ selectedAgent.name }} 详情</h4>
      <div>情感：<span>{{ selectedAgent.emotion }}</span></div>
      <div>关系：
        <ul>
          <li v-for="(score, aid) in selectedAgent.relationships" :key="aid">
            {{ agentNameById(aid) }}: <b :style="{color: score>=0.5?'#e67e22':(score<=-0.3?'#888':'#333')}" >{{ score>=0?'+':'' }}{{ score.toFixed(2) }}</b>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Agent } from '../types/agent'
const props = defineProps<{ agents: Agent[] }>()
const width = 600, height = 420
// 环形布局
const nodes = computed(() => {
  const N = props.agents.length
  return props.agents.map((a, i) => {
    const angle = (2 * Math.PI * i) / N
    let color = '#ffe066'
    if (a.emotion?.includes('高兴') || a.emotion?.includes('愉快') || a.emotion?.includes('积极')) color = '#ffe066'
    else if (a.emotion?.includes('愤怒') || a.emotion?.includes('生气')) color = '#ff8888'
    else if (a.emotion?.includes('悲伤') || a.emotion?.includes('失落')) color = '#a0c4ff'
    else if (a.emotion?.includes('平静') || a.emotion?.includes('普通')) color = '#e0e0e0'
    const emoji = a.emotion?.includes('高兴') ? '😊' : a.emotion?.includes('愤怒') ? '😡' : a.emotion?.includes('悲伤') ? '😢' : '😐'
    return {
      id: a.id,
      name: a.name,
      x: width/2 + 180*Math.cos(angle),
      y: height/2 + 140*Math.sin(angle),
      color, emoji
    }
  })
})
const nodeMap = computed(() => Object.fromEntries(nodes.value.map(n => [n.id, n])))
// 关系边
const edges = computed(() => {
  const es: any[] = []
  props.agents.forEach(a => {
    if (!a.relationships) return
    Object.entries(a.relationships).forEach(([to, score]) => {
      if (a.id < to) { // 防止重复
        const n1 = nodeMap.value[a.id], n2 = nodeMap.value[to]
        if (n1 && n2) {
          es.push({
            id: a.id+'-'+to,
            x1: n1.x, y1: n1.y, x2: n2.x, y2: n2.y,
            color: score >= 0.5 ? '#e67e22' : score <= -0.3 ? '#888' : '#bbb',
            width: 2 + Math.abs(score)*4
          })
        }
      }
    })
  })
  return es
})
const selectedId = ref<string|null>(null)
const selectAgent = (id: string) => { selectedId.value = id }
const selectedAgent = computed(() => props.agents.find(a => a.id === selectedId.value) || null)
const agentNameById = (id: string) => {
  const a = props.agents.find(a => a.id === id)
  return a ? a.name : id
}
</script>

<style scoped>
.social-graph-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.10);
  padding: 18px 24px 12px 24px;
  width: 660px;
  min-height: 480px;
  position: relative;
}
.social-graph-panel h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: bold;
}
.agent-graph-detail {
  position: absolute;
  right: 24px;
  top: 24px;
  background: #f8f8f8;
  border-radius: 8px;
  padding: 12px 18px;
  min-width: 180px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
}
.agent-graph-detail h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
}
.agent-graph-detail ul {
  margin: 0; padding: 0 0 0 10px;
}
.agent-graph-detail li {
  list-style: none;
  font-size: 14px;
  margin: 2px 0;
}
</style> 