import type { Scene, SceneKey, SceneData, Timestamp } from '../types'
import { createSceneKey, createTimestamp } from '../types'

export class SceneModel {
  private constructor(
    private readonly _key: SceneKey,
    private readonly _data: SceneData,
  ) {}

  static create(data: SceneData, key?: SceneKey): SceneModel {
    const sceneKey = key ?? SceneModel.generateKey()
    return new SceneModel(sceneKey, data)
  }

  static fromKV(key: string, data: unknown): SceneModel | null {
    if (!data || typeof data !== 'object') return null

    const record = data as Record<string, unknown>
    const sceneData: SceneData = {
      type: String(record.type ?? 'sketch-board'),
      name: String(record.name ?? 'Untitled'),
      elements: Array.isArray(record.elements) ? record.elements : [],
      appState: typeof record.appState === 'object' && record.appState !== null
        ? record.appState as Record<string, unknown>
        : {},
      savedAt: createTimestamp(String(record.savedAt ?? new Date().toISOString())),
    }

    return new SceneModel(createSceneKey(key), sceneData)
  }

  private static generateKey(): SceneKey {
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 8)
    return createSceneKey(`scenes/${timestamp}-${random}.json`)
  }

  get key(): SceneKey {
    return this._key
  }

  get data(): Readonly<SceneData> {
    return this._data
  }

  get type(): string {
    return this._data.type
  }

  get name(): string {
    return this._data.name
  }

  get elements(): readonly unknown[] {
    return this._data.elements
  }

  get appState(): Record<string, unknown> {
    return this._data.appState
  }

  get savedAt(): Timestamp {
    return this._data.savedAt
  }

  withTimestamp(timestamp: Timestamp): SceneModel {
    return new SceneModel(this._key, {
      ...this._data,
      savedAt: timestamp,
    })
  }

  toJSON(): Scene {
    return {
      key: this._key,
      ...this._data,
    }
  }

  toStorageValue(): JsonString {
    return createJsonString(JSON.stringify(this._data))
  }
}

import type { JsonString } from '../types'
