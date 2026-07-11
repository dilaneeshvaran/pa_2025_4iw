import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth'

test.describe('Dashboard praticien', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'practitioner')
  })

  test('accès dashboard', async ({ page }) => {
    await page.goto('/practitioner/dashboard')
    await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible()
    await expect(page.locator('.animate-pulse').first()).toBeHidden({ timeout: 15_000 })
  })

  test('voir l\'agenda', async ({ page }) => {
    await page.goto('/practitioner/agenda')
    await expect(page.getByRole('heading', { name: 'Agenda' })).toBeVisible()
    await page.getByRole('button', { name: 'Calendrier' }).click()
    await expect(page.getByText(/Semaine|Mois|Jour/).first()).toBeVisible()
  })

  test('gérer disponibilités', async ({ page }) => {
    await page.goto('/practitioner/agenda', { waitUntil: 'networkidle' })
    await page
      .locator('main')
      .locator('button')
      .filter({ hasText: 'Paramètres' })
      .click()
    await expect(page.getByRole('heading', { name: 'Horaires de travail' })).toBeVisible({
      timeout: 30_000,
    })

    const saturdayRow = page.locator('div').filter({ hasText: /^Samedi/ }).first()
    const saturdayCheckbox = saturdayRow.getByRole('checkbox')
    const wasActive = await saturdayCheckbox.isChecked()

    await saturdayCheckbox.setChecked(!wasActive)

    if (!wasActive) {
      await expect(saturdayRow.getByText('09:00').first()).toBeVisible()
    } else {
      await expect(saturdayRow.getByText('Repos')).toBeVisible()
    }

    await saturdayCheckbox.setChecked(wasActive)
  })
})
