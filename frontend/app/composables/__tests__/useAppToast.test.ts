import { beforeEach, describe, expect, it, vi } from 'vitest'

const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
}))

vi.mock('vue-toastification', () => ({
  useToast: () => toast,
}))

describe('useAppToast', () => {
  beforeEach(() => {
    vi.resetModules()
    toast.error.mockClear()
    toast.success.mockClear()
    toast.info.mockClear()
    toast.warning.mockClear()
  })

  it('appelle success/error/warning/info du toast', async () => {
    const { useAppToast } = await import('../useAppToast')
    const appToast = useAppToast()

    appToast.success('Succès')
    appToast.error('Erreur')
    appToast.warning('Attention')
    appToast.info('Info')

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith('Succès'))
    expect(toast.error).toHaveBeenCalledWith('Erreur')
    expect(toast.warning).toHaveBeenCalledWith('Attention')
    expect(toast.info).toHaveBeenCalledWith('Info')
  })
})
