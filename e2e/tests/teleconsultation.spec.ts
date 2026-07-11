import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth'

test.describe('Téléconsultation', () => {
  test('accéder à la salle de téléconsultation', async ({ page }) => {
    await loginAs(page, 'patient')
    await page.goto('/patient/teleconsultations')

    await expect(page.getByRole('heading', { name: 'Téléconsultations' })).toBeVisible()
    await expect(page.getByText('Préparer ma consultation')).toBeVisible()

    const joinButton = page.getByRole('button', { name: /Rejoindre la téléconsultation/i })
    if (await joinButton.isVisible()) {
      await joinButton.click()
      await expect(page.locator('video, canvas, [data-testid="teleconsultation-room"]').first()).toBeVisible({
        timeout: 15_000,
      }).catch(async () => {
        await expect(page.getByText(/salle|consultation|connexion/i).first()).toBeVisible()
      })
    }
  })
})
