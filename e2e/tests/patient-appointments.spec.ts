import { test, expect } from '@playwright/test'
import { getAccessTokenFromPage, loginAs } from '../fixtures/auth'
import {
  ensureAlertableAppointment,
  ensureUpcomingAppointment,
  getSeedPractitionerId,
} from '../fixtures/appointments'

test.describe('Rendez-vous patient', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'patient')
  })

  test('réserver un rendez-vous', async ({ page, request }) => {
    const practitionerId = await getSeedPractitionerId(request)

    await page.goto(`/practitioner/${practitionerId}`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Réserver une consultation' }).click()

    const slotButton = page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first()
    await expect(slotButton).toBeVisible({ timeout: 20_000 })
    await slotButton.click()

    const bookingModal = page
      .locator('.fixed.inset-0')
      .filter({ hasText: 'Réserver un rendez-vous' })
    await expect(bookingModal.getByRole('heading', { name: 'Réserver un rendez-vous' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(bookingModal.getByText('Chargement des disponibilités...')).toBeHidden({
      timeout: 20_000,
    })

    const continueButton = bookingModal.getByRole('button', { name: 'Continuer' })
    await expect(continueButton).toBeEnabled({ timeout: 20_000 })
    for (let step = 0; step < 3; step += 1) {
      await continueButton.click()
      if (step < 2) {
        await expect(continueButton).toBeEnabled({ timeout: 10_000 })
      }
    }

    await bookingModal.getByRole('button', { name: 'Confirmer la réservation' }).click()
    await expect(bookingModal.getByText('Rendez-vous confirmé !')).toBeVisible({ timeout: 30_000 })

    await page.goto('/patient/appointments', { waitUntil: 'networkidle' })
    await expect(page.getByText('Dr. Marie Martin').first()).toBeVisible({ timeout: 15_000 })
  })

  test('voir ses rendez-vous', async ({ page, request }) => {
    const patientToken = await getAccessTokenFromPage(page)
    await ensureUpcomingAppointment(request, patientToken)

    await page.goto('/patient/appointments', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Mes rendez-vous' })).toBeVisible()
    await expect(page.getByText('Dr. Marie Martin').first()).toBeVisible({ timeout: 15_000 })
  })

  test('annuler un rendez-vous', async ({ page, request }) => {
    const patientToken = await getAccessTokenFromPage(page)
    await ensureUpcomingAppointment(request, patientToken)

    await page.goto('/patient/appointments', { waitUntil: 'networkidle' })
    await expect(page.getByText('Dr. Marie Martin').first()).toBeVisible({ timeout: 15_000 })

    const cancelButton = page.getByRole('button', { name: 'Annuler' }).first()
    await cancelButton.click()
    await expect(page.getByText('Annuler le rendez-vous')).toBeVisible()
    await page.locator('textarea, input[type="text"]').last().fill('Empêchement personnel')
    await page.getByRole('button', { name: /Oui, annuler/i }).click()

    await expect(page.getByText(/annulé/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('activer alerte créneau plus tôt', async ({ page, request }) => {
    const patientToken = await getAccessTokenFromPage(page)
    await ensureAlertableAppointment(request, patientToken)

    await page.goto('/patient/appointments', { waitUntil: 'networkidle' })
    await expect(page.getByText('Dr. Marie Martin').first()).toBeVisible({ timeout: 15_000 })

    const alertButton = page
      .getByRole('button', { name: /M'avertir si plus proche|Alerte activée/i })
      .first()
    await alertButton.click()
    await expect(page.getByRole('button', { name: 'Alerte activée' }).first()).toBeVisible({
      timeout: 10_000,
    })
  })
})
