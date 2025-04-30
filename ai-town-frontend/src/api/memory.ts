export async function searchMemoriesByVector(embedding: number[], top_k: number = 5) {
  const res = await fetch('/api/memory/search_by_vector', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embedding, top_k })
  })
  if (!res.ok) throw new Error('向量记忆检索失败')
  const data = await res.json()
  return Array.isArray(data.data) ? data.data : []
} 