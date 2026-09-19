import type { Context, Next } from 'hono'
import { AppError, ValidationError } from '../errors'

export async function errorHandler(c: Context, next: Next) {
  try {
    return await next()
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(error.toJSON(), error.statusCode as any)
    }
    console.error('Unhandled error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
}

export async function requestLogger(c: Context, next: Next) {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  console.log(`${c.req.method} ${c.req.path} - ${duration}ms`)
}
