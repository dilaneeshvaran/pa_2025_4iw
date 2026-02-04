import { FastifyInstance } from 'fastify'
import { z } from 'zod'


export async function routes(app: FastifyInstance) {
  app.get('/health', async () => {
    return { status: 'ok' }
  })

 app.post(
  '/users',
  {
    schema: {
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }),
    },
  },
  async (req) => {
    return req.body
  }
)
}
