import { ConfigService } from '@nestjs/config';

import { EvolutionApiAdapter } from './evolution-api.adapter';

describe('EvolutionApiAdapter', () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;
  let adapter: EvolutionApiAdapter;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    adapter = new EvolutionApiAdapter({
      get: jest.fn((key: string) => {
        if (key === 'EVOLUTION_API_URL') return 'https://evolution.example.com/';
        if (key === 'EVOLUTION_API_KEY') return 'secret-key';
        if (key === 'EVOLUTION_WEBHOOK_URL') {
          return 'https://api.megasfood.tech/whatsapp/evolution/webhook';
        }
        if (key === 'EVOLUTION_WEBHOOK_SECRET') return 'webhook-secret';
        return undefined;
      }),
    } as unknown as ConfigService);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('cria instancia sanitizada usando somente o backend', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ instance: { status: 'created' } }), {
        status: 201,
      }),
    );

    await expect(
      adapter.createInstance('Megas Loja / Centro'),
    ).resolves.toEqual({
      instance: {
        instanceName: 'megas-loja-centro',
        status: 'created',
        owner: undefined,
      },
      qrCode: {
        qrCodeBase64: undefined,
        qrCode: undefined,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://evolution.example.com/instance/create',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ apikey: 'secret-key' }),
        body: JSON.stringify({
          instanceName: 'megas-loja-centro',
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
        }),
      }),
    );
  });

  it('aproveita QR retornado na criacao da instancia', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          instance: {
            instanceName: 'megas-loja',
            status: 'created',
          },
          qrcode: {
            base64: 'data:image/png;base64,created-qr',
            code: 'created-code',
          },
        }),
        { status: 201 },
      ),
    );

    await expect(adapter.createInstance('megas-loja')).resolves.toEqual({
      instance: {
        instanceName: 'megas-loja',
        status: 'created',
        owner: undefined,
      },
      qrCode: {
        qrCodeBase64: 'created-qr',
        qrCode: 'created-code',
      },
    });
  });

  it('normaliza QR base64 mesmo quando vem aninhado', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          qrcode: {
            base64: 'data:image/png;base64,abc123',
            code: 'raw-code',
          },
        }),
        { status: 200 },
      ),
    );

    await expect(adapter.connectInstance('megas-loja')).resolves.toEqual({
      qrCodeBase64: 'abc123',
      qrCode: 'raw-code',
    });
  });

  it('normaliza lista de instancias e telefone conectado', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            instance: {
              instanceName: 'megas-loja',
              status: 'open',
              owner: '5524999999999@s.whatsapp.net',
            },
          },
        ]),
        { status: 200 },
      ),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          instance: {
            instanceName: 'megas-loja',
            state: 'open',
            owner: '5524999999999@s.whatsapp.net',
          },
        }),
        { status: 200 },
      ),
    );

    await expect(adapter.fetchInstances('megas-loja')).resolves.toEqual([
      {
        instanceName: 'megas-loja',
        status: 'open',
        owner: '5524999999999@s.whatsapp.net',
      },
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://evolution.example.com/instance/fetchInstances',
      expect.any(Object),
    );
    await expect(adapter.getConnectionStatus('megas-loja')).resolves.toEqual({
      state: 'open',
      connectedPhone: '5524999999999',
    });
  });

  it('configura webhook da instancia com eventos de mensagem e conexao', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await expect(adapter.configureWebhook('Megas Loja')).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://evolution.example.com/webhook/set/megas-loja',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ apikey: 'secret-key' }),
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: 'https://api.megasfood.tech/whatsapp/evolution/webhook?token=webhook-secret',
            byEvents: false,
            base64: false,
            events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
          },
        }),
      }),
    );
  });

  it('inclui endpoint status e body sanitizado quando provider responde erro', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 400,
          message: 'Bad Request',
          token: 'webhook-secret',
          response: {
            apikey: 'secret-key',
            message: 'Invalid webhook payload',
          },
        }),
        { status: 400, statusText: 'Bad Request' },
      ),
    );

    await expect(adapter.configureWebhook('megas-loja')).rejects.toThrow(
      'Evolution API POST /webhook/set/megas-loja respondeu 400 Bad Request: Bad Request | body={"status":400,"message":"Bad Request","token":"[redacted]","response":{"apikey":"[redacted]","message":"Invalid webhook payload"}}',
    );
  });

  it('anexa token com & quando URL do webhook ja possui query string', async () => {
    adapter = new EvolutionApiAdapter({
      get: jest.fn((key: string) => {
        if (key === 'EVOLUTION_API_URL') return 'https://evolution.example.com/';
        if (key === 'EVOLUTION_API_KEY') return 'secret-key';
        if (key === 'EVOLUTION_WEBHOOK_URL') {
          return 'https://api.megasfood.tech/whatsapp/evolution/webhook?source=evolution';
        }
        if (key === 'EVOLUTION_WEBHOOK_SECRET') return 'webhook-secret';
        return undefined;
      }),
    } as unknown as ConfigService);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    await adapter.configureWebhook('megas-loja');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://evolution.example.com/webhook/set/megas-loja',
      expect.objectContaining({
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: 'https://api.megasfood.tech/whatsapp/evolution/webhook?source=evolution&token=webhook-secret',
            byEvents: false,
            base64: false,
            events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
          },
        }),
      }),
    );
  });

  it('falha com mensagem clara quando webhook da Evolution nao esta configurado', async () => {
    adapter = new EvolutionApiAdapter({
      get: jest.fn((key: string) => {
        if (key === 'EVOLUTION_API_URL') return 'https://evolution.example.com/';
        if (key === 'EVOLUTION_API_KEY') return 'secret-key';
        return undefined;
      }),
    } as unknown as ConfigService);

    await expect(adapter.configureWebhook('megas-loja')).rejects.toThrow(
      'EVOLUTION_WEBHOOK_URL nao configurada.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
