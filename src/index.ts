import app from './server'
import 'dotenv/config'

const start = async () => {
  try {
    const address = await app.listen({
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || '0.0.0.0',
    })
    console.log(
      `Server listening at \x1b[34m${address.replace('0.0.0.0', 'localhost')}\x1b[0m`,
    )
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
