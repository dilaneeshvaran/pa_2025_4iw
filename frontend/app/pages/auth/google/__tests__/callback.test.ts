import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CallbackPage from '../callback.vue'
import { createTestingPinia } from '@pinia/testing'
import { useAuthStore } from '~/stores/auth'

// Mock des dépendances Nuxt
const mockRouterPush = vi.fn()
const mockRoute = {
  query: {}
}

vi.mock('#app', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: mockRouterPush }),
  definePageMeta: vi.fn(),
}))

const mockHandleCallback = vi.fn()
vi.mock('~/composables/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    handleCallback: mockHandleCallback
  })
}))

vi.mock('~/utils/authNavigation', () => ({
  getDashboardPath: vi.fn().mockReturnValue('/patient/dashboard')
}))

// Mock du composant UiRedirectingOverlay
const UiRedirectingOverlay = {
  name: 'UiRedirectingOverlay',
  template: '<div></div>',
  props: ['show']
}

describe('Google OAuth Callback Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRoute.query = {}
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('devrait afficher l\'état de chargement initialement', () => {
    mockHandleCallback.mockImplementation(() => new Promise(() => {})) // Never resolves

    const wrapper = mount(CallbackPage, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          UiRedirectingOverlay,
          NuxtLink: true
        }
      }
    })

    expect(wrapper.text()).toContain('Connexion en cours...')
  })

  it('devrait traiter le callback avec succès et rediriger', async () => {
    mockRoute.query = {
      accessToken: 'token123',
      refreshToken: 'refresh123',
      user: JSON.stringify({ id: '1', role: 'PATIENT' })
    }

    const mockUser = { id: '1', role: 'PATIENT' }
    const mockTokens = { accessToken: 'token123', refreshToken: 'refresh123' }

    mockHandleCallback.mockReturnValue({
      user: mockUser,
      tokens: mockTokens,
      redirect: ''
    })

    const wrapper = mount(CallbackPage, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          UiRedirectingOverlay,
          NuxtLink: true
        }
      }
    })

    const authStore = useAuthStore()

    // Attendre que onMounted s'exécute
    await wrapper.vm.$nextTick()

    // Vérifie que le store a été hydraté
    expect(authStore.setAuth).toHaveBeenCalledWith(mockUser, mockTokens)

    // Avance le temps pour le setTimeout de redirection
    vi.runAllTimers()

    expect(mockRouterPush).toHaveBeenCalledWith('/patient/dashboard')
  })

  it('devrait gérer les erreurs et afficher le message', async () => {
    mockRoute.query = { error: 'Erreur Google' }

    mockHandleCallback.mockImplementation(() => {
      throw new Error('Erreur de callback Google')
    })

    const wrapper = mount(CallbackPage, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn })],
        stubs: {
          UiRedirectingOverlay,
          NuxtLink: true
        }
      }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Erreur de connexion')
    expect(wrapper.text()).toContain('Erreur de callback Google')
  })
})
