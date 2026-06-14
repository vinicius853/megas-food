import { WhatsAppConnectionStatus } from '@prisma/client';

import { WhatsAppConnectionService } from './whatsapp-connection.service';

describe('WhatsAppConnectionService', () => {
  function setup(options?: {
    instances?: Array<{
      instanceName: string;
      status?: string;
      owner?: string;
    }>;
    state?: string;
  }) {
    const prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'tenant-1',
          slug: 'loja-centro',
        }),
      },
      whatsAppConnection: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({
          id: 'connection-1',
          tenantId: 'tenant-1',
          instanceName: 'megas-loja-centro-tenant-1',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const evolution = {
      isConfigured: jest.fn().mockReturnValue(true),
      sanitizeInstanceName: jest.fn((value: string) => value),
      fetchInstances: jest.fn().mockResolvedValue(options?.instances ?? []),
      createInstance: jest.fn().mockResolvedValue({}),
      getConnectionStatus: jest
        .fn()
        .mockResolvedValue({ state: options?.state ?? 'close' }),
      connectInstance: jest
        .fn()
        .mockResolvedValue({ qrCodeBase64: 'base64-qr' }),
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
    expect(prisma.whatsAppConnection.update).toHaveBeenCalledWith({
      where: { id: 'connection-1' },
      data: expect.objectContaining({
        status: WhatsAppConnectionStatus.CONNECTED,
        connectedPhone: '5524999999999',
        lastError: null,
      }),
    });
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
