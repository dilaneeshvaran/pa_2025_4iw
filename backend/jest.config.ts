import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  watchman: false,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      diagnostics: false,
    },
  },
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@prisma/client$': '<rootDir>/src/__mocks__/prisma-client.ts',
    '^@medicote/shared$': '<rootDir>/src/__mocks__/external/medicote-shared.ts',
    '^@ts-rest/fastify$': '<rootDir>/src/__mocks__/external/ts-rest-fastify.ts',
    '^otplib$': '<rootDir>/src/__mocks__/external/otplib.ts',
    '^resend$': '<rootDir>/src/__mocks__/external/resend.ts',
  },
  clearMocks: true,
}

export default config
