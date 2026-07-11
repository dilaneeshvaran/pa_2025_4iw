import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth'

test.describe('Dossier médical patient', () => {
  test('voir son dossier médical', async ({ page }) => {
    await loginAs(page, 'patient')
    await page.goto('/patient/medical-record')

    await expect(page.getByRole('heading', { name: 'Mon dossier médical' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Informations personnelles' })).toBeVisible()
    await expect(page.getByText('Jean Dupont')).toBeVisible({ timeout: 15_000 })
  })
})
