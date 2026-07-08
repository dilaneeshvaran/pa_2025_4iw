import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'

const authMock = vi.hoisted(() => ({
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    isAuthenticated: true,
    isTokenExpired: false,
    refresh: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/stores/auth', async () => {
  const { reactive } = await import('vue')
  return {
    useAuthStore: () => reactive(authMock),
  }
})

class MockWebSocket {
  static OPEN = 1
  static CONNECTING = 0
  static instances: MockWebSocket[] = []

  readyState = MockWebSocket.CONNECTING
  onopen: (() => void) | null = null
  onclose: (() => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: (() => void) | null = null
  sent: string[] = []
  closed = false

  constructor(public url: string) {
    MockWebSocket.instances.push(this)
  }

  send(payload: string) {
    this.sent.push(payload)
  }

  close() {
    this.closed = true
    this.readyState = 3
    this.onclose?.()
  }
}

vi.stubGlobal('useRuntimeConfig', vi.fn())
vi.stubGlobal('$fetch', vi.fn())
vi.stubGlobal('WebSocket', MockWebSocket)

import { useMessagingStore } from '../messaging'
import { useAuthStore } from '~/stores/auth'

describe('messaging store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: { apiBase: 'http://localhost:3001/api' },
    } as any)
    vi.mocked($fetch).mockResolvedValue({ success: true, data: { count: 4 } })
    MockWebSocket.instances = []
    const authStore = useAuthStore()
    authStore.accessToken = 'access-token'
    authStore.refreshToken = 'refresh-token'
    authStore.isAuthenticated = true
    authStore.isTokenExpired = false
    authStore.refresh.mockClear()
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', host: 'app.test' },
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('construit une URL WebSocket depuis une API absolue', async () => {
    const store = useMessagingStore()

    await store.connect()

    expect(MockWebSocket.instances[0]?.url).toBe(
      'ws://localhost:3001/api/ws/messages?token=access-token',
    )
  })

  it('construit une URL WebSocket depuis une API relative', async () => {
    vi.mocked(useRuntimeConfig).mockReturnValue({
      public: { apiBase: '/api' },
    } as any)
    const store = useMessagingStore()

    await store.connect()

    expect(MockWebSocket.instances[0]?.url).toBe(
      'ws://app.test/api/ws/messages?token=access-token',
    )
  })

  it('rafraîchit le token expiré avant la connexion', async () => {
    useAuthStore().isTokenExpired = true
    const store = useMessagingStore()

    await store.connect()

    expect(authMock.refresh).toHaveBeenCalled()
  })

  it('ignore connect si la socket est déjà ouverte', async () => {
    const store = useMessagingStore()
    await store.connect()
    MockWebSocket.instances[0]!.readyState = MockWebSocket.OPEN

    await store.connect()

    expect(MockWebSocket.instances).toHaveLength(1)
  })

  it('démarre le ping à l’ouverture et envoie un JSON ping toutes les 30s', async () => {
    const store = useMessagingStore()
    await store.connect()
    const ws = MockWebSocket.instances[0]!

    ws.readyState = MockWebSocket.OPEN
    ws.onopen?.()
    vi.advanceTimersByTime(30000)

    expect(store.isConnected).toBe(true)
    expect(ws.sent).toEqual(['{"type":"ping"}'])
  })

  it('send sérialise les données seulement si la socket est ouverte', async () => {
    const store = useMessagingStore()
    await store.connect()
    const ws = MockWebSocket.instances[0]!

    store.send({ type: 'ignored' })
    ws.readyState = MockWebSocket.OPEN
    store.send({ type: 'message', id: 'm1' })

    expect(ws.sent).toEqual(['{"type":"message","id":"m1"}'])
  })

  it('dispatch les messages JSON aux listeners et ignore les payloads invalides', async () => {
    const store = useMessagingStore()
    const handler = vi.fn()
    store.on('message:new', handler)
    await store.connect()
    const ws = MockWebSocket.instances[0]!

    ws.onmessage?.({ data: '{"type":"message:new","data":{"id":"m1"}}' } as MessageEvent)
    ws.onmessage?.({ data: 'not-json' } as MessageEvent)
    store.off('message:new', handler)
    ws.onmessage?.({ data: '{"type":"message:new","data":{"id":"m2"}}' } as MessageEvent)

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ id: 'm1' })
  })

  it('reconnecte après 3s si la fermeture n’est pas intentionnelle', async () => {
    const store = useMessagingStore()
    await store.connect()
    const ws = MockWebSocket.instances[0]!

    ws.readyState = 3
    ws.onclose?.()
    await vi.advanceTimersByTimeAsync(3000)

    expect(store.isConnected).toBe(false)
    expect(MockWebSocket.instances).toHaveLength(2)
  })

  it('disconnect stoppe le ping, ferme la socket et bloque le reconnect', async () => {
    const store = useMessagingStore()
    await store.connect()
    const ws = MockWebSocket.instances[0]!
    ws.readyState = MockWebSocket.OPEN
    ws.onopen?.()

    store.disconnect()
    vi.advanceTimersByTime(3000)

    expect(ws.closed).toBe(true)
    expect(store.socket).toBeNull()
    expect(MockWebSocket.instances).toHaveLength(1)
  })

  it('récupère le compteur de non lus avec le header Bearer', async () => {
    const store = useMessagingStore()

    await store.fetchUnreadCount()

    expect(store.unreadCount).toBe(4)
    expect($fetch).toHaveBeenCalledWith('/messages/unread-count', {
      baseURL: 'http://localhost:3001/api',
      headers: { Authorization: 'Bearer access-token' },
    })
  })

  it('reconnecte quand le token change', async () => {
    const store = useMessagingStore()
    await store.connect()
    const firstSocket = MockWebSocket.instances[0]!

    useAuthStore().accessToken = 'new-token'
    await nextTick()

    expect(firstSocket.closed).toBe(true)
    expect(MockWebSocket.instances.at(-1)?.url).toContain('token=new-token')
  })
})
