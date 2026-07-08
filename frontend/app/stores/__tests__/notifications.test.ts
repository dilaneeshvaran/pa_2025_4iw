import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  normalizeNotification,
  toMetadataRecord,
  useNotificationsStore,
} from '../notifications'

vi.stubGlobal('useAuthenticatedFetch', vi.fn())

const apiNotification = {
  id: 'notif-1',
  type: 'MESSAGE_RECEIVED',
  title: 'Nouveau message',
  message: 'Vous avez un message',
  metadata: { conversationId: 'conv-1' },
  read: false,
  readAt: null,
  createdAt: '2026-07-08T10:00:00.000Z',
}

describe('notifications store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers().setSystemTime(new Date('2026-07-08T10:00:00.000Z'))
    vi.mocked(useAuthenticatedFetch).mockReset()
  })

  it('normalise les métadonnées API en Record ou null', () => {
    expect(toMetadataRecord({ a: 1 })).toEqual({ a: 1 })
    expect(toMetadataRecord(['a'])).toBeNull()
    expect(toMetadataRecord(null)).toBeNull()
    expect(toMetadataRecord('x')).toBeNull()
    expect(normalizeNotification({ ...apiNotification, metadata: ['bad'] })).toEqual({
      ...apiNotification,
      metadata: null,
    })
  })

  it('fetchNotifications charge les notifications normalisées', async () => {
    vi.mocked(useAuthenticatedFetch).mockResolvedValue({
      success: true,
      data: [apiNotification],
    })
    const store = useNotificationsStore()

    const promise = store.fetchNotifications(5)
    expect(store.loading).toBe(true)
    await promise

    expect(store.loading).toBe(false)
    expect(store.loaded).toBe(true)
    expect(store.error).toBeNull()
    expect(store.notifications).toEqual([apiNotification])
    expect(useAuthenticatedFetch).toHaveBeenCalledWith('/notifications?limit=5')
  })

  it('fetchNotifications renseigne une erreur sans laisser loading actif', async () => {
    vi.mocked(useAuthenticatedFetch).mockRejectedValue(new Error('network'))
    const store = useNotificationsStore()

    await store.fetchNotifications()

    expect(store.loading).toBe(false)
    expect(store.error).toBe('Impossible de charger les notifications.')
  })

  it('fetchUnreadCount échoue silencieusement', async () => {
    vi.mocked(useAuthenticatedFetch).mockRejectedValue(new Error('network'))
    const store = useNotificationsStore()
    store.unreadCount = 3

    await store.fetchUnreadCount()

    expect(store.unreadCount).toBe(3)
    expect(store.error).toBeNull()
  })

  it('markAsRead ignore les notifications absentes ou déjà lues', async () => {
    const store = useNotificationsStore()
    store.notifications = [{ ...apiNotification, read: true }]

    await store.markAsRead('missing')
    await store.markAsRead('notif-1')

    expect(useAuthenticatedFetch).not.toHaveBeenCalled()
  })

  it('markAsRead appelle l’API puis met à jour localement', async () => {
    vi.mocked(useAuthenticatedFetch).mockResolvedValue({ success: true })
    const store = useNotificationsStore()
    store.notifications = [{ ...apiNotification }]
    store.unreadCount = 2

    await store.markAsRead('notif-1')

    expect(useAuthenticatedFetch).toHaveBeenCalledWith('/notifications/notif-1/read', {
      method: 'PUT',
    })
    expect(store.notifications[0]?.read).toBe(true)
    expect(store.notifications[0]?.readAt).toBe('2026-07-08T10:00:00.000Z')
    expect(store.unreadCount).toBe(1)
  })

  it('markAllAsRead marque tout comme lu et conserve les readAt existants', async () => {
    vi.mocked(useAuthenticatedFetch).mockResolvedValue({
      success: true,
      data: { count: 2 },
    })
    const store = useNotificationsStore()
    store.notifications = [
      { ...apiNotification, id: 'notif-1', readAt: null },
      { ...apiNotification, id: 'notif-2', read: true, readAt: 'already-read' },
    ]
    store.unreadCount = 1

    await store.markAllAsRead()

    expect(store.unreadCount).toBe(0)
    expect(store.notifications).toEqual([
      expect.objectContaining({
        id: 'notif-1',
        read: true,
        readAt: '2026-07-08T10:00:00.000Z',
      }),
      expect.objectContaining({
        id: 'notif-2',
        read: true,
        readAt: 'already-read',
      }),
    ])
  })

  it('refresh lance notifications et compteur en parallèle', async () => {
    vi.mocked(useAuthenticatedFetch)
      .mockResolvedValueOnce({ success: true, data: [apiNotification] })
      .mockResolvedValueOnce({ success: true, data: { count: 9 } })
    const store = useNotificationsStore()

    await store.refresh()

    expect(store.notifications).toHaveLength(1)
    expect(store.unreadCount).toBe(9)
  })
})
