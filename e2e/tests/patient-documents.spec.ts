import { test, expect } from '@playwright/test'
import { loginAs } from '../fixtures/auth'

test.describe('Documents patient', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'patient')
  })

  test('voir documents reçus', async ({ page }) => {
    await page.goto('/patient/documents')
    await expect(page.getByRole('heading', { name: 'Mes documents' })).toBeVisible()
    await expect(page.getByText('Compte-rendu E2E')).toBeVisible({ timeout: 15_000 })
  })

  test('uploader un document via le dossier médical', async ({ page }) => {
    const docTitle = `Document E2E upload ${Date.now()}`

    await page.goto('/patient/medical-record', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Informations personnelles' })).toBeVisible({
      timeout: 20_000,
    })

    const documentsTab = page
      .getByRole('navigation', { name: 'Tabs' })
      .getByRole('button', { name: 'Documents de mon dossier' })
    await documentsTab.scrollIntoViewIfNeeded()
    await documentsTab.click()

    await expect(page.getByRole('heading', { name: 'Mes documents médicaux' })).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.locator('.animate-pulse').first()).toBeHidden({ timeout: 20_000 })

    await page.getByRole('button', { name: /Téléverser|Ajouter un document/ }).first().click()
    const uploadForm = page
      .getByRole('heading', { name: 'Téléverser un document' })
      .locator('..')
      .locator('form')
    await expect(uploadForm).toBeVisible()

    await uploadForm.getByPlaceholder('ex: Analyse de sang - Janvier 2026').fill(docTitle)
    await uploadForm.locator('input[type="file"]').setInputFiles({
      name: 'test-e2e.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 E2E test document'),
    })
    await expect(uploadForm.getByRole('button', { name: 'Téléverser', exact: true })).toBeEnabled()

    await uploadForm.getByRole('button', { name: 'Téléverser', exact: true }).click()
    await expect(page.getByText(docTitle).first()).toBeVisible({ timeout: 20_000 })
  })
})
