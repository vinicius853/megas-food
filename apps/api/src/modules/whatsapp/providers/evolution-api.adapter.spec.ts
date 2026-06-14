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
      get: jest.fn((key: string) =>
        key === 'EVOLUTION_API_URL'
          ? 'https://evolution.example.com/'
          : 'secret-key',
      ),
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
});
