import { test, expect } from '@playwright/test'
import { getAccessTokenFromPage, loginAs } from '../fixtures/auth'
import { ensurePatientPractitionerLink } from '../fixtures/appointments'
import { testUsers, E2E_PASSWORD } from '../fixtures/credentials'

const apiBase = process.env.E2E_API_URL ?? 'http://localhost:3001/api'

test.describe('Patients praticien', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAs(page, 'practitioner')
    const practitionerToken = await getAccessTokenFromPage(page)

    const patientLogin = await request.post(`${apiBase}/auth/login`, {
      data: { email: testUsers.patient.email, password: E2E_PASSWORD },
    })
    const patientToken = (await patientLogin.json()).data.tokens.accessToken as string

    await ensurePatientPractitionerLink(request, practitionerToken, patientToken)
  })

  test('voir liste patients', async ({ page }) => {
    await page.goto('/practitioner/patients', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Patients' })).toBeVisible()
    await page.getByPlaceholder('Nom, téléphone ou email...').fill('Jean Dupont')
    await expect(page.getByText('Jean Dupont').first()).toBeVisible({ timeout: 15_000 })
  })

  test('ouvrir dossier médical patient', async ({ page }) => {
    await page.goto('/practitioner/patients', { waitUntil: 'networkidle' })
    await page.getByPlaceholder('Nom, téléphone ou email...').fill('Jean Dupont')
    await expect(page.getByText('Jean Dupont').first()).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Dossier' }).first().click()

    await expect(page).toHaveURL(/\/medical-record/)
    await expect(page.getByText(/dossier médical|Informations/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })
})
