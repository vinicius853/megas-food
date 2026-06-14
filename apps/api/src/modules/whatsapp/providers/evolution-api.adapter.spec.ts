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

    await adapter.createInstance('Megas Loja / Centro');

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
    await expect(adapter.getConnectionStatus('megas-loja')).resolves.toEqual({
      state: 'open',
      connectedPhone: '5524999999999',
    });
  });
});
