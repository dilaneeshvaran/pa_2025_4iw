import { AdminUsersController } from '../admin-users.controller'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../admin-users.service', () => ({
  adminUsersService: {
    createAdmin: jest.fn(),
  },
}))

// ── Imports after mocks ─────────────────────────────────────────────────────

import { adminUsersService } from '../admin-users.service'

const mockService = adminUsersService as jest.Mocked<typeof adminUsersService>

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildReply() {
  const reply: any = {}
  reply.status = jest.fn().mockReturnValue(reply)
  reply.send = jest.fn().mockReturnValue(reply)
  return reply
}

function buildRequest(body: unknown = {}) {
  return { body, log: { error: jest.fn() } } as any
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AdminUsersController.createAdmin', () => {
  let controller: AdminUsersController

  beforeEach(() => {
    controller = new AdminUsersController()
    jest.clearAllMocks()
  })

  it('returns 201 on successful admin creation', async () => {
    const dto = {
      id: 'admin-1',
      email: 'newadmin@example.com',
      role: 'ADMIN',
      status: 'ACTIVE',
      fullName: 'newadmin@example.com',
      firstName: null,
      lastName: null,
      phone: null,
      emailVerified: true,
      lastLoginAt: null,
      createdAt: new Date(),
    }
    ;(mockService.createAdmin as jest.Mock).mockResolvedValue(dto)

    const req = buildRequest({ email: 'newadmin@example.com', password: 'Password1!' })
    const reply = buildReply()

    await controller.createAdmin(req, reply)

    expect(reply.status).toHaveBeenCalledWith(201)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    )
  })

  it('returns 400 when the email is already in use', async () => {
    ;(mockService.createAdmin as jest.Mock).mockRejectedValue(
      new Error('Un utilisateur avec cet email existe déjà'),
    )

    const req = buildRequest({ email: 'existing@example.com', password: 'Password1!' })
    const reply = buildReply()

    await controller.createAdmin(req, reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    )
  })

  it('returns 400 when the request body fails Zod validation', async () => {
    // Invalid body: missing password, invalid email
    const req = buildRequest({ email: 'not-an-email' })
    const reply = buildReply()

    await controller.createAdmin(req, reply)

    expect(reply.status).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    )
    // Service should NOT have been called
    expect(mockService.createAdmin).not.toHaveBeenCalled()
  })

  it('returns 500 on unexpected service error', async () => {
    ;(mockService.createAdmin as jest.Mock).mockRejectedValue(
      new Error('Unexpected DB failure'),
    )

    const req = buildRequest({ email: 'admin2@example.com', password: 'Password1!' })
    const reply = buildReply()

    await controller.createAdmin(req, reply)

    expect(reply.status).toHaveBeenCalledWith(500)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    )
  })
})
