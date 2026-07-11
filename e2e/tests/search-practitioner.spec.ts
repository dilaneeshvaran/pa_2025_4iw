import { test, expect } from '@playwright/test'
import { acceptPublicConsentIfVisible } from '../fixtures/auth'

test.describe('Recherche de praticien', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search', { waitUntil: 'domcontentloaded' })
    await acceptPublicConsentIfVisible(page)
    await expect(page.getByRole('search')).toBeVisible()
  })

  test('recherche publique affiche des résultats', async ({ page }) => {
    await expect(page.getByText('Dr. Marie Martin')).toBeVisible({ timeout: 20_000 })
  })

  test('filtrer par spécialité', async ({ page }) => {
    await page.locator('#filter-specialty').selectOption({ label: 'Médecine Générale' })
    await expect(page.getByText('Dr. Marie Martin')).toBeVisible({ timeout: 20_000 })
  })

  test('voir profil praticien', async ({ page }) => {
    await expect(page.getByText('Dr. Marie Martin').first()).toBeVisible({ timeout: 20_000 })
    await acceptPublicConsentIfVisible(page)
    await page.getByRole('button', { name: 'Voir le profil' }).first().click()
    await expect(page).toHaveURL(/\/practitioner\//)
    await expect(page.getByRole('heading', { name: /Dr\. Marie Martin/i })).toBeVisible()
    await expect(page.getByText('Médecin généraliste pour les tests E2E.')).toBeVisible()
    await page.getByRole('button', { name: 'Localisation' }).click()
    await expect(page.getByText('Cabinet E2E Plateau')).toBeVisible()
  })

  test('voir créneaux disponibles', async ({ page }) => {
    await expect(page.getByText('Dr. Marie Martin').first()).toBeVisible({ timeout: 20_000 })
    await acceptPublicConsentIfVisible(page)
    await page.getByRole('button', { name: 'Voir le profil' }).first().click()
    await page.getByRole('button', { name: 'Réserver une consultation' }).click()
    await expect(page.getByText(/créneau/i).first()).toBeVisible({ timeout: 20_000 })
  })
})
