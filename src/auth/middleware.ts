import type { Context, Next } from 'hono'
import type { Env } from '../types'
import { JwtService } from './jwt'
import type { JwtPayload } from './jwt'

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const env = c.env as Env
  const jwtService = new JwtService(env.JWT_SECRET)

  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.slice(7)
  const payload = await jwtService.verify(token)

  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  c.set('user', payload)
  await next()
}

export function optionalAuth(mandatory = false) {
  return async (c: Context, next: Next) => {
    const env = c.env as Env
    const jwtService = new JwtService(env.JWT_SECRET)

    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const payload = await jwtService.verify(token)
      if (payload) {
        c.set('user', payload)
      }
    }

    if (mandatory && !c.get('user')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    await next()
  }
}
