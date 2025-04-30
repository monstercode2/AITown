<template>
  <div>
    <div style="margin-bottom: 10px;">
      <button @click="handleAddAgent">新增Agent</button>
      <button @click="handleDeleteAgent">删除最后一个Agent</button>
      <button @click="handleMoveAgent">随机移动第一个Agent</button>
      <button @click="startSim">启动仿真</button>
      <button @click="pauseSim">暂停仿真</button>
      <button @click="resetSim">重置仿真</button>
      <button style="float:right;" @click="showSocialGraph = true">社会网络</button>
      <button style="float:right;margin-right:8px;" @click="showHeatmap = true">情感热力</button>
    </div>
    <div ref="pixiContainer" style="width: 800px; height: 600px;"></div>
    <LogPanel :events="eventsState" :agents="agentsState" />
    <div v-if="showDetail && detailAgent" class="agent-detail-modal" @click="showDetail = false">
      <div class="agent-detail-content" @click.stop>
        <h3>{{ detailAgent.name }}</h3>
        <div class="agent-emoji">{{ detailAgent.avatar || AGENT_EMOJI }}</div>
        <div>ID: {{ detailAgent.id }}</div>
        <div>位置: x={{ detailAgent.position?.x ?? '-' }}, y={{ detailAgent.position?.y ?? '-' }}</div>
        <div v-if="detailAgent.state">状态: {{ detailAgent.state }}</div>
        <div v-if="detailAgent.personality">性格: {{ detailAgent.personality }}</div>
        <div v-if="detailAgent.current_action">当前行为: {{ detailAgent.current_action }}</div>
        <div v-if="detailAgent.emotion" class="agent-emotion-block">
          <span class="agent-emotion-emoji">{{ emotionEmoji(detailAgent.emotion) }}</span>
          <span class="agent-emotion-label" :style="{ background: emotionColor(detailAgent.emotion) }">{{ detailAgent.emotion }}</span>
        </div>
        <div v-if="detailAgent.relationships && Object.keys(detailAgent.relationships).length" class="agent-rel-list">
          <b>与其他Agent的关系：</b>
          <ul>
            <li v-for="(score, aid) in detailAgent.relationships" :key="aid" :class="{ 'rel-strong': score >= 0.5, 'rel-weak': score <= -0.3 }">
              <span class="rel-agent-name">{{ agentNameById(aid) }}</span>
              <span class="rel-score">{{ score >= 0 ? '+' : '' }}{{ score.toFixed(2) }}</span>
            </li>
          </ul>
        </div>
        <div v-if="detailAgent.memories && detailAgent.memories.length" class="agent-memories">
          <b>记忆：</b>
          <div class="memory-list">
            <div v-for="memory in memoriesToShow" :key="memory.id" :class="['memory-item', `memory-${memory.type?.toLowerCase() || 'other'}`, {'memory-important': memory.importance !== undefined && memory.importance >= 4}]">
              <span class="memory-type">[{{ memory.type || '记忆' }}]</span>
              <span class="memory-content">{{ memory.content }}</span>
              <span v-if="memory.importance !== undefined" class="memory-importance">[{{ memory.importance }}]</span>
              <span class="memory-time">{{ formatTime(memory.timestamp) }}</span>
            </div>
          </div>
        </div>
        <button @click="showDetail = false">关闭</button>
      </div>
    </div>
    <div v-if="showSocialGraph" class="social-graph-modal" @click.self="showSocialGraph = false">
      <div class="social-graph-modal-content">
        <SocialGraph :agents="agentsState" />
        <button class="close-btn" @click="showSocialGraph = false">关闭</button>
      </div>
    </div>
    <div v-if="showHeatmap" class="social-graph-modal" @click.self="showHeatmap = false">
      <div class="social-graph-modal-content">
        <EmotionHeatmap :agents="agentsState" />
        <button class="close-btn" @click="showHeatmap = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, shallowRef, nextTick, computed } from 'vue'
import * as PIXI from 'pixi.js'
import { GlowFilter } from '@pixi/filter-glow'
import { fetchAgents, addAgent, deleteAgent, updateAgent } from '../api/agent'
import { fetchEvents } from '../api/event'
import type { Agent } from '../types/agent'
import type { Event } from '../types/event'
import LogPanel from './LogPanel.vue'
import SocialGraph from './SocialGraph.vue'
import EmotionHeatmap from './EmotionHeatmap.vue'

const pixiContainer = ref<HTMLDivElement | null>(null)
let app: PIXI.Application | null = null
let mapBgSprite: PIXI.Sprite | null = null
let staticLayer: PIXI.Container | null = null
let staticRenderSprite: PIXI.Sprite | null = null
let agentLayer: PIXI.Container | null = null
let agentSpriteMap: Record<string, PIXI.Container> = {}
// let agentSpritePool: PIXI.Sprite[] = []
let agentBubbleMap: Record<string, PIXI.Text> = {}
let agentEventBubbleMap: Record<string, PIXI.Text> = {}
let agentGiftIconMap: Record<string, PIXI.Sprite> = {}
let eventLineGraphics: PIXI.Graphics[] = []
let timer: number | null = null
let animationFrame: number | null = null
const agentsState = ref<Agent[]>([])
const eventsState = ref<Event[]>([])

// const PLACEHOLDER_IMG = 'https://placekitten.com/80/80'
const AGENT_EMOJI = '🧑‍💼'
const GIFT_IMG = 'https://cdn-icons-png.flaticon.com/512/616/616489.png' // 礼物icon
const MAP_BG = '/map_bg.png' // 地图背景
const MOVE_SPEED = 0.1

const showDetail = ref(false)
const detailAgent = shallowRef<Agent | null>(null)
const showSocialGraph = ref(false)
const showHeatmap = ref(false)

// 地图缩放与拖拽参数
let isDragging = false
let lastPointer = { x: 0, y: 0 }
let stageScale = 1
const MIN_SCALE = 0.5
const MAX_SCALE = 2.2

// 优化：所有Agent Sprite放到单独的Container
function ensureAgentLayer() {
  if (!app) return
  if (!agentLayer) {
    agentLayer = new PIXI.Container()
    app.stage.addChildAt(agentLayer, 2)
  }
}

// 获取或新建Sprite（对象池）
function getAgentSprite(agent?: Agent): PIXI.Container {
  // 根据情感动态选择emoji和色彩
  let emoji = AGENT_EMOJI
  let glowColor = 0xcccccc
  if (agent && agent.emotion) {
    if (agent.emotion.includes('高兴') || agent.emotion.includes('愉快') || agent.emotion.includes('积极')) {
      emoji = '😊'
      glowColor = 0xffe066
    } else if (agent.emotion.includes('愤怒') || agent.emotion.includes('生气')) {
      emoji = '😡'
      glowColor = 0xff4444
    } else if (agent.emotion.includes('悲伤') || agent.emotion.includes('失落')) {
      emoji = '😢'
      glowColor = 0x66aaff
    } else if (agent.emotion.includes('平静') || agent.emotion.includes('普通')) {
      emoji = '😐'
      glowColor = 0xbbbbbb
    }
  }
  const text = new PIXI.Text(emoji, { fontSize: 48 })
  text.anchor.set(0.5)
  const container = new PIXI.Container()
  container.addChild(text)
  // 发光边框
  container.filters = [new GlowFilter({ color: glowColor, distance: 12 }) as unknown as PIXI.Filter]
  return container
}
// 回收Sprite到池
// function recycleAgentSprite(sprite: PIXI.Sprite) {
//   sprite.removeAllListeners()
//   sprite.visible = false
//   agentSpritePool.push(sprite)
// }

function setupZoomAndDrag() {
  if (!app || !pixiContainer.value) return
  // 滚轮缩放
  pixiContainer.value.addEventListener('wheel', (e) => {
    e.preventDefault()
    const oldScale = stageScale
    if (e.deltaY < 0) {
      stageScale = Math.min(MAX_SCALE, stageScale + 0.1)
    } else {
      stageScale = Math.max(MIN_SCALE, stageScale - 0.1)
    }
    // 缩放中心为鼠标位置
    const rect = pixiContainer.value!.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const worldX = (mouseX - app!.stage.x) / oldScale
    const worldY = (mouseY - app!.stage.y) / oldScale
    app!.stage.scale.set(stageScale)
    app!.stage.x = mouseX - worldX * stageScale
    app!.stage.y = mouseY - worldY * stageScale
  }, { passive: false })
  // 拖拽平移
  pixiContainer.value.addEventListener('mousedown', (e) => {
    isDragging = true
    lastPointer.x = e.clientX
    lastPointer.y = e.clientY
  })
  window.addEventListener('mousemove', (e) => {
    if (!isDragging || !app) return
    const dx = e.clientX - lastPointer.x
    const dy = e.clientY - lastPointer.y
    app!.stage.x += dx
    app!.stage.y += dy
    lastPointer.x = e.clientX
    lastPointer.y = e.clientY
  })
  window.addEventListener('mouseup', () => {
    isDragging = false
  })
}

// Draw Call优化：静态元素合并到一个Graphics并渲染到RenderTexture
function drawStaticElementsOptimized() {
  if (!app) return
  if (staticLayer) {
    app.stage.removeChild(staticLayer)
  }
  if (staticRenderSprite) {
    app.stage.removeChild(staticRenderSprite)
  }
  staticLayer = new PIXI.Container()
  // 合并所有静态元素到一个Graphics
  const g = new PIXI.Graphics()
  // 道路
  g.beginFill(0xaaaaaa)
  g.drawRect(100, 250, 600, 60)
  g.endFill()
  // 房屋
  for (let i = 0; i < 3; i++) {
    const x = 180 + i * 180
    const y = 120
    g.beginFill(0xffe4b5)
    g.drawRect(x, y, 60, 50)
    g.endFill()
    g.beginFill(0xcc3333)
    g.moveTo(x - 5, y)
    g.lineTo(x + 30, y - 30)
    g.lineTo(x + 65, y)
    g.lineTo(x - 5, y)
    g.endFill()
  }
  // 树
  for (let i = 0; i < 4; i++) {
    const x = 120 + i * 180
    const y = 400
    g.beginFill(0x8b5a2b)
    g.drawRect(x + 12, y + 30, 16, 30)
    g.endFill()
    g.beginFill(0x228b22)
    g.drawCircle(x + 20, y + 30, 28)
    g.endFill()
  }
  staticLayer.addChild(g)
  // 渲染到RenderTexture
  const rt = PIXI.RenderTexture.create({ width: 800, height: 600 })
  app.renderer.render(staticLayer, { renderTexture: rt })
  staticRenderSprite = new PIXI.Sprite(rt)
  staticRenderSprite.x = 0
  staticRenderSprite.y = 0
  app.stage.addChildAt(staticRenderSprite, 1)
}

// 平滑移动动画主循环
function animateAgents() {
  if (!app) return
  // 清除旧连线
  eventLineGraphics.forEach(g => app!.stage.removeChild(g))
  eventLineGraphics = []
  agentsState.value.forEach((agent, idx) => {
    const sprite = agentSpriteMap[agent.id]
    if (sprite) {
      const targetX = agent.position?.x ?? (150 + idx * 200)
      const targetY = agent.position?.y ?? (200 + idx * 100)
      sprite.x += (targetX - sprite.x) * MOVE_SPEED
      sprite.y += (targetY - sprite.y) * MOVE_SPEED
      // 动作/状态动画
      // 1. 说话时显示气泡
      if (agent.current_action === 'speak') {
        if (!agentBubbleMap[agent.id]) {
          const bubble = new PIXI.Text('💬', { fontSize: 28, fill: 0x333333 })
          bubble.anchor.set(0.5)
          bubble.x = 0
          bubble.y = -45
          sprite.addChild(bubble)
          agentBubbleMap[agent.id] = bubble
        }
      } else {
        if (agentBubbleMap[agent.id]) {
          sprite.removeChild(agentBubbleMap[agent.id])
          delete agentBubbleMap[agent.id]
        }
      }
      // 2. 行走时左右翻转
      if (agent.current_action === 'walk') {
        sprite.scale.x = -1
      } else {
        sprite.scale.x = 1
      }
      // 4. 事件气泡（如DIALOGUE、GIFT等）
      const event = eventsState.value.find(e => e.type && (e.type.toUpperCase() === 'DIALOGUE' || e.type.toUpperCase() === 'GIFT' || e.type.toUpperCase() === 'COOPERATION') && (e.toAgent === agent.id || e.affectedAgents?.includes(agent.id)))
      if (event) {
        let text = ''
        let style: any = { fontSize: 18, fill: 0x0055aa, wordWrap: true, wordWrapWidth: 120 }
        if (event.type.toUpperCase() === 'DIALOGUE') {
          text = event.content || event.description || '对话'
          style = { ...style, fill: 0xffffff, fontWeight: 'bold', background: '#ff8800' }
        }
        if (event.type.toUpperCase() === 'GIFT') text = `🎁${event.content || event.description || '收到礼物'}`
        if (event.type.toUpperCase() === 'COOPERATION') text = `🤝${event.content || event.description || '协作'}`
        if (!agentEventBubbleMap[agent.id]) {
          const bubble = new PIXI.Text(text, style)
          bubble.anchor.set(0.5)
          bubble.x = 0
          bubble.y = -70
          sprite.addChild(bubble)
          agentEventBubbleMap[agent.id] = bubble
        } else {
          agentEventBubbleMap[agent.id].text = text
        }
        // DIALOGUE事件高亮背景
        if (event.type.toUpperCase() === 'DIALOGUE') {
          agentEventBubbleMap[agent.id].style = new PIXI.TextStyle({ fontSize: 18, fill: 0xffffff, fontWeight: 'bold', wordWrap: true, wordWrapWidth: 120, dropShadow: true })
        }
      } else {
        if (agentEventBubbleMap[agent.id]) {
          sprite.removeChild(agentEventBubbleMap[agent.id])
          delete agentEventBubbleMap[agent.id]
        }
      }
      // 5. GIFT事件显示礼物icon动画
      const giftEvent = eventsState.value.find(e => e.type && e.type.toUpperCase() === 'GIFT' && (e.toAgent === agent.id || e.affectedAgents?.includes(agent.id)))
      if (giftEvent) {
        if (!agentGiftIconMap[agent.id]) {
          const giftSprite = PIXI.Sprite.from(GIFT_IMG)
          giftSprite.width = 32
          giftSprite.height = 32
          giftSprite.anchor.set(0.5)
          giftSprite.x = 0
          giftSprite.y = -100
          sprite.addChild(giftSprite)
          agentGiftIconMap[agent.id] = giftSprite
        }
        // 简单上下浮动动画
        agentGiftIconMap[agent.id].y = -100 + Math.sin(Date.now() / 300) * 8
      } else {
        if (agentGiftIconMap[agent.id]) {
          sprite.removeChild(agentGiftIconMap[agent.id])
          delete agentGiftIconMap[agent.id]
        }
      }
    }
  })
  // 事件连线（GIFT/COOPERATION）
  eventsState.value.forEach(event => {
    if ((event.type && (event.type.toUpperCase() === 'GIFT' || event.type.toUpperCase() === 'COOPERATION')) && event.fromAgent && event.toAgent) {
      const fromSprite = agentSpriteMap[event.fromAgent]
      const toSprite = agentSpriteMap[event.toAgent]
      if (fromSprite && toSprite) {
        const g = new PIXI.Graphics()
        g.lineStyle(3, event.type.toUpperCase() === 'GIFT' ? 0xff66cc : 0x00ccff, 0.8)
        g.moveTo(fromSprite.x, fromSprite.y)
        g.lineTo(toSprite.x, toSprite.y)
        app!.stage.addChild(g)
        eventLineGraphics.push(g)
      }
    }
  })
  animationFrame = requestAnimationFrame(animateAgents)
}

// 拉取agent和event数据并渲染（只在数量/顺序变化时重建Sprite）
async function updateAgentsAndEvents() {
  console.log('更新Agent和事件列表...')
  try {
    const agents = await fetchAgents()
    const events = await fetchEvents()
    if (agents) {
      // 若检测到所有agent集中在左上角，重新分布
      if (agents.length > 1 && agents.every(a => (a.position?.x || 0) < 100 && (a.position?.y || 0) < 100)) {
        console.log('检测到所有Agent位置集中，自动重新分布')
        agents.forEach((agent, i) => {
          agent.position = {
            x: 200 + Math.floor(Math.random() * 400),
            y: 200 + Math.floor(Math.random() * 200)
          }
        })
      }
      // 为每个agent加载记忆数据
      for (const agent of agents) {
        if (!agent.memories || agent.memories.length === 0) {
          try {
            console.log(`尝试为Agent ${agent.id} 加载记忆数据`)
            const response = await fetch(`/api/memory?agent_id=${agent.id}&limit=20`)
            if (response.ok) {
              const json = await response.json()
              // 处理不同响应格式
              let memories = []
              if (json && typeof json === 'object') {
                if (Array.isArray(json.data)) {
                  memories = json.data
                } else if (Array.isArray(json)) {
                  memories = json
                } else if (json.memories && Array.isArray(json.memories)) {
                  memories = json.memories
                }
              }
              if (memories.length > 0) {
                agent.memories = memories
                console.log(`为Agent ${agent.id} 加载了 ${memories.length} 条记忆`)
              }
            }
          } catch (err) {
            console.error(`加载Agent ${agent.id} 记忆失败:`, err)
          }
        }
      }
      agentsState.value = agents
    }
    if (events) {
      eventsState.value = events
    }
    if (app) {
      updateAgentSprites()
      updateEventLines()
    }
  } catch (err) {
    console.error('更新Agent或事件失败:', err)
  }
}

// 更新Agent精灵
function updateAgentSprites() {
  if (!app) return
  ensureAgentLayer()
  
  // 判断是否需要重建Sprite
  const oldIds = Object.keys(agentSpriteMap)
  const newIds = agentsState.value.map(a => a.id)
  const needRebuild = oldIds.length !== newIds.length || oldIds.some((id, i) => !newIds.includes(id))
  
  if (needRebuild && agentLayer) {
    // 清理旧精灵
    for (const id of oldIds) {
      if (!newIds.includes(id) && agentSpriteMap[id]) {
        agentLayer.removeChild(agentSpriteMap[id])
        delete agentSpriteMap[id]
      }
    }
    
    // 创建新精灵
    for (let idx = 0; idx < agentsState.value.length; idx++) {
      const agent = agentsState.value[idx]
      if (!agentSpriteMap[agent.id]) {
        const sprite = getAgentSprite(agent)
        sprite.x = agent.position?.x ?? (150 + idx * 200)
        sprite.y = agent.position?.y ?? (200 + idx * 100)
        sprite.visible = true
        sprite.eventMode = 'static'
        sprite.cursor = 'pointer'
        // 悬浮高亮
        sprite.on('pointerover', () => {
          sprite.scale.set(1.15, 1.15)
          sprite.filters = [new GlowFilter({ color: 0xffff00, distance: 16 }) as unknown as PIXI.Filter]
        })
        sprite.on('pointerout', () => {
          // 恢复情感色彩发光
          let glowColor = 0xcccccc
          if (agent.emotion) {
            if (agent.emotion.includes('高兴') || agent.emotion.includes('愉快') || agent.emotion.includes('积极')) {
              glowColor = 0xffe066
            } else if (agent.emotion.includes('愤怒') || agent.emotion.includes('生气')) {
              glowColor = 0xff4444
            } else if (agent.emotion.includes('悲伤') || agent.emotion.includes('失落')) {
              glowColor = 0x66aaff
            } else if (agent.emotion.includes('平静') || agent.emotion.includes('普通')) {
              glowColor = 0xbbbbbb
            }
          }
          sprite.scale.set(1, 1)
          sprite.filters = [new GlowFilter({ color: glowColor, distance: 12 }) as unknown as PIXI.Filter]
        })
        // 点击弹窗
        sprite.on('pointertap', async () => {
          detailAgent.value = agent
          showDetail.value = true
          
          // 如果没有记忆，尝试加载该agent的记忆
          if (!agent.memories || agent.memories.length === 0) {
            console.log('尝试加载agent记忆:', agent.id)
            try {
              const res = await fetch(`/api/memory?agent_id=${agent.id}&limit=20`)
              if (!res.ok) {
                throw new Error(`HTTP Error ${res.status}`)
              }
              const json = await res.json()
              console.log('加载到agent记忆原始数据:', json)
              
              // 处理不同响应格式
              let memories = []
              if (json && typeof json === 'object') {
                if (Array.isArray(json.data)) {
                  memories = json.data
                  console.log(`从ResponseModel.data获取到${memories.length}条记忆`)
                } else if (Array.isArray(json)) {
                  memories = json
                  console.log(`直接从响应获取到${memories.length}条记忆`)
                } else if (json.memories && Array.isArray(json.memories)) {
                  memories = json.memories
                  console.log(`从json.memories获取到${memories.length}条记忆`)
                }
              }
              
              // 如果没有记忆数据，创建一条测试记忆
              if (memories.length === 0) {
                console.warn(`Agent ${agent.id} 没有记忆数据，创建测试记忆`)
                memories = [{
                  id: `test-memory-${Date.now()}`,
                  agent_id: agent.id,
                  content: '这是一条测试记忆 - 前端自动生成',
                  timestamp: Date.now(),
                  importance: 2,
                  type: 'EVENT',
                  relatedAgents: []
                }]
              }
              
              // 更新当前选中的agent的记忆，并同步到agents数组中对应的agent
              if (detailAgent.value && detailAgent.value.id === agent.id) {
                console.log(`更新detailAgent.value.memories，共${memories.length}条记忆`)
                detailAgent.value.memories = memories;
              }
              
              // 同步更新agentsState中的对应agent
              const agentIndex = agentsState.value.findIndex(a => a.id === agent.id);
              if (agentIndex >= 0) {
                console.log(`更新agentsState.value[${agentIndex}].memories，共${memories.length}条记忆`)
                agentsState.value[agentIndex].memories = memories;
              }
            } catch (err) {
              console.error('加载agent记忆失败:', err);
              // 错误时创建一条测试记忆
              const testMemory = {
                id: `error-memory-${Date.now()}`,
                agent_id: agent.id,
                content: '加载记忆失败 - 前端自动生成的错误提示',
                timestamp: Date.now(),
                importance: 1,
                type: 'ERROR',
                relatedAgents: []
              };
              
              if (detailAgent.value && detailAgent.value.id === agent.id) {
                detailAgent.value.memories = [testMemory];
              }
              
              const agentIndex = agentsState.value.findIndex(a => a.id === agent.id);
              if (agentIndex >= 0) {
                agentsState.value[agentIndex].memories = [testMemory];
              }
            }
          } else {
            console.log(`Agent ${agent.id} 已有${agent.memories.length}条记忆，无需加载`)
          }
        })
        agentLayer.addChild(sprite)
        agentSpriteMap[agent.id] = sprite
      }
    }
  }
}

// 更新事件连线
function updateEventLines() {
  if (!app) return
  // 清除旧连线
  eventLineGraphics.forEach(g => {
    if (app) app.stage.removeChild(g)
  })
  eventLineGraphics = []
  // 绘制新连线
  eventsState.value.forEach(event => {
    if ((event.type && (event.type.toUpperCase() === 'GIFT' || event.type.toUpperCase() === 'COOPERATION')) && event.fromAgent && event.toAgent) {
      const fromSprite = agentSpriteMap[event.fromAgent]
      const toSprite = agentSpriteMap[event.toAgent]
      if (fromSprite && toSprite && app) {
        const g = new PIXI.Graphics()
        g.lineStyle(3, event.type.toUpperCase() === 'GIFT' ? 0xff66cc : 0x00ccff, 0.8)
        g.moveTo(fromSprite.x, fromSprite.y)
        g.lineTo(toSprite.x, toSprite.y)
        app.stage.addChild(g)
        eventLineGraphics.push(g)
      }
    }
  })
}

async function handleAddAgent() {
  const idx = agentsState.value.length
  await addAgent({
    name: `新Agent${idx + 1}`,
    position: { x: 100 + Math.random() * 600, y: 100 + Math.random() * 400 },
    avatar: AGENT_EMOJI,
  })
  await updateAgentsAndEvents()
}

async function handleDeleteAgent() {
  const last = agentsState.value[agentsState.value.length - 1]
  if (last) {
    await deleteAgent(last.id)
    await updateAgentsAndEvents()
  }
}

async function handleMoveAgent() {
  const first = agentsState.value[0]
  if (first) {
    await updateAgent(first.id, {
      position: {
        x: Math.floor(100 + Math.random() * 600),
        y: Math.floor(100 + Math.random() * 400)
      }
    })
    await updateAgentsAndEvents()
  }
}

// 仿真控制API
async function startSim() {
  await fetch('/api/simulation?action=start', { method: 'POST' })
}
async function pauseSim() {
  await fetch('/api/simulation?action=pause', { method: 'POST' })
}
async function resetSim() {
  await fetch('/api/simulation?action=reset', { method: 'POST' })
}

onMounted(async () => {
  await nextTick();
  // 防止重复初始化
  if (app) {
    app.destroy(true, true);
    app = null;
  }
  // 清空容器，防止重复挂载canvas
  if (pixiContainer.value) {
    pixiContainer.value.innerHTML = '';
  }
  // 初始化
  app = new PIXI.Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
  });
  // 兜底保护
  if (!app.view) {
    console.warn('PIXI.Application.view is undefined, aborting mount.');
    return;
  }
  if (pixiContainer.value) {
    pixiContainer.value.appendChild(app.view as HTMLCanvasElement);
  }
  // 加载地图背景
  mapBgSprite = PIXI.Sprite.from(MAP_BG);
  mapBgSprite.width = 800;
  mapBgSprite.height = 600;
  mapBgSprite.anchor.set(0);
  app.stage.addChildAt(mapBgSprite, 0);
  drawStaticElementsOptimized();
  ensureAgentLayer();
  updateAgentsAndEvents();
  timer = window.setInterval(updateAgentsAndEvents, 3000);
  animateAgents();
  setupZoomAndDrag();
});

onBeforeUnmount(() => {
  if (app) {
    app.destroy(true, true)
    app = null
  }
  if (pixiContainer.value) {
    pixiContainer.value.innerHTML = ''
  }
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
})

// 详情弹窗相关辅助
const emotionEmoji = (emo: string) => {
  if (!emo) return '😐'
  if (emo.includes('高兴') || emo.includes('愉快') || emo.includes('积极')) return '😊'
  if (emo.includes('愤怒') || emo.includes('生气')) return '😡'
  if (emo.includes('悲伤') || emo.includes('失落')) return '😢'
  if (emo.includes('平静') || emo.includes('普通')) return '😐'
  return '😐'
}
const emotionColor = (emo: string) => {
  if (!emo) return '#eee'
  if (emo.includes('高兴') || emo.includes('愉快') || emo.includes('积极')) return '#ffe066'
  if (emo.includes('愤怒') || emo.includes('生气')) return '#ff8888'
  if (emo.includes('悲伤') || emo.includes('失落')) return '#a0c4ff'
  if (emo.includes('平静') || emo.includes('普通')) return '#e0e0e0'
  return '#eee'
}
const agentNameById = (id: string) => {
  const a = agentsState.value.find(a => a.id === id)
  return a ? a.name : id
}
// 多轮对话历史（与最近互动对象）
const dialogueHistory = computed(() => {
  if (!detailAgent.value || !detailAgent.value.memories) return []
  // 找到最近一条DIALOGUE记忆的relatedAgents
  const lastDialogue = [...detailAgent.value.memories].reverse().find(m => m.type === 'DIALOGUE' && m.relatedAgents && m.relatedAgents.length)
  if (!lastDialogue) return []
  const partnerId = lastDialogue.relatedAgents?.[0] ?? ''
  // 取与该对象相关的所有DIALOGUE记忆，按时间排序
  const history = detailAgent.value.memories.filter(m => m.type === 'DIALOGUE' && m.relatedAgents && m.relatedAgents.includes(partnerId))
    .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    .map(m => ({
      content: m.content,
      isSelf: m.agent_id === detailAgent.value!.id
    }))
  return history
})
const dialoguePartnerName = computed(() => {
  if (!detailAgent.value || !detailAgent.value.memories) return ''
  const lastDialogue = [...detailAgent.value.memories].reverse().find(m => m.type === 'DIALOGUE' && m.relatedAgents && m.relatedAgents.length)
  if (!lastDialogue) return ''
  return agentNameById(lastDialogue.relatedAgents?.[0] ?? '')
})
const memoriesToShow = computed(() => {
  if (!detailAgent.value || !detailAgent.value.memories) return []
  return [...detailAgent.value.memories]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 10)
})

function formatTime(ts: number | undefined) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString()
}
</script>

<style scoped>
.agent-detail-modal {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.agent-detail-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px 32px;
  min-width: 260px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  position: relative;
}
.agent-detail-content button {
  margin-top: 16px;
}
.agent-emoji {
  font-size: 64px;
  text-align: center;
  margin: 12px 0;
}
.agent-emotion-block {
  display: flex;
  align-items: center;
  margin: 10px 0 8px 0;
}
.agent-emotion-emoji {
  font-size: 32px;
  margin-right: 8px;
}
.agent-emotion-label {
  padding: 2px 10px;
  border-radius: 8px;
  color: #333;
  font-weight: bold;
  margin-right: 8px;
}
.agent-rel-list {
  margin: 10px 0 8px 0;
}
.agent-rel-list ul {
  margin: 0; padding: 0 0 0 10px;
}
.agent-rel-list li {
  list-style: none;
  margin: 2px 0;
  font-size: 15px;
  display: flex;
  align-items: center;
}
.rel-agent-name {
  min-width: 60px;
  font-weight: bold;
}
.rel-score {
  margin-left: 8px;
  font-family: monospace;
}
.rel-strong .rel-score { color: #e67e22; font-weight: bold; }
.rel-weak .rel-score { color: #888; text-decoration: line-through; }
.agent-dialogue-history {
  margin: 12px 0 8px 0;
}
.dialogue-bubbles {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.dialogue-bubble {
  display: flex;
  align-items: center;
  border-radius: 12px;
  padding: 6px 14px;
  max-width: 90%;
  font-size: 15px;
  background: #f5f5f5;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.bubble-self {
  align-self: flex-end;
  background: #ffe066;
}
.bubble-other {
  align-self: flex-start;
  background: #e0e0e0;
}
.bubble-author {
  font-weight: bold;
  margin-right: 6px;
  color: #888;
}
.bubble-content {
  color: #222;
}
.social-graph-modal {
  position: fixed;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}
.social-graph-modal-content {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.13);
  padding: 18px 18px 8px 18px;
  position: relative;
}
.close-btn {
  position: absolute;
  right: 18px;
  top: 12px;
  background: #eee;
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 15px;
  cursor: pointer;
}
.agent-memories {
  margin: 12px 0;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
}
.memory-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.memory-item {
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 6px;
  background: #f5f5f5;
}
.memory-type {
  font-weight: bold;
  color: #666;
  margin-right: 6px;
}
.memory-content {
  color: #333;
}
.memory-importance {
  color: #e67e22;
  margin-left: 6px;
}
.memory-time {
  color: #999;
  font-size: 12px;
  margin-left: 6px;
}
.memory-dialogue {
  background: #fff3cd;
}
.memory-llm_response {
  background: #d1ecf1;
}
.memory-event {
  background: #f8f9fa;
}
.memory-important {
  border-left: 3px solid #e67e22;
}
</style> 