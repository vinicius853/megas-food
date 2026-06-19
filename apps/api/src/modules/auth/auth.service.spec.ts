import { JwtService } from '@nestjs/jwt'
import { UserRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '../../prisma/prisma.service'
import { SubscriptionAccessService } from '../billing/subscription-access.service'
import { AuthService } from './auth.service'

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

describe('AuthService login', () => {
  const prisma = {
    user: {
      findMany: jest.fn(),
    },
  }
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
  }
  const subscriptionAccessService = {
    assertClientDashboardAccess: jest.fn(),
  }
  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwtService as unknown as JwtService,
    subscriptionAccessService as unknown as SubscriptionAccessService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    subscriptionAccessService.assertClientDashboardAccess.mockResolvedValue(
      undefined,
    )
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
  })

  it('retorna mensagem amigavel para email inexistente', async () => {
    prisma.user.findMany.mockResolvedValue([])

    await expect(service.login(loginDto())).rejects.toMatchObject({
      message: 'Email ou senha inválidos.',
    })
  })

  it('retorna mensagem amigavel para senha incorreta', async () => {
    mockUser()
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

    await expect(service.login(loginDto())).rejects.toMatchObject({
      message: 'Email ou senha inválidos.',
    })
  })

  it('retorna mensagem amigavel para usuario inativo', async () => {
    mockUser({ isActive: false })

    await expect(service.login(loginDto())).rejects.toMatchObject({
      message:
        'Sua conta está desativada. Entre em contato com o responsável pela loja ou com o suporte.',
    })
  })

  it('retorna mensagem amigavel para tenant inativo', async () => {
    mockUser({
      tenant: {
        ...tenant(),
        isActive: false,
      },
    })

    await expect(service.login(loginDto())).rejects.toMatchObject({
      message:
        'Esta loja está temporariamente desativada. Entre em contato com o suporte Megas Food.',
    })
  })

  it('mantem login de usuario ativo com tenant ativo', async () => {
    mockUser()

    await expect(service.login(loginDto())).resolves.toMatchObject({
      accessToken: 'signed-token',
      user: {
        id: 'user-1',
        role: UserRole.CLIENT_OWNER,
      },
      tenant: {
        id: 'tenant-1',
      },
    })
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      tenantId: 'tenant-1',
      role: UserRole.CLIENT_OWNER,
      permissions: [],
    })
  })

  function mockUser(overrides: Record<string, unknown> = {}) {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        tenantId: 'tenant-1',
        name: 'Usuario',
        email: 'user@example.com',
        password: 'hashed-password',
        role: UserRole.CLIENT_OWNER,
        permissions: [],
        isActive: true,
        tenant: tenant(),
        ...overrides,
      },
    ])
  }
})

function loginDto() {
  return {
    email: 'user@example.com',
    password: 'password',
  }
}

function tenant() {
  return {
    id: 'tenant-1',
    name: 'Tenant',
    slug: 'tenant',
    enabledSegments: ['PIZZARIA'],
    isActive: true,
  }
}
