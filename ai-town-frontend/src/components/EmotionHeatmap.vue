<template>
  <div class="emotion-heatmap-panel">
    <h3>情感热力图</h3>
    <svg :width="width" :height="height">
      <g>
        <circle v-for="agent in props.agents" :key="agent.id"
          :cx="agent.position?.x || 400" :cy="agent.position?.y || 300" r="32"
          :fill="emotionColor(agent.emotion)" fill-opacity="0.38" />
        <circle v-for="agent in props.agents" :key="'dot-'+agent.id"
          :cx="agent.position?.x || 400" :cy="agent.position?.y || 300" r="12"
          :fill="emotionColor(agent.emotion)" :stroke="'#fff'" stroke-width="2" />
        <text v-for="agent in props.agents" :key="'txt-'+agent.id"
          :x="agent.position?.x || 400" :y="(agent.position?.y || 300)+6"
          text-anchor="middle" font-size="22">{{ emotionEmoji(agent.emotion) }}</text>
      </g>
    </svg>
    <div class="legend">
      <span><span class="legend-dot" style="background:#ffe066"></span>高兴</span>
      <span><span class="legend-dot" style="background:#ff8888"></span>愤怒</span>
      <span><span class="legend-dot" style="background:#a0c4ff"></span>悲伤</span>
      <span><span class="legend-dot" style="background:#e0e0e0"></span>平静</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '../types/agent'
const props = defineProps<{ agents: Agent[] }>()
const width = 800, height = 600
function emotionColor(emo?: string) {
  if (!emo) return '#e0e0e0'
  if (emo.includes('高兴') || emo.includes('愉快') || emo.includes('积极')) return '#ffe066'
  if (emo.includes('愤怒') || emo.includes('生气')) return '#ff8888'
  if (emo.includes('悲伤') || emo.includes('失落')) return '#a0c4ff'
  if (emo.includes('平静') || emo.includes('普通')) return '#e0e0e0'
  return '#e0e0e0'
}
function emotionEmoji(emo?: string) {
  if (!emo) return '😐'
  if (emo.includes('高兴') || emo.includes('愉快') || emo.includes('积极')) return '😊'
  if (emo.includes('愤怒') || emo.includes('生气')) return '😡'
  if (emo.includes('悲伤') || emo.includes('失落')) return '😢'
  if (emo.includes('平静') || emo.includes('普通')) return '😐'
  return '😐'
}
</script>

<style scoped>
.emotion-heatmap-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.10);
  padding: 18px 24px 12px 24px;
  width: 820px;
  min-height: 640px;
  position: relative;
}
.emotion-heatmap-panel h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: bold;
}
.legend {
  margin-top: 12px;
  font-size: 15px;
  color: #888;
  display: flex;
  gap: 18px;
}
.legend-dot {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}
</style> 