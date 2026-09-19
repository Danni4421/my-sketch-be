import type { User, UserId, CreateUserRequest } from '../types'
import { createUserId, createEmail, createGoogleId } from '../types'

export class UserModel {
  private constructor(
    private readonly _id: UserId,
    private readonly _data: Omit<User, 'id'>,
  ) {}

  static create(request: CreateUserRequest): UserModel {
    return new UserModel(
      UserModel.generateId(),
      {
        email: createEmail(request.email),
        name: request.name,
        picture: request.picture,
        googleId: createGoogleId(request.googleId),
        createdAt: new Date().toISOString(),
      },
    )
  }

  static fromKV(id: string, data: unknown): UserModel | null {
    if (!data || typeof data !== 'object') return null

    const record = data as Record<string, unknown>
    return new UserModel(
      createUserId(id),
      {
        email: createEmail(String(record.email ?? '')),
        name: String(record.name ?? ''),
        picture: String(record.picture ?? ''),
        googleId: createGoogleId(String(record.googleId ?? '')),
        createdAt: String(record.createdAt ?? new Date().toISOString()),
      },
    )
  }

  private static generateId(): UserId {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).slice(2)
    return createUserId(`user_${timestamp}_${random}`)
  }

  get id(): UserId {
    return this._id
  }

  get email(): string {
    return this._data.email
  }

  get name(): string {
    return this._data.name
  }

  get picture(): string {
    return this._data.picture
  }

  get googleId(): string {
    return this._data.googleId
  }

  get createdAt(): string {
    return this._data.createdAt
  }

  toJSON(): User {
    return {
      id: this._id,
      ...this._data,
    }
  }

  toStorageValue(): string {
    return JSON.stringify(this._data)
  }
}
