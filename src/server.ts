import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { routes } from './routes'
import prisma from './config/database'

const app = Fastify({
  logger: {
    level: 'error',
  },
})
  .setValidatorCompiler(validatorCompiler)
  .setSerializerCompiler(serializerCompiler)
  .withTypeProvider<ZodTypeProvider>()

app.register(routes)

app.addHook('onClose', async () => {
  await prisma.$disconnect()
})

export default app
