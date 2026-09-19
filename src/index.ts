import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import { AuthController } from './controllers/auth-controller'
import { authMiddleware, optionalAuth } from './auth/middleware'
import { errorHandler, requestLogger } from './middleware/error-handler'

const app = new Hono()

app.use('*', cors({
  origin: ['http://localhost:5173', 'https://draw.ajikkk.my.id', 'https://sketch-board.ajhmdni02.workers.dev'],
  credentials: true,
}))
app.use('*', errorHandler)
app.use('*', requestLogger)

// Auth routes
app.get('/api/auth/login', (c) => {
  const authController = new AuthController(c.env as Env)
  return authController.login(c)
})

app.get('/api/auth/callback', async (c) => {
  const authController = new AuthController(c.env as Env)
  return authController.callback(c)
})

app.get('/api/auth/me', authMiddleware, (c) => {
  const authController = new AuthController(c.env as Env)
  return authController.me(c)
})

// Scenes routes - direct KV (repository has Cloudflare bundling issues)
function generateKey(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `${timestamp}-${random}`
}

function storageKey(apiKey: string): string {
  return apiKey.startsWith('scenes/') ? apiKey : `scenes/${apiKey}.json`
}

function serializeScene(data: Record<string, unknown>, userId?: string): string {
  return JSON.stringify({ ...data, ...(userId ? { userId } : {}) })
}

app.get('/api/scenes', optionalAuth(), async (c) => {
  const env = c.env as Env
  const user = c.get('user')
  const userId = user?.sub
  const list = await env.SCENES.list({ prefix: 'scenes/' })
  const scenes: Record<string, unknown>[] = []
  for (const { name } of list.keys) {
    const data = await env.SCENES.get(name, 'json')
    if (!data) continue
    const record = data as Record<string, unknown>
    const sceneUserId = record.userId as string | undefined
    if (userId && sceneUserId && sceneUserId !== userId) continue
    scenes.push({
      key: name,
      type: record.type ?? 'sketch-board',
      name: record.name ?? 'Untitled',
      elements: Array.isArray(record.elements) ? record.elements : [],
      appState: typeof record.appState === 'object' ? record.appState : {},
      savedAt: record.savedAt ?? new Date().toISOString(),
      userId: sceneUserId ?? null,
    })
  }
  scenes.sort((a: any, b: any) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
  return c.json(scenes)
})

app.post('/api/scenes', optionalAuth(), async (c) => {
  const env = c.env as Env
  const user = c.get('user')
  const body = await c.req.json<{ type?: string; name?: string; elements?: unknown[]; appState?: Record<string, unknown> }>()
  if (!body.name || typeof body.name !== 'string') {
    return c.json({ error: 'Scene name is required' }, 400)
  }
  const apiKey = generateKey()
  const data = {
    type: body.type ?? 'sketch-board',
    name: body.name,
    elements: Array.isArray(body.elements) ? body.elements : [],
    appState: body.appState ?? {},
    savedAt: new Date().toISOString(),
  }
  await env.SCENES.put(storageKey(apiKey), serializeScene(data, user?.sub))
  return c.json({ key: apiKey, success: true }, 201)
})

app.get('/api/scenes/:key', optionalAuth(), async (c) => {
  const env = c.env as Env
  const user = c.get('user')
  const key = c.req.param('key')
  const data = await env.SCENES.get(storageKey(key), 'json')
  if (!data) return c.json({ error: 'Scene not found' }, 404)
  const record = data as Record<string, unknown>
  if (user?.sub && record.userId && record.userId !== user.sub) {
    return c.json({ error: 'Scene not found' }, 404)
  }
  return c.json({
    key,
    type: record.type ?? 'sketch-board',
    name: record.name ?? 'Untitled',
    elements: Array.isArray(record.elements) ? record.elements : [],
    appState: typeof record.appState === 'object' ? record.appState : {},
    savedAt: record.savedAt ?? new Date().toISOString(),
    userId: record.userId ?? null,
  })
})

app.put('/api/scenes/:key', optionalAuth(), async (c) => {
  const env = c.env as Env
  const user = c.get('user')
  const key = c.req.param('key')
  const existing = await env.SCENES.get(storageKey(key), 'json')
  if (!existing) return c.json({ error: 'Scene not found' }, 404)
  const existingRecord = existing as Record<string, unknown>
  if (user?.sub && existingRecord.userId && existingRecord.userId !== user.sub) {
    return c.json({ error: 'Scene not found' }, 404)
  }
  const body = await c.req.json<{ type?: string; name?: string; elements?: unknown[]; appState?: Record<string, unknown> }>()
  const data = {
    type: body.type ?? existingRecord.type ?? 'sketch-board',
    name: body.name ?? existingRecord.name ?? 'Untitled',
    elements: Array.isArray(body.elements) ? body.elements : (existingRecord.elements ?? []),
    appState: body.appState ?? existingRecord.appState ?? {},
    savedAt: new Date().toISOString(),
  }
  await env.SCENES.put(storageKey(key), serializeScene(data, user?.sub ?? (existingRecord.userId as string | undefined)))
  return c.json({ key, success: true })
})

app.delete('/api/scenes/:key', optionalAuth(), async (c) => {
  const env = c.env as Env
  const user = c.get('user')
  const key = c.req.param('key')
  const data = await env.SCENES.get(storageKey(key), 'json')
  if (!data) return c.json({ error: 'Scene not found' }, 404)
  const record = data as Record<string, unknown>
  if (user?.sub && record.userId && record.userId !== user.sub) {
    return c.json({ error: 'Scene not found' }, 404)
  }
  await env.SCENES.delete(storageKey(key))
  return c.json({ success: true })
})

const port = 8787
if (typeof Bun !== 'undefined') {
  console.log(`Server running on http://localhost:${port}`)
  Bun.serve({
    fetch: (request, env) => app.fetch(request, env),
    port,
  })
}

export default app
