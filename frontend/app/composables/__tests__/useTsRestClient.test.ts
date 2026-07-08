import { beforeEach, describe, expect, it, vi } from 'vitest'

const authStore = vi.hoisted(() => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  isTokenExpired: false,
  user: { id: 'user-1' },
  setAuth: vi.fn((user, tokens) => {
    authStore.user = user
    authStore.accessToken = tokens.accessToken
    authStore.refreshToken = tokens.refreshToken
  }),
  logout: vi.fn(),
}))

const initClient = vi.hoisted(() =>
  vi.fn((_contract, options) => ({ contract: _contract, options })),
)

vi.mock('@ts-rest/core', () => ({ initClient }), { virtual: true })
vi.mock('@medicote/shared', () => ({ reviewsContract: { reviews: true } }), {
  virtual: true,
})
vi.mock('~/stores/auth', () => ({ useAuthStore: () => authStore }))

vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({
  public: { apiBase: 'http://localhost:3001/api' },
})))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('$fetch', vi.fn())
Object.assign($fetch, { raw: vi.fn() })

import { useTsRestClient } from '../useTsRestClient'

describe('useTsRestClient', () => {
  beforeEach(() => {
    vi.mocked($fetch).mockReset()
    vi.mocked($fetch.raw).mockReset()
    initClient.mockClear()
    authStore.accessToken = 'access-token'
    authStore.refreshToken = 'refresh-token'
    authStore.isTokenExpired = false
    authStore.user = { id: 'user-1' }
    authStore.setAuth.mockClear()
    authStore.logout.mockClear()
  })

  it('construit le client avec le baseUrl de config', () => {
    const client = useTsRestClient() as any

    expect(initClient).toHaveBeenCalledWith(
      { reviews: true },
      expect.objectContaining({
        baseUrl: 'http://localhost:3001/api',
        baseHeaders: {},
      }),
    )
    expect(client.options.baseUrl).toBe('http://localhost:3001/api')
  })

  it('injecte les headers auth dans la fonction api', async () => {
    const client = useTsRestClient() as any
    vi.mocked($fetch.raw).mockResolvedValue({
      status: 200,
      _data: { success: true },
      headers: new Headers(),
    })

    const response = await client.options.api({
      path: '/reviews',
      method: 'POST',
      headers: { 'x-test': 'yes' },
      body: { rating: 5 },
    })

    expect(response.status).toBe(200)
    expect($fetch.raw).toHaveBeenCalledWith('/reviews', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      headers: {
        'x-test': 'yes',
        'Content-Type': 'application/json',
        Authorization: 'Bearer access-token',
      },
      body: '{"rating":5}',
    })
  })

  it('rafraîchit automatiquement avant requête si le token est expiré', async () => {
    authStore.isTokenExpired = true
    vi.mocked($fetch).mockResolvedValue({
      success: true,
      data: { accessToken: 'fresh-token', refreshToken: 'fresh-refresh' },
    })
    vi.mocked($fetch.raw).mockResolvedValue({
      status: 200,
      _data: { success: true },
      headers: new Headers(),
    })
    const client = useTsRestClient() as any

    await client.options.api({
      path: '/reviews',
      method: 'GET',
      headers: {},
    })

    expect($fetch).toHaveBeenCalledWith('/auth/refresh', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      body: { refreshToken: 'refresh-token' },
    })
    expect(authStore.setAuth).toHaveBeenCalled()
    expect($fetch.raw).toHaveBeenCalledWith(
      '/reviews',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fresh-token',
        }),
      }),
    )
  })

  it('retry avec un token rafraîchi après une réponse 401', async () => {
    const unauthorized = { response: { status: 401, _data: { success: false }, headers: new Headers() } }
    vi.mocked($fetch.raw)
      .mockRejectedValueOnce(unauthorized)
      .mockResolvedValueOnce({
        status: 200,
        _data: { success: true },
        headers: new Headers(),
      })
    vi.mocked($fetch).mockResolvedValue({
      success: true,
      data: { accessToken: 'retry-token', refreshToken: 'retry-refresh' },
    })
    const client = useTsRestClient() as any

    const response = await client.options.api({
      path: '/reviews',
      method: 'GET',
      headers: {},
    })

    expect(response.status).toBe(200)
    expect($fetch.raw).toHaveBeenCalledTimes(2)
    expect($fetch.raw).toHaveBeenLastCalledWith(
      '/reviews',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer retry-token',
        }),
      }),
    )
  })
})
