export const initServer = jest.fn(() => ({
  router: jest.fn((_contract, implementation) => implementation),
  plugin: jest.fn((router) => async (fastify: any) => {
    fastify.tsRestRouter = router
  }),
}))
