import { DashboardSettingsService } from './dashboard-settings.service';

describe('DashboardSettingsService customization', () => {
  function setup(input?: {
    tenantName?: string;
    logoUrl?: string | null;
    settings?: unknown;
  }) {
    const tenant = {
      id: 'tenant-1',
      name: input?.tenantName ?? 'Demonstração Megas Food',
      logoUrl: input?.logoUrl ?? null,
      settings: input?.settings ?? null,
    };
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(tenant),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new DashboardSettingsService(prisma as never);

    return { prisma, service };
  }

  it('retorna override vazio e nome efetivo do tenant para loja nova', async () => {
    const { service } = setup();

    await expect(service.findCustomization('tenant-1')).resolves.toEqual(
      expect.objectContaining({
        brandName: '',
        tenantName: 'Demonstração Megas Food',
        effectiveBrandName: 'Demonstração Megas Food',
      }),
    );
  });

  it('usa posicao central para loja antiga sem configuracao', async () => {
    const { service } = setup();

    await expect(service.findCustomization('tenant-1')).resolves.toEqual(
      expect.objectContaining({
        coverPositionX: 50,
        coverPositionY: 50,
      }),
    );
  });

  it('normaliza e limita a posicao sem remover outros campos', async () => {
    const { prisma, service } = setup({
      settings: {
        customization: {
          coverUrl: 'https://cdn.example/cover.png',
          tagline: 'Sempre quentinha',
          coverPositionX: -20,
          coverPositionY: 180,
        },
      },
    });

    await expect(
      service.updateCustomization('tenant-1', {
        coverPositionX: null,
        coverPositionY: 120,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        coverPositionX: 50,
        coverPositionY: 100,
      }),
    );

    const settings = prisma.tenant.update.mock.calls[0][0].data.settings;
    expect(settings.customization).toEqual(
      expect.objectContaining({
        coverUrl: 'https://cdn.example/cover.png',
        tagline: 'Sempre quentinha',
        coverPositionX: 50,
        coverPositionY: 100,
      }),
    );
  });

  it('nao persiste tenant.name ao salvar personalizacao sem override', async () => {
    const { prisma, service } = setup();

    await service.updateCustomization('tenant-1', {
      logoUrl: 'https://cdn.example/logo.png',
      paletteId: 'hot-spicy',
    });

    const settings = prisma.tenant.update.mock.calls[0][0].data.settings;
    expect(settings.customization).toEqual(
      expect.objectContaining({
        logoUrl: 'https://cdn.example/logo.png',
        paletteId: 'hot-spicy',
      }),
    );
    expect(settings.customization).not.toHaveProperty('brandName');
  });

  it('respeita brandName preenchido como nome publico', async () => {
    const { prisma, service } = setup();

    await expect(
      service.updateCustomization('tenant-1', {
        brandName: '  Pizzaria da Praça  ',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        brandName: 'Pizzaria da Praça',
        effectiveBrandName: 'Pizzaria da Praça',
      }),
    );

    const settings = prisma.tenant.update.mock.calls[0][0].data.settings;
    expect(settings.customization.brandName).toBe('Pizzaria da Praça');
  });

  it('salva horarios em settings.delivery.openingHours sem criar outra fonte', async () => {
    const openingHours = {
      monday: { enabled: true, open: '18:00', close: '00:30' },
      tuesday: { enabled: true, open: '16:00', close: '01:30' },
    };
    const { prisma, service } = setup({
      settings: {
        delivery: {
          isDeliveryOpen: true,
          city: 'Sao Paulo',
          openingHours: {
            monday: { enabled: false, open: '', close: '' },
          },
        },
      },
    });

    await service.updateDelivery('tenant-1', { openingHours });

    const settings = prisma.tenant.update.mock.calls[0][0].data.settings;
    expect(settings.delivery.openingHours).toEqual(openingHours);
    expect(settings.openingHours).toBeUndefined();
  });

  it.each([[''], ['   '], [null]])(
    'remove override %p e volta para tenant.name',
    async (brandName) => {
      const { prisma, service } = setup({
        settings: {
          customization: {
            brandName: 'Nome público antigo',
            coverUrl: 'https://cdn.example/cover.png',
          },
        },
      });

      await expect(
        service.updateCustomization('tenant-1', { brandName }),
      ).resolves.toEqual(
        expect.objectContaining({
          brandName: '',
          effectiveBrandName: 'Demonstração Megas Food',
        }),
      );

      const settings = prisma.tenant.update.mock.calls[0][0].data.settings;
      expect(settings.customization).not.toHaveProperty('brandName');
      expect(settings.customization.coverUrl).toBe(
        'https://cdn.example/cover.png',
      );
    },
  );
});
