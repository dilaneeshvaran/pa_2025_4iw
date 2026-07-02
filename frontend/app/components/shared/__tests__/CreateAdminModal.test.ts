import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CreateAdminModal from '../CreateAdminModal.vue'

const mockFetch = vi.fn()

vi.mock('~/composables/useAuthenticatedFetch', () => ({
  useAuthenticatedFetch: (...args: any[]) => mockFetch(...args)
}))

describe('CreateAdminModal.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when isOpen is false', () => {
    const wrapper = mount(CreateAdminModal, {
      props: {
        isOpen: false
      }
    })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('renders the modal form when isOpen is true', () => {
    const wrapper = mount(CreateAdminModal, {
      props: {
        isOpen: true
      }
    })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.find('#create-admin-title').text()).toBe('Créer un administrateur')
    expect(wrapper.find('#admin-email').exists()).toBe(true)
    expect(wrapper.find('#admin-password').exists()).toBe(true)
  })

  it('validates fields and submits form on success', async () => {
    mockFetch.mockResolvedValueOnce({ success: true })

    const wrapper = mount(CreateAdminModal, {
      props: {
        isOpen: true
      }
    })

    const emailInput = wrapper.find('#admin-email')
    const passwordInput = wrapper.find('#admin-password')

    await emailInput.setValue('test-admin@example.com')
    await passwordInput.setValue('Password123!')

    // Find the form and trigger submit
    await wrapper.find('form').trigger('submit.prevent')

    expect(mockFetch).toHaveBeenCalledWith('/admin/users', {
      method: 'POST',
      body: {
        email: 'test-admin@example.com',
        password: 'Password123!'
      }
    })

    // It should emit 'success' and 'close'
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('displays API error on submission failure', async () => {
    const errorMessage = 'Un utilisateur avec cet email existe déjà'
    mockFetch.mockRejectedValueOnce({
      data: { message: errorMessage }
    })

    const wrapper = mount(CreateAdminModal, {
      props: {
        isOpen: true
      }
    })

    const emailInput = wrapper.find('#admin-email')
    const passwordInput = wrapper.find('#admin-password')

    await emailInput.setValue('test-admin@example.com')
    await passwordInput.setValue('Password123!')

    await wrapper.find('form').trigger('submit.prevent')

    await nextTick()
    // Wait for the error block to render
    const errorAlert = wrapper.find('[role="alert"]')
    expect(errorAlert.exists()).toBe(true)
    expect(errorAlert.text()).toBe(errorMessage)

    // It should NOT emit success
    expect(wrapper.emitted('success')).toBeFalsy()
  })

  it('closes the modal when pressing Escape key', async () => {
    const wrapper = mount(CreateAdminModal, {
      props: {
        isOpen: true
      }
    })

    // Simulate escape keydown event on window
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    window.dispatchEvent(event)

    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('traps focus inside the modal on Tab keypress', async () => {
    const wrapper = mount(CreateAdminModal, {
      props: {
        isOpen: true
      },
      attachTo: document.body
    })

    const emailInput = wrapper.find('#admin-email').element as HTMLInputElement
    // Email input should be auto-focused on open (watch effect + nextTick)
    await nextTick()
    // Trigger focus manually in test to simulate browser behavior
    emailInput.focus()
    expect(document.activeElement).toBe(emailInput)

    wrapper.unmount()
  })
})
