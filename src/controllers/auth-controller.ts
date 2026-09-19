import type { Context } from 'hono'
import type { Env } from '../types'
import { GoogleOAuth } from '../auth/google'
import { JwtService } from '../auth/jwt'
import { UserModel } from '../models/user'

export class AuthController {
  private google: GoogleOAuth
  private jwt: JwtService

  constructor(env: Env) {
    this.google = new GoogleOAuth(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      'https://drawapi.ajikkk.my.id',
    )
    this.jwt = new JwtService(env.JWT_SECRET)
  }

  login(c: Context) {
    const state = crypto.randomUUID()
    const url = this.google.getAuthorizationUrl(state)
    return c.redirect(url)
  }

  async callback(c: Context) {
    try {
      const code = c.req.query('code')
      const error = c.req.query('error')

      if (error) {
        return c.html(this.getErrorPage(`Google error: ${error}`))
      }

      if (!code) {
        return c.html(this.getErrorPage('No code provided'))
      }

      const userData = await this.google.authenticate(code)
      const env = c.env as Env

      // Check if user exists
      const existingUserId = await env.USERS.get(userData.googleId)
      let user: UserModel

      if (existingUserId) {
        const existingUser = await env.USERS.get(existingUserId, 'json')
        user = UserModel.fromKV(existingUserId, existingUser)!
      } else {
        user = UserModel.create(userData)
        await env.USERS.put(user.id, user.toStorageValue())
        await env.USERS.put(userData.googleId, user.id)
      }

      const token = await this.jwt.createToken({
        sub: user.id,
        email: user.email as any,
        name: user.name,
        picture: user.picture,
      })

      return c.html(this.getSuccessPage(token))
    } catch (error) {
      console.error('Auth callback error:', error)
      return c.html(this.getErrorPage(`Authentication failed: ${error}`))
    }
  }

  async me(c: Context) {
    const user = c.get('user')
    return c.json({
      id: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
    })
  }

  private getSuccessPage(token: string): string {
    return `<!DOCTYPE html>
<html>
<head><title>Authenticating...</title></head>
<body>
  <script>
    window.opener.postMessage({ type: 'auth-success', token: '${token}' }, '*');
    window.close();
  </script>
  <p>Authenticating... This window should close automatically.</p>
</body>
</html>`
  }

  private getErrorPage(message: string): string {
    return `<!DOCTYPE html>
<html>
<head><title>Auth Error</title></head>
<body>
  <script>
    window.opener.postMessage({ type: 'auth-error', error: '${message}' }, '*');
    window.close();
  </script>
  <p>Error: ${message}</p>
</body>
</html>`
  }
}
