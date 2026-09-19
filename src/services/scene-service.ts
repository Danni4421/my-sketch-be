import type { Scene, SceneKey, CreateSceneRequest } from '../types'
import { createTimestamp } from '../types'
import { SceneModel } from '../models/scene'
import { SceneRepository } from '../repositories/scene-repository'
import { NotFoundError, ValidationError } from '../errors'

export class SceneService {
  constructor(private readonly repository: SceneRepository) {}

  async getAllScenes(): Promise<Scene[]> {
    const scenes = await this.repository.findAll()
    return scenes.map((scene) => scene.toJSON())
  }

  async getSceneByKey(key: SceneKey): Promise<Scene> {
    const scene = await this.repository.findByKey(key)
    if (!scene) {
      throw new NotFoundError('Scene', key)
    }
    return scene.toJSON()
  }

  async createScene(request: CreateSceneRequest): Promise<Scene> {
    this.validateCreateRequest(request)

    const scene = SceneModel.create({
      type: request.type,
      name: request.name,
      elements: request.elements,
      appState: request.appState,
      savedAt: createTimestamp(new Date().toISOString()),
    })

    await this.repository.save(scene)
    return scene.toJSON()
  }

  async deleteScene(key: SceneKey): Promise<void> {
    const exists = await this.repository.exists(key)
    if (!exists) {
      throw new NotFoundError('Scene', key)
    }
    await this.repository.delete(key)
  }

  private validateCreateRequest(request: CreateSceneRequest): void {
    if (!request.type || typeof request.type !== 'string') {
      throw new ValidationError('Scene type is required')
    }
    if (!request.name || typeof request.name !== 'string') {
      throw new ValidationError('Scene name is required')
    }
    if (!Array.isArray(request.elements)) {
      throw new ValidationError('Elements must be an array')
    }
    if (!request.appState || typeof request.appState !== 'object') {
      throw new ValidationError('AppState must be an object')
    }
  }
}
