import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import { SceneRepository } from './repositories/scene-repository'
import { SceneService } from './services/scene-service'
import { SceneController } from './controllers/scene-controller'
import { errorHandler, requestLogger } from './middleware/error-handler'

function createApp(env: Env) {
  const app = new Hono()

  // Middleware
  app.use('*', cors())
  app.use('*', errorHandler)
  app.use('*', requestLogger)

  // Dependencies
  const repository = new SceneRepository(env.SCENES)
  const service = new SceneService(repository)
  const controller = new SceneController(service)

  // Routes
  app.get('/api/scenes', (c) => controller.getAll(c).catch((e) => controller.handleError(e, c)))
  app.post('/api/scenes', (c) => controller.create(c).catch((e) => controller.handleError(e, c)))
  app.get('/api/scenes/:key', (c) => controller.getByKey(c).catch((e) => controller.handleError(e, c)))
  app.delete('/api/scenes/:key', (c) => controller.delete(c).catch((e) => controller.handleError(e, c)))

  return app
}

const port = 8787
if (typeof Bun !== 'undefined') {
  console.log(`Server running on http://localhost:${port}`)
  Bun.serve({
    fetch: (request, env) => createApp(env as Env).fetch(request),
    port,
  })
}

export default {
  fetch: (request: Request, env: Env) => createApp(env).fetch(request),
}
