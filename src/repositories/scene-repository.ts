import type { SceneKey } from '../types'
import type { SceneModel } from '../models/scene'
import { StorageError } from '../errors'

export interface KVNamespace {
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>
  get(key: string, type?: string): Promise<unknown>
  put(key: string, value: string): Promise<void>
  delete(key: string): Promise<void>
}

export class SceneRepository {
  private readonly prefix = 'scenes/'

  constructor(private readonly kv: KVNamespace) {}

  async findAll(): Promise<SceneModel[]> {
    try {
      const list = await this.kv.list({ prefix: this.prefix })
      const scenes: SceneModel[] = []

      for (const { name } of list.keys) {
        try {
          const data = await this.kv.get(name, 'json')
          const scene = SceneModel.fromKV(name, data)
          if (scene) {
            scenes.push(scene)
          }
        } catch {
          // Skip corrupted entries
        }
      }

      return scenes.sort((a, b) =>
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      )
    } catch (e) {
      throw new StorageError('Failed to list scenes', e)
    }
  }

  async findByKey(key: SceneKey): Promise<SceneModel | null> {
    try {
      const data = await this.kv.get(key, 'json')
      return SceneModel.fromKV(key, data)
    } catch (e) {
      throw new StorageError(`Failed to get scene: ${key}`, e)
    }
  }

  async save(scene: SceneModel): Promise<SceneKey> {
    try {
      await this.kv.put(scene.key, scene.toStorageValue())
      return scene.key
    } catch (e) {
      throw new StorageError(`Failed to save scene: ${scene.key}`, e)
    }
  }

  async delete(key: SceneKey): Promise<void> {
    try {
      await this.kv.delete(key)
    } catch (e) {
      throw new StorageError(`Failed to delete scene: ${key}`, e)
    }
  }

  async exists(key: SceneKey): Promise<boolean> {
    const scene = await this.findByKey(key)
    return scene !== null
  }
}
