import { UnauthorizedException } from '@nestjs/common'
import { UserRole } from '@prisma/client'

import { PrismaService } from '../../../prisma/prisma.service'
import { JwtStrategy } from './jwt.strategy'

describe('JwtStrategy', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  }
  const configService = {
    get: jest.fn((key: string) =>
      key === 'JWT_SECRET' ? 'test-secret' : undefined,
    ),
  }
  let strategy: JwtStrategy

  beforeEach(() => {
    jest.clearAllMocks()
    strategy = new JwtStrategy(
      configService as never,
      prisma as unknown as PrismaService,
    )
  })

  it('autentica usuario ativo com tenant ativo usando dados atuais', async () => {
    mockUser()

    await expect(strategy.validate(stalePayload())).resolves.toEqual({
      userId: 'user-1',
      tenantId: 'tenant-current',
      role: UserRole.CASHIER,
      permissions: ['CURRENT_PERMISSION'],
    })
  })

  it('rejeita usuario inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue(null)

    await expect(strategy.validate(stalePayload())).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })

  it('rejeita usuario inativo', async () => {
    mockUser({ isActive: false })

    await expect(strategy.validate(stalePayload())).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })

  it('rejeita tenant inexistente', async () => {
    mockUser({ tenant: null })

    await expect(strategy.validate(stalePayload())).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })

  it('rejeita tenant inativo', async () => {
    mockUser({ tenant: { id: 'tenant-current', isActive: false } })

    await expect(strategy.validate(stalePayload())).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })

  it('usa role e permissions atuais em vez dos privilegios antigos do token', async () => {
    mockUser({
      role: UserRole.CLIENT_ADMIN,
      permissions: [],
    })

    const result = await strategy.validate(stalePayload())

    expect(result.role).toBe(UserRole.CLIENT_ADMIN)
    expect(result.permissions).toEqual([])
  })

  it('ignora tenantId adulterado no token', async () => {
    mockUser()

    const result = await strategy.validate({
      ...stalePayload(),
      tenantId: 'tenant-attacker',
    })

    expect(result.tenantId).toBe('tenant-current')
  })

  it('mantem conta Master ativa quando o tenant tecnico esta ativo', async () => {
    mockUser({
      role: UserRole.MASTER_OWNER,
      permissions: ['VIEW_FINANCIAL_DATA'],
    })

    const result = await strategy.validate(stalePayload())

    expect(result.role).toBe(UserRole.MASTER_OWNER)
    expect(result.tenantId).toBe('tenant-current')
  })

  function mockUser(overrides: Record<string, unknown> = {}) {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-current',
      role: UserRole.CASHIER,
      permissions: ['CURRENT_PERMISSION'],
      isActive: true,
      tenant: {
        id: 'tenant-current',
        isActive: true,
      },
      ...overrides,
    })
  }
})

function stalePayload() {
  return {
    sub: 'user-1',
    tenantId: 'tenant-stale',
    role: UserRole.MASTER_OWNER,
    permissions: ['STALE_PERMISSION'],
  }
}
