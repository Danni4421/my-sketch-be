import type { Context } from 'hono'
import type { SceneKey, CreateSceneRequest } from '../types'
import { createSceneKey } from '../types'
import { SceneService } from '../services/scene-service'
import { AppError } from '../errors'

export class SceneController {
  constructor(private readonly service: SceneService) {}

  async getAll(c: Context) {
    const scenes = await this.service.getAllScenes()
    return c.json(scenes)
  }

  async getByKey(c: Context) {
    const key = createSceneKey(c.req.param('key'))
    const scene = await this.service.getSceneByKey(key)
    return c.json(scene)
  }

  async create(c: Context) {
    const body = await c.req.json<CreateSceneRequest>()
    const scene = await this.service.createScene(body)
    return c.json({ key: scene.key, success: true }, 201)
  }

  async delete(c: Context) {
    const key = createSceneKey(c.req.param('key'))
    await this.service.deleteScene(key)
    return c.json({ success: true })
  }

  handleError(error: unknown, c: Context) {
    if (error instanceof AppError) {
      return c.json(error.toJSON(), error.statusCode as any)
    }
    console.error('Unexpected error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}
