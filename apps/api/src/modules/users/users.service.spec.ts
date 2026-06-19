import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UsersService } from './users.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('UsersService RBAC', () => {
  let lastCreateInput: unknown;
  let createResult: unknown;
  const createUser = jest.fn((input: unknown): Promise<unknown> => {
    lastCreateInput = input;
    return Promise.resolve(createResult);
  });
  const prisma = {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: createUser,
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const auditLogsService = {
    create: jest.fn(),
  };
  const service = new UsersService(
    prisma as unknown as PrismaService,
    auditLogsService as unknown as AuditLogsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    lastCreateInput = undefined;
    createResult = undefined;
  });

  it('forca CLIENT_OWNER a criar usuario no tenant do JWT', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    createResult = {
      id: 'user-2',
      tenantId: 'tenant-owner',
      name: 'Operador',
      email: 'operador@example.com',
      role: UserRole.CASHIER,
      permissions: [],
      isActive: true,
      createdAt: new Date(),
    };

    await service.create(
      {
        tenantId: 'tenant-atacante',
        name: 'Operador',
        email: 'operador@example.com',
        password: 'senha-segura',
        role: UserRole.CASHIER,
      },
      {
        userId: 'owner-1',
        tenantId: 'tenant-owner',
        role: UserRole.CLIENT_OWNER,
      },
    );

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-owner',
        email: 'operador@example.com',
      },
    });
    expect(lastCreateInput).toMatchObject({
      data: {
        tenantId: 'tenant-owner',
        role: UserRole.CASHIER,
        permissions: [],
      },
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('senha-segura', 10);
  });

  it.each([
    UserRole.MASTER_OWNER,
    UserRole.MASTER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT,
  ])('impede CLIENT_OWNER de criar role %s', async (role) => {
    await expect(
      service.create(
        {
          name: 'Usuario indevido',
          email: 'indevido@example.com',
          password: 'senha-segura',
          role,
        },
        {
          userId: 'owner-1',
          tenantId: 'tenant-owner',
          role: UserRole.CLIENT_OWNER,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('impede CLIENT_OWNER de atribuir permissions arbitrarias', async () => {
    await expect(
      service.create(
        {
          name: 'Usuario indevido',
          email: 'indevido@example.com',
          password: 'senha-segura',
          role: UserRole.CASHIER,
          permissions: ['VIEW_FINANCIAL_DATA'],
        },
        {
          userId: 'owner-1',
          tenantId: 'tenant-owner',
          role: UserRole.CLIENT_OWNER,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('restringe a listagem de CLIENT_OWNER ao tenant do JWT', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    await service.findAll({
      userId: 'owner-1',
      tenantId: 'tenant-owner',
      role: UserRole.CLIENT_OWNER,
    });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-owner',
        },
      }),
    );
  });

  it('bloqueia busca e update cross-tenant para CLIENT_OWNER', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.update(
        'user-outro-tenant',
        {
          role: UserRole.CASHIER,
        },
        {
          userId: 'owner-1',
          tenantId: 'tenant-owner',
          role: UserRole.CLIENT_OWNER,
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'user-outro-tenant',
          tenantId: 'tenant-owner',
        },
      }),
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('preserva criacao global para role Master', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    createResult = {
      id: 'master-2',
      tenantId: 'tenant-destino',
      name: 'Master',
      email: 'master@example.com',
      role: UserRole.MASTER_ADMIN,
      permissions: ['VIEW_FINANCIAL_DATA'],
      isActive: true,
      createdAt: new Date(),
    };

    await service.create(
      {
        tenantId: 'tenant-destino',
        name: 'Master',
        email: 'master@example.com',
        password: 'senha-segura',
        role: UserRole.MASTER_ADMIN,
        permissions: ['VIEW_FINANCIAL_DATA'],
      },
      {
        userId: 'master-owner',
        role: UserRole.MASTER_OWNER,
      },
    );

    expect(lastCreateInput).toMatchObject({
      data: {
        tenantId: 'tenant-destino',
        role: UserRole.MASTER_ADMIN,
        permissions: ['VIEW_FINANCIAL_DATA'],
      },
    });
  });
});
