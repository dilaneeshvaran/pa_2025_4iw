export interface GoogleProfile {
  sub: string
  email: string
  email_verified: boolean
  name: string
  given_name: string
  family_name: string
  picture?: string
}

export interface OAuthState {
  state: string
  codeVerifier: string
  nonce: string
  redirectUrl?: string
}
