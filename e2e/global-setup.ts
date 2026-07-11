import { execSync } from 'node:child_process'

export default async function globalSetup() {
  const commands = ['redis-cli -p 6380 FLUSHDB', 'docker exec redis-e2e redis-cli FLUSHDB']

  for (const command of commands) {
    try {
      execSync(command, { stdio: 'ignore' })
      return
    } catch {
      // Try the next Redis cleanup strategy.
    }
  }
}
