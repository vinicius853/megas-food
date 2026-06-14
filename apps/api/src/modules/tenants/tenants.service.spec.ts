import { UserRole } from '@prisma/client';

import { TenantsService } from './tenants.service';

describe('TenantsService commercial listings', () => {
  function setup() {
    const prisma = {
      tenant: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new TenantsService(prisma as never, {} as never);

    return { prisma, service };
  }

  it('lista somente tenants que possuem CLIENT_OWNER', async () => {
    const { prisma, service } = setup();

    await service.findCommercial();

    expect(prisma.tenant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {},
            {
              users: {
                some: {
                  role: UserRole.CLIENT_OWNER,
                },
              },
            },
          ],
        },
      }),
    );
  });

  it('mantem a consulta tecnica por id disponivel para administracao interna', async () => {
    const { prisma, service } = setup();

    await expect(service.findOne('internal-tenant')).rejects.toThrow(
      'Cliente nao encontrado.',
    );

    expect(prisma.tenant.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'internal-tenant',
        },
      }),
    );
  });
});
