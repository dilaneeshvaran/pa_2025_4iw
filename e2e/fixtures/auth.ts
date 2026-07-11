import { type Page, expect } from '@playwright/test'
import { testUsers, type TestUserRole } from './credentials'

const apiBase = process.env.E2E_API_URL ?? 'http://localhost:3001/api'
const PUBLIC_CONSENT_STORAGE_KEY = 'medicote_public_consent_given'

function decodeJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'),
    ) as { exp?: number }
    return payload.exp ?? null
  } catch {
    return null
  }
}

async function fillInput(page: Page, selector: string, value: string) {
  const input = page.locator(selector)
  await expect(input).toBeVisible()
  await input.click()
  await input.fill(value)
  await expect(input).toHaveValue(value)
}

async function seedBrowserSession(
  page: Page,
  userData: {
    id: string
    email: string
    role: string
    status: string
    emailVerified: boolean
    firstName?: string | null
    lastName?: string | null
  },
  tokens: { accessToken: string; refreshToken: string },
) {
  const exp = decodeJwtExp(tokens.accessToken)

  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ({ user, accessToken, refreshToken, tokenExpiresAt, publicConsentKey }) => {
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))
      if (tokenExpiresAt) {
        localStorage.setItem('tokenExpiresAt', String(tokenExpiresAt))
      }

      localStorage.setItem(publicConsentKey, 'true')
      localStorage.setItem(`medicote_consent_given_${user.id}`, 'true')

      const cookieBase = 'path=/; SameSite=Lax'
      document.cookie = `sb-authenticated=true; ${cookieBase}`
      document.cookie = `sb-auth-role=${user.role}; ${cookieBase}`
      document.cookie = `sb-email-verified=${user.emailVerified ? 'true' : 'false'}; ${cookieBase}`
    },
    {
      user: userData,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: exp,
      publicConsentKey: PUBLIC_CONSENT_STORAGE_KEY,
    },
  )
}

export async function dismissConsentBanner(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Consentement au traitement des données' })

  try {
    await dialog.waitFor({ state: 'visible', timeout: 5_000 })
  } catch {
    return
  }

  await page.getByRole('button', { name: 'Accepter' }).click()
  await dialog.waitFor({ state: 'hidden', timeout: 15_000 })
}

export async function acceptPublicConsentIfVisible(page: Page) {
  await dismissConsentBanner(page)
}

export async function loginAs(page: Page, role: TestUserRole) {
  const user = testUsers[role]

  const response = await page.request.post(`${apiBase}/auth/login`, {
    data: {
      email: user.email,
      password: user.password,
    },
  })

  if (!response.ok()) {
    throw new Error(
      `E2E login API failed for ${user.email}: ${response.status()} ${await response.text()}`,
    )
  }

  const body = await response.json()
  await seedBrowserSession(page, body.data.user, body.data.tokens)
  await page.goto(user.dashboardPath, { waitUntil: 'domcontentloaded' })
  await dismissConsentBanner(page)

  await expect(page).toHaveURL(new RegExp(user.dashboardPath.replace('/', '\\/')), {
    timeout: 20_000,
  })
}

export async function loginViaUI(page: Page, role: TestUserRole) {
  const user = testUsers[role]

  await page.goto('/auth/login', { waitUntil: 'networkidle' })
  await fillInput(page, '#email', user.email)
  await fillInput(page, '#password', user.password)

  await Promise.all([
    page.waitForURL(new RegExp(user.dashboardPath.replace('/', '\\/')), { timeout: 30_000 }),
    page.getByRole('button', { name: 'Se connecter' }).click(),
  ])

  await dismissConsentBanner(page)
}

export async function logout(page: Page) {
  await dismissConsentBanner(page)
  await page.getByRole('button', { name: 'Déconnexion' }).click()
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 })
}

export async function getAccessTokenFromPage(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('accessToken'))
  if (!token) {
    throw new Error('Missing access token in browser session')
  }
  return token
}

export { fillInput }
