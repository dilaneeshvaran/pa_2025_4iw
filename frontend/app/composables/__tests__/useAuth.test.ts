import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../useAuth'

vi.stubGlobal(
  'useRuntimeConfig',
  vi.fn(() => ({ public: { apiBase: 'http://localhost:3001/api' } })),
)
vi.stubGlobal('$fetch', vi.fn())

describe('useAuth', () => {
  beforeEach(() => {
    vi.mocked($fetch).mockReset()
    vi.mocked($fetch).mockResolvedValue({ success: true })
  })

  it('signup appelle /auth/signup avec le body et les credentials', async () => {
    const data = { email: 'ada@example.test', password: 'Password1!' } as any

    await useAuth().signup(data)

    expect($fetch).toHaveBeenCalledWith('/auth/signup', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      body: data,
      credentials: 'include',
    })
  })

  it('login appelle /auth/login', async () => {
    const data = { email: 'ada@example.test', password: 'Password1!' }

    await useAuth().login(data)

    expect($fetch).toHaveBeenCalledWith('/auth/login', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      body: data,
      credentials: 'include',
    })
  })

  it('verify2fa appelle /auth/verify-2fa', async () => {
    const data = { mfaToken: 'mfa-token', code: '123456' }

    await useAuth().verify2fa(data)

    expect($fetch).toHaveBeenCalledWith('/auth/verify-2fa', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      body: data,
      credentials: 'include',
    })
  })

  it('requestPasswordReset appelle /auth/request-password-reset', async () => {
    const data = { email: 'ada@example.test' }

    await useAuth().requestPasswordReset(data)

    expect($fetch).toHaveBeenCalledWith('/auth/request-password-reset', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      body: data,
      credentials: 'include',
    })
  })

  it('resetPassword appelle /auth/reset-password', async () => {
    const data = { token: 'reset-token', newPassword: 'Password1!' }

    await useAuth().resetPassword(data)

    expect($fetch).toHaveBeenCalledWith('/auth/reset-password', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      body: data,
      credentials: 'include',
    })
  })

  it('verifyEmail et resendVerification appellent les endpoints email', async () => {
    await useAuth().verifyEmail({ token: 'verify-token' })
    await useAuth().resendVerification({ email: 'ada@example.test' })

    expect($fetch).toHaveBeenNthCalledWith(1, '/auth/verify-email', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      body: { token: 'verify-token' },
      credentials: 'include',
    })
    expect($fetch).toHaveBeenNthCalledWith(2, '/auth/resend-verification', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      body: { email: 'ada@example.test' },
      credentials: 'include',
    })
  })

  it('refreshToken appelle /auth/refresh', async () => {
    await useAuth().refreshToken({ refreshToken: 'refresh-token' })

    expect($fetch).toHaveBeenCalledWith('/auth/refresh', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      body: { refreshToken: 'refresh-token' },
      credentials: 'include',
    })
  })
})
