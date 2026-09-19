import type { CreateUserRequest } from '../types'

export interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  id_token: string
}

export interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture: string
  verified_email: boolean
}

export class GoogleOAuth {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly redirectUri: string

  constructor(clientId: string, clientSecret: string, baseUrl: string) {
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.redirectUri = `${baseUrl}/api/auth/callback`
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    })
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async exchangeCode(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens')
    }

    return response.json() as Promise<GoogleTokenResponse>
  }

  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      throw new Error('Failed to get user info')
    }

    return response.json() as Promise<GoogleUserInfo>
  }

  async authenticate(code: string): Promise<CreateUserRequest> {
    const tokens = await this.exchangeCode(code)
    const userInfo = await this.getUserInfo(tokens.access_token)

    return {
      googleId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    }
  }
}
