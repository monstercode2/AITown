// @ts-check
import { test, expect, Page } from '@playwright/test'

test('AI小镇前后端联动：Agent流转与可视化', async ({ page }: { page: Page }) => {
  await page.goto('http://localhost:5173/')
  // 新增Agent
  const addBtn = page.getByRole('button', { name: '新增Agent' })
  await addBtn.click()
  await page.waitForTimeout(800)
  // 检查地图上Agent数量
  const agentEmojis = await page.locator('.agent-emoji').all()
  expect(agentEmojis.length).toBeGreaterThan(0)
  // 点击第一个Agent，弹窗应显示情感
  await agentEmojis[0].click()
  await expect(page.locator('.agent-emotion-block')).toBeVisible()
  await expect(page.locator('.agent-rel-list')).toBeVisible()
  // 打开社会网络图谱
  await page.getByRole('button', { name: '社会网络' }).click()
  await expect(page.locator('.social-graph-panel')).toBeVisible()
  // 节点数量与Agent一致
  const nodes = await page.locator('.social-graph-panel svg circle').count()
  expect(nodes).toBeGreaterThanOrEqual(agentEmojis.length)
  // 关闭社会网络
  await page.locator('.close-btn').last().click()
  // 打开情感热力图
  await page.getByRole('button', { name: '情感热力' }).click()
  await expect(page.locator('.emotion-heatmap-panel')).toBeVisible()
  // 色块数量与Agent一致
  const heatDots = await page.locator('.emotion-heatmap-panel svg circle').count()
  expect(heatDots).toBeGreaterThanOrEqual(agentEmojis.length)
  // 关闭热力图
  await page.locator('.close-btn').last().click()
})

test('AI小镇多轮对话与情感关系变化', async ({ page }: { page: Page }) => {
  await page.goto('http://localhost:5173/')
  // 确保有两个Agent
  const addBtn = page.getByRole('button', { name: '新增Agent' })
  await addBtn.click()
  await addBtn.click()
  await page.waitForTimeout(1000)
  // 触发仿真（假设后端会自动生成对话事件）
  const startBtn = page.getByRole('button', { name: '启动仿真' })
  await startBtn.click()
  await page.waitForTimeout(2000)
  // 检查日志面板出现多轮DIALOGUE气泡
  const dialogueBubbles = await page.locator('.log-list .dialogue-bubble').count()
  expect(dialogueBubbles).toBeGreaterThanOrEqual(2)
  // 检查事件日志有新事件
  const eventItems = await page.locator('.log-list li').count()
  expect(eventItems).toBeGreaterThan(0)
  // 检查第一个Agent详情弹窗，情感和关系有变化
  const agentEmojis = await page.locator('.agent-emoji').all()
  await agentEmojis[0].click()
  await expect(page.locator('.agent-emotion-block')).toBeVisible()
  await expect(page.locator('.agent-rel-list')).toBeVisible()
  // 记录情感和关系文本
  const emotionText = await page.locator('.agent-emotion-label').textContent()
  const relText = await page.locator('.agent-rel-list').textContent()
  // 断言情感和关系有合理内容
  expect(emotionText?.length).toBeGreaterThan(0)
  expect(relText?.length).toBeGreaterThan(0)
}) 