export type UserId = string & { readonly __brand: unique symbol }
export type Email = string & { readonly __brand: unique symbol }
export type GoogleId = string & { readonly __brand: unique symbol }

export const createUserId = (value: string): UserId => value as UserId
export const createEmail = (value: string): Email => value as Email
export const createGoogleId = (value: string): GoogleId => value as GoogleId

export interface User {
  readonly id: UserId
  readonly email: Email
  readonly name: string
  readonly picture: string
  readonly googleId: GoogleId
  readonly createdAt: string
}

export interface CreateUserRequest {
  readonly email: string
  readonly name: string
  readonly picture: string
  readonly googleId: string
}

export interface JwtPayload {
  readonly sub: UserId
  readonly email: Email
  readonly name: string
  readonly picture: string
  readonly iat: number
  readonly exp: number
}
