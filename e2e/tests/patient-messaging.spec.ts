import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth'

test.describe('Messagerie patient', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'patient')
  })

  test('ouvrir une conversation', async ({ page }) => {
    await page.goto('/patient/messages')
    await expect(page.getByRole('heading', { name: 'Messagerie' })).toBeVisible()

    const conversation = page.getByText('Dr. Marie Martin').first()
    await expect(conversation).toBeVisible({ timeout: 15_000 })
    await conversation.click()

    await expect(page.getByText(/Bonjour docteur|Bonjour, je suis à votre écoute/i).first()).toBeVisible()
  })

  test('envoyer un message', async ({ page }) => {
    await page.goto('/patient/messages')
    await page.getByText('Dr. Marie Martin').first().click()

    const message = `Message E2E ${Date.now()}`
    const messageInput = page.getByPlaceholder('Votre message...')
    await messageInput.fill(message)
    await messageInput.press('Enter')

    await expect(page.locator('.whitespace-pre-wrap', { hasText: message })).toBeVisible({
      timeout: 15_000,
    })
  })
})
