import { beforeEach, describe, expect, it, vi } from 'vitest'

const authStore = vi.hoisted(() => ({
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  isTokenExpired: false,
  refresh: vi.fn().mockImplementation(async () => {
    authStore.accessToken = 'refreshed-token'
  }),
  logout: vi.fn(),
}))

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => authStore,
}))

vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({
  public: { apiBase: 'http://localhost:3001/api' },
})))
vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('navigateTo', vi.fn())

import { useAuthenticatedFetch } from '../useAuthenticatedFetch'

describe('useAuthenticatedFetch', () => {
  beforeEach(() => {
    vi.mocked($fetch).mockReset()
    vi.mocked(navigateTo).mockReset()
    authStore.accessToken = 'access-token'
    authStore.refreshToken = 'refresh-token'
    authStore.isTokenExpired = false
    authStore.refresh.mockClear()
    authStore.logout.mockClear()
  })

  it('injecte le header Bearer et conserve les options originales', async () => {
    vi.mocked($fetch).mockResolvedValue({ success: true })

    await useAuthenticatedFetch('/secure', {
      method: 'POST',
      body: { ok: true },
      headers: { 'x-custom': 'yes' },
    })

    expect($fetch).toHaveBeenCalledWith('/secure', {
      baseURL: 'http://localhost:3001/api',
      method: 'POST',
      body: { ok: true },
      headers: {
        'x-custom': 'yes',
        Authorization: 'Bearer access-token',
        'x-timezone-offset': new Date().getTimezoneOffset().toString(),
      },
    })
  })

  it('rafraîchit le token expiré avant la requête', async () => {
    authStore.isTokenExpired = true
    vi.mocked($fetch).mockResolvedValue({ success: true })

    await useAuthenticatedFetch('/secure')

    expect(authStore.refresh).toHaveBeenCalled()
    expect($fetch).toHaveBeenCalledWith(
      '/secure',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer refreshed-token',
        }),
      }),
    )
  })

  it('retry après 401 avec le token rafraîchi', async () => {
    vi.mocked($fetch)
      .mockRejectedValueOnce({ response: { status: 401 } })
      .mockResolvedValueOnce({ success: true })

    await expect(useAuthenticatedFetch('/secure')).resolves.toEqual({
      success: true,
    })
    expect(authStore.refresh).toHaveBeenCalled()
    expect($fetch).toHaveBeenCalledTimes(2)
  })

  it('propage l’erreur si le refresh échoue après 401', async () => {
    const unauthorized = { response: { status: 401 } }
    vi.mocked($fetch).mockRejectedValueOnce(unauthorized)
    authStore.refresh.mockRejectedValueOnce(new Error('refresh failed'))

    await expect(useAuthenticatedFetch('/secure')).rejects.toBe(unauthorized)
    expect(authStore.logout).toHaveBeenCalled()
    expect(navigateTo).toHaveBeenCalledWith('/auth/login')
  })
})
