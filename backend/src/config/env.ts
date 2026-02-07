import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

if (!process.env.BACKEND_DATABASE_URL) {
  console.error('Failed to load BACKEND_DATABASE_URL from .env file')
  console.error('Current working directory:', process.cwd())
  console.error('Looking for .env at:', path.join(process.cwd(), '.env'))
}
