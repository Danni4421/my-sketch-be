export abstract class AppError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = this.constructor.name
    this.cause = cause
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
    }
  }
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND'
  readonly statusCode = 404

  constructor(resource: string, id: string) {
    super(`${resource} with id '${id}' not found`)
  }
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR'
  readonly statusCode = 400

  constructor(message: string) {
    super(message)
  }
}

export class StorageError extends AppError {
  readonly code = 'STORAGE_ERROR'
  readonly statusCode = 500

  constructor(message: string, cause?: unknown) {
    super(message, cause)
  }
}

export class ConflictError extends AppError {
  readonly code = 'CONFLICT'
  readonly statusCode = 409

  constructor(message: string) {
    super(message)
  }
}
