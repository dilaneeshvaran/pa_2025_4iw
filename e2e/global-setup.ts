import { execSync } from 'node:child_process'

const apiBase = process.env.E2E_API_URL ?? 'http://localhost:3001/api'
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? ''

export default async function globalSetup() {
  // Flush Redis rate-limit keys
  for (const cmd of ['redis-cli -p 6380 FLUSHDB', 'docker exec redis-e2e redis-cli FLUSHDB']) {
    try {
      execSync(cmd, { stdio: 'ignore' })
      break
    } catch {}
  }

  // Cancel all patient upcoming appointments so the booking UI test starts clean.
  // Other tests recreate appointments as needed via ensureUpcomingAppointment.
  if (!E2E_PASSWORD) return

  try {
    const loginRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'patient@test.fr', password: E2E_PASSWORD }),
    })
    if (!loginRes.ok) return

    const { data } = (await loginRes.json()) as {
      data: { tokens: { accessToken: string } }
    }
    const token = data.tokens.accessToken

    const apptRes = await fetch(`${apiBase}/appointments/patient?status=upcoming&limit=50`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!apptRes.ok) return

    const { data: appts } = (await apptRes.json()) as { data: Array<{ id: string }> }
    await Promise.all(
      appts.map((appt) =>
        fetch(`${apiBase}/appointments/${appt.id}/cancel`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'E2E global-setup cleanup' }),
        }).catch(() => {}),
      ),
    )
  } catch {
    // Non-blocking
  }
}
