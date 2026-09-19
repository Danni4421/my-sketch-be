export type SceneKey = string & { readonly __brand: unique symbol }
export type Timestamp = string & { readonly __brand: unique symbol }
export type JsonString = string & { readonly __brand: unique symbol }

export const createSceneKey = (value: string): SceneKey => value as SceneKey
export const createTimestamp = (value: string): Timestamp => value as Timestamp
export const createJsonString = (value: string): JsonString => value as JsonString

export interface SceneData {
  readonly type: string
  readonly name: string
  readonly elements: readonly unknown[]
  readonly appState: Record<string, unknown>
  readonly savedAt: Timestamp
}

export interface Scene extends SceneData {
  readonly key: SceneKey
  readonly userId?: string
}

export interface CreateSceneRequest {
  readonly type: string
  readonly name: string
  readonly elements: readonly unknown[]
  readonly appState: Record<string, unknown>
}

export interface ApiResponse<T> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
}
