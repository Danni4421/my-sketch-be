import type { UserId, Email } from '../types'
import { createUserId, createEmail } from '../types'

export interface JwtHeader {
  alg: string
  typ: string
}

export interface JwtPayload {
  sub: UserId
  email: Email
  name: string
  picture: string
  iat: number
  exp: number
}

export class JwtService {
  constructor(private readonly secret: string) {}

  async createToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    const header: JwtHeader = { alg: 'HS256', typ: 'JWT' }
    const now = Math.floor(Date.now() / 1000)
    const fullPayload: JwtPayload = {
      ...payload,
      iat: now,
      exp: now + 7 * 24 * 60 * 60, // 7 days
    }

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header))
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload))
    const signature = await this.sign(`${encodedHeader}.${encodedPayload}`)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  async verify(token: string): Promise<JwtPayload | null> {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null

      const [encodedHeader, encodedPayload, signature] = parts
      const expectedSignature = await this.sign(`${encodedHeader}.${encodedPayload}`)

      if (signature !== expectedSignature) return null

      const payload: JwtPayload = JSON.parse(this.base64UrlDecode(encodedPayload))

      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null
      }

      return payload
    } catch {
      return null
    }
  }

  private async sign(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    return this.base64UrlEncode(new Uint8Array(signature))
  }

  private base64UrlEncode(data: string | Uint8Array): string {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
    const binary = Array.from(bytes).map((b) => String.fromCharCode(b)).join('')
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }

  private base64UrlDecode(data: string): string {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    return atob(padded)
  }
}
