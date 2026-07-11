import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth'
import { createPendingPractitionerRequest } from '../fixtures/admin'
import { E2E_PASSWORD } from '../fixtures/credentials'

test.describe('Administration', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
  })

  test('accès dashboard admin', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(
      page.getByRole('heading', { name: 'Tableau de bord administrateur' }),
    ).toBeVisible()
    await expect(page.getByText('Rendez-vous ce mois')).toBeVisible()
    await expect(page.locator('.animate-pulse').first()).toBeHidden({ timeout: 15_000 })
  })

  test('lister les utilisateurs', async ({ page }) => {
    await page.goto('/admin/users', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Gestion utilisateurs' })).toBeVisible()

    const selects = page.locator('select')
    await selects.nth(0).selectOption('PATIENT')
    await selects.nth(1).selectOption('ACTIVE')

    await expect(
      page.locator('table tbody tr').filter({ hasText: 'patient@test.fr' }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('créer un admin', async ({ page }) => {
    const adminEmail = `e2e-admin-${Date.now()}@test.fr`

    await page.goto('/admin/users', { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Créer admin' }).click()
    await expect(page.locator('#admin-email')).toBeVisible({ timeout: 15_000 })

    await page.locator('#admin-email').fill(adminEmail)
    await page.locator('#admin-password').fill(E2E_PASSWORD)
    await page.getByRole('button', { name: 'Créer le compte' }).click()

    await expect(page.getByText(adminEmail).first()).toBeVisible({ timeout: 15_000 })
  })

  test('valider un praticien', async ({ page }) => {
    const pending = await createPendingPractitionerRequest(page.request)

    await page.goto('/admin/validations')
    await expect(
      page.getByRole('heading', { name: /Demandes d'inscription professionnelle/i }),
    ).toBeVisible()

    await expect(page.getByText(pending.lastName)).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Approuver' }).first().click()
    await expect(page.getByRole('heading', { name: 'Approuver la demande' })).toBeVisible()
    await page.getByRole('button', { name: "Confirmer l'approbation" }).click()

    await page.getByRole('button', { name: 'Approuvés' }).click()
    await expect(page.getByText(pending.lastName)).toBeVisible({ timeout: 15_000 })
  })
})
