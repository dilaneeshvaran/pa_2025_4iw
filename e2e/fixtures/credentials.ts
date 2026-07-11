function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}. Run "make e2e-up" to generate .env.e2e.`)
  }
  return value
}

export const E2E_PASSWORD = requireEnv('E2E_PASSWORD')
export const INVALID_LOGIN_PASSWORD = 'incorrect-login-value'

export const testUsers = {
  patient: {
    email: 'patient@test.fr',
    password: E2E_PASSWORD,
    dashboardPath: '/patient/dashboard',
  },
  practitioner: {
    email: 'praticien@test.fr',
    password: E2E_PASSWORD,
    dashboardPath: '/practitioner/dashboard',
    name: 'Dr. Marie Martin',
  },
  admin: {
    email: 'admin@test.fr',
    password: E2E_PASSWORD,
    dashboardPath: '/admin/dashboard',
  },
  staff: {
    email: 'staff@test.fr',
    password: E2E_PASSWORD,
    dashboardPath: '/staff/dashboard',
  },
} as const

export type TestUserRole = keyof typeof testUsers
