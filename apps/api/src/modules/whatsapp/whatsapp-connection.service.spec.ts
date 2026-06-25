import { WhatsAppConnectionStatus } from '@prisma/client';

import { WhatsAppConnectionService } from './whatsapp-connection.service';

describe('WhatsAppConnectionService', () => {
  function setup(options?: {
    instances?: Array<{
      instanceName: string;
      status?: string;
      owner?: string;
    }>;
    connection?: {
      id: string;
      tenantId: string;
      instanceName: string;
      automationEnabled: boolean;
      status: WhatsAppConnectionStatus;
      connectedPhone: string | null;
      enabledEvents: [];
      lastError: string | null;
      lastConnectedAt: Date | null;
      provider: 'EVOLUTION_API';
      createdAt: Date;
      updatedAt: Date;
    };
    state?: string;
  }) {
    const defaultConnection = options?.connection ?? {
      id: 'connection-1',
      tenantId: 'tenant-1',
      instanceName: 'megas-loja-centro-tenant-1',
      automationEnabled: true,
      status: WhatsAppConnectionStatus.DISCONNECTED,
      connectedPhone: null,
      enabledEvents: [],
      lastError: null,
      lastConnectedAt: null,
      provider: 'EVOLUTION_API' as const,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant-1',
          slug: 'loja-centro',
        }),
      },
      whatsAppConnection: {
        findUnique: jest.fn().mockResolvedValue(options?.connection ?? null),
        upsert: jest.fn().mockResolvedValue({
          id: 'connection-1',
          tenantId: 'tenant-1',
          instanceName: 'megas-loja-centro-tenant-1',
        }),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...defaultConnection,
            ...data,
          }),
        ),
      },
    };
    const evolution = {
      isConfigured: jest.fn().mockReturnValue(true),
      sanitizeInstanceName: jest.fn((value: string) => value),
      fetchInstances: jest.fn().mockResolvedValue(options?.instances ?? []),
      createInstance: jest.fn().mockResolvedValue({
        instance: {
          instanceName: 'megas-loja-centro-tenant-1',
          status: 'created',
        },
        qrCode: {
          qrCodeBase64: 'base64-qr',
        },
      }),
      getConnectionStatus: jest
        .fn()
        .mockResolvedValue({ state: options?.state ?? 'close' }),
      connectInstance: jest
        .fn()
        .mockResolvedValue({ qrCodeBase64: 'base64-qr' }),
      configureWebhook: jest.fn().mockResolvedValue(undefined),
    };
    const service = new WhatsAppConnectionService(
      prisma as never,
      evolution as never,
    );

    return { prisma, evolution, service };
  }

  it('cria instancia ausente e retorna QR normalizado', async () => {
    const { prisma, evolution, service } = setup();

    await expect(service.getQrCode('tenant-1')).resolves.toEqual({
      status: 'QR_PENDING',
      instanceName: 'megas-loja-centro-tenant-1',
      qrCodeBase64: 'base64-qr',
      qrCode: undefined,
      message: 'Aguardando leitura do QR Code.',
    });

    expect(evolution.createInstance).toHaveBeenCalledTimes(1);
    expect(evolution.configureWebhook).toHaveBeenCalledWith(
      'megas-loja-centro-tenant-1',
    );
    expect(evolution.connectInstance).not.toHaveBeenCalled();
    expect(prisma.whatsAppConnection.update).toHaveBeenCalledWith({
      where: { id: 'connection-1' },
      data: {
        status: WhatsAppConnectionStatus.DISCONNECTED,
        connectedPhone: null,
        lastError: null,
      },
    });
  });

  it('usa connect como fallback quando a criacao nao retorna QR', async () => {
    const { evolution, service } = setup();
    evolution.createInstance.mockResolvedValue({
      instance: {
        instanceName: 'megas-loja-centro-tenant-1',
        status: 'created',
      },
      qrCode: {},
    });

    await expect(service.getQrCode('tenant-1')).resolves.toEqual(
      expect.objectContaining({
        status: 'QR_PENDING',
        qrCodeBase64: 'base64-qr',
      }),
    );

    expect(evolution.connectInstance).toHaveBeenCalledWith(
      'megas-loja-centro-tenant-1',
    );
    expect(evolution.configureWebhook).toHaveBeenCalledWith(
      'megas-loja-centro-tenant-1',
    );
  });

  it('reaproveita instancia conectada sem pedir novo QR', async () => {
    const { prisma, evolution, service } = setup({
      instances: [
        {
          instanceName: 'megas-loja-centro-tenant-1',
          status: 'open',
          owner: '5524999999999@s.whatsapp.net',
        },
      ],
      state: 'open',
    });

    await expect(service.getQrCode('tenant-1')).resolves.toEqual({
      status: 'CONNECTED',
      instanceName: 'megas-loja-centro-tenant-1',
      connectedPhone: '5524999999999',
      message: 'WhatsApp conectado.',
    });

    expect(evolution.createInstance).not.toHaveBeenCalled();
    expect(evolution.connectInstance).not.toHaveBeenCalled();
    expect(evolution.configureWebhook).toHaveBeenCalledWith(
      'megas-loja-centro-tenant-1',
    );
    expect(prisma.whatsAppConnection.update).toHaveBeenCalledWith({
      where: { id: 'connection-1' },
      data: expect.objectContaining({
        status: WhatsAppConnectionStatus.CONNECTED,
        connectedPhone: '5524999999999',
        lastError: null,
      }),
    });
  });

  it('prioriza status real close sobre status open listado e gera novo QR', async () => {
    const { prisma, evolution, service } = setup({
      instances: [
        {
          instanceName: 'megas-loja-centro-tenant-1',
          status: 'open',
          owner: '5524999999999@s.whatsapp.net',
        },
      ],
      state: 'close',
    });

    await expect(service.getQrCode('tenant-1')).resolves.toEqual({
      status: 'QR_PENDING',
      instanceName: 'megas-loja-centro-tenant-1',
      qrCodeBase64: 'base64-qr',
      qrCode: undefined,
      message: 'Aguardando leitura do QR Code.',
    });

    expect(evolution.getConnectionStatus).toHaveBeenCalledWith(
      'megas-loja-centro-tenant-1',
    );
    expect(evolution.connectInstance).toHaveBeenCalledWith(
      'megas-loja-centro-tenant-1',
    );
    expect(prisma.whatsAppConnection.update).toHaveBeenCalledWith({
      where: { id: 'connection-1' },
      data: {
        status: WhatsAppConnectionStatus.DISCONNECTED,
        connectedPhone: null,
        lastError: null,
      },
    });
  });

  it('sincroniza getSettings com status real desconectado da Evolution', async () => {
    const connectedAt = new Date('2026-01-01T00:00:00.000Z');
    const { evolution, service } = setup({
      connection: {
        id: 'connection-1',
        tenantId: 'tenant-1',
        instanceName: 'megas-loja-centro-tenant-1',
        automationEnabled: true,
        status: WhatsAppConnectionStatus.CONNECTED,
        connectedPhone: '5524999999999',
        enabledEvents: [],
        lastError: null,
        lastConnectedAt: connectedAt,
        provider: 'EVOLUTION_API',
        createdAt: connectedAt,
        updatedAt: connectedAt,
      },
      state: 'close',
    });

    await expect(service.getSettings('tenant-1')).resolves.toEqual(
      expect.objectContaining({
        automationEnabled: true,
        status: WhatsAppConnectionStatus.DISCONNECTED,
        connectedPhone: null,
        providerConfigured: true,
        qrCodeAvailable: true,
      }),
    );

    expect(evolution.getConnectionStatus).toHaveBeenCalledWith(
      'megas-loja-centro-tenant-1',
    );
  });

  it('retorna erro estavel quando o provider nao esta configurado', async () => {
    const { evolution, service } = setup();
    evolution.isConfigured.mockReturnValue(false);

    await expect(service.getQrCode('tenant-1')).resolves.toEqual({
      status: 'ERROR',
      instanceName: '',
      message:
        'Evolution API nao configurada no servidor. O envio manual continua disponivel.',
    });
  });
});
