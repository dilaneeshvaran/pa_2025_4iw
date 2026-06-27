import prisma from '../../config/database'
import { Prisma, UserRole, UserStatus } from '@prisma/client'

interface UserFilters {
  search?: string
  role?: UserRole
  status?: UserStatus
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Flattened representation returned to the admin UI. The display name lives in
// whichever profile the user owns (patient/practitioner/staff), or the cabinet
// for a CABINET_ADMIN; plain ADMIN accounts have no profile.
export interface AdminUserDto {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  fullName: string
  phone: string | null
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  lastLoginAt: Date | null
  createdAt: Date
}

const profileSelect = {
  patient: { select: { firstName: true, lastName: true, phone: true } },
  practitioner: { select: { firstName: true, lastName: true, phone: true } },
  staff: { select: { firstName: true, lastName: true, phone: true } },
  adminOfCabinet: { select: { name: true } },
} satisfies Prisma.UserInclude

type UserWithProfiles = Prisma.UserGetPayload<{ include: typeof profileSelect }>

function toDto(user: UserWithProfiles): AdminUserDto {
  const profile = user.patient ?? user.practitioner ?? user.staff ?? null

  let firstName: string | null = profile?.firstName ?? null
  let lastName: string | null = profile?.lastName ?? null

  // a cabinet admin is identified by the cabinet name rather than a person name
  if (!profile && user.adminOfCabinet) {
    firstName = user.adminOfCabinet.name
    lastName = null
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  return {
    id: user.id,
    email: user.email,
    firstName,
    lastName,
    fullName: fullName || user.email,
    phone: profile?.phone ?? null,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified !== null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  }
}

export class AdminUsersService {
  async getUsers(filters: UserFilters) {
    const {
      search,
      role,
      status,
      sortOrder = 'desc',
      page = 1,
      limit = 15,
    } = filters

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    }

    if (role) where.role = role
    if (status) where.status = status

    if (search) {
      const contains = { contains: search, mode: 'insensitive' as const }
      where.OR = [
        { email: contains },
        { patient: { OR: [{ firstName: contains }, { lastName: contains }] } },
        {
          practitioner: {
            OR: [{ firstName: contains }, { lastName: contains }],
          },
        },
        { staff: { OR: [{ firstName: contains }, { lastName: contains }] } },
        { adminOfCabinet: { name: contains } },
      ]
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100)
    const skip = (Math.max(page, 1) - 1) * safeLimit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: profileSelect,
        orderBy: { createdAt: sortOrder },
        skip,
        take: safeLimit,
      }),
      prisma.user.count({ where }),
    ])

    return {
      users: users.map(toDto),
      pagination: {
        page: Math.max(page, 1),
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    }
  }

  // counts per status, computed over non-deleted users, for the page header cards
  async getStats() {
    const [total, active, suspended, inactive, pending] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
      prisma.user.count({ where: { deletedAt: null, status: 'SUSPENDED' } }),
      prisma.user.count({ where: { deletedAt: null, status: 'INACTIVE' } }),
      prisma.user.count({
        where: { deletedAt: null, status: 'PENDING_VERIFICATION' },
      }),
    ])

    return { total, active, suspended, inactive, pending }
  }

  async getUserById(userId: string): Promise<AdminUserDto> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: profileSelect,
    })

    if (!user) {
      throw new Error('User not found')
    }

    return toDto(user)
  }

  async updateStatus(
    userId: string,
    status: UserStatus,
    actingAdminId: string,
  ): Promise<AdminUserDto> {
    if (userId === actingAdminId) {
      throw new Error('Cannot change your own status')
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, role: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // protect platform admins from being suspended/deactivated by a peer
    if (user.role === 'ADMIN' && status !== 'ACTIVE') {
      throw new Error('Cannot suspend an administrator account')
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status },
    })

    return this.getUserById(userId)
  }

  // soft-delete: keep the row (audit/relations) but flag it and free the email
  async deleteUser(userId: string, actingAdminId: string): Promise<void> {
    if (userId === actingAdminId) {
      throw new Error('Cannot delete your own account')
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, role: true, email: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role === 'ADMIN') {
      throw new Error('Cannot delete an administrator account')
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
        // release the unique email so the address can be reused later
        email: `deleted+${user.id}@medicote.deleted`,
      },
    })
  }
}

export const adminUsersService = new AdminUsersService()
