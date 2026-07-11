import { test, expect } from '@playwright/test'
import { fillInput, loginAs, loginViaUI, logout } from '../fixtures/auth'
import { E2E_PASSWORD, INVALID_LOGIN_PASSWORD } from '../fixtures/credentials'

test.describe('Authentification', () => {
  test('inscription patient', async ({ page }) => {
    const uniqueEmail = `e2e-patient-${Date.now()}@test.fr`

    await page.goto('/auth/register', { waitUntil: 'networkidle' })
    await fillInput(page, '#firstName', 'Test')
    await fillInput(page, '#lastName', 'Patient')
    await fillInput(page, '#email', uniqueEmail)
    await fillInput(page, '#phone', '+2250700000099')
    await fillInput(page, '#dateOfBirth', '1995-06-15')
    await page.locator('#gender').selectOption('MALE')
    await fillInput(page, '#password', E2E_PASSWORD)
    await fillInput(page, '#confirmPassword', E2E_PASSWORD)
    await page.locator('#agreeTerms').check()

    await page.getByRole('button', { name: "S'inscrire" }).click()

    await expect(page.getByRole('heading', { name: 'Inscription réussie !' })).toBeVisible({
      timeout: 20_000,
    })
  })

  test('connexion valide patient', async ({ page }) => {
    await loginViaUI(page, 'patient')
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
    await expect(page.getByText(/Bienvenue sur votre espace patient/i)).toBeVisible()
  })

  test('connexion échouée', async ({ page }) => {
    await page.goto('/auth/login', { waitUntil: 'networkidle' })
    await fillInput(page, '#email', 'patient@test.fr')
    await fillInput(page, '#password', INVALID_LOGIN_PASSWORD)

    await page.getByRole('button', { name: 'Se connecter' }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('mot de passe oublié', async ({ page }) => {
    await page.goto('/auth/forgot-password', { waitUntil: 'networkidle' })
    await fillInput(page, '#email', 'patient@test.fr')

    await page.getByRole('button', { name: /Envoyer le lien/i }).click()

    await expect(
      page.getByText(/email avec les instructions de réinitialisation/i),
    ).toBeVisible({ timeout: 20_000 })
  })

  test('déconnexion', async ({ page }) => {
    await loginAs(page, 'patient')
    await logout(page)
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
  })
})
