import { ConfigService } from '@nestjs/config';

import { WhatsAppEvolutionWebhookService } from './whatsapp-evolution-webhook.service';

describe('WhatsAppEvolutionWebhookService', () => {
  function setup(input?: { automationEnabled?: boolean }) {
    const prisma = {
      whatsAppConnection: {
        findFirst: jest.fn().mockResolvedValue({
          tenantId: 'tenant-1',
          instanceName: 'megas-loja',
          automationEnabled: input?.automationEnabled ?? true,
          tenant: {
            id: 'tenant-1',
            name: 'Loja Centro',
            slug: 'loja-centro',
          },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const evolution = {
      sendTextMessage: jest.fn().mockResolvedValue({ messageId: 'message-1' }),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'EVOLUTION_API_KEY') return 'evolution-api-key';
        if (key === 'EVOLUTION_WEBHOOK_SECRET') return 'webhook-secret';
        if (key === 'PUBLIC_WEB_URL') return 'https://megasfood.tech/';
        return undefined;
      }),
    };
    const service = new WhatsAppEvolutionWebhookService(
      prisma as never,
      evolution as never,
      config as unknown as ConfigService,
    );

    return { prisma, evolution, service };
  }

  it('responde saudacao recebida com o cardapio do tenant correto', async () => {
    const { evolution, service } = setup();

    await expect(
      service.handle(messagePayload({ text: 'Olá' }), 'evolution-api-key'),
    ).resolves.toEqual({
      received: true,
      handled: 'AUTO_REPLY_SENT',
    });

    expect(evolution.sendTextMessage).toHaveBeenCalledWith(
      'megas-loja',
      '5524999999999',
      [
        'Olá! Seja bem-vindo(a) à Loja Centro.',
        'Para fazer seu pedido, acesse nosso cardápio digital:',
        'https://megasfood.tech/c/loja-centro',
      ].join('\n'),
    );
  });

  it('ignora grupos, mensagens proprias e automacao desligada', async () => {
    const disabled = setup({ automationEnabled: false });
    await disabled.service.handle(
      messagePayload({ text: 'menu' }),
      'evolution-api-key',
    );
    expect(disabled.evolution.sendTextMessage).not.toHaveBeenCalled();

    const group = setup();
    await group.service.handle(
      messagePayload({ remoteJid: '123@g.us', text: 'menu' }),
      'evolution-api-key',
    );
    expect(group.evolution.sendTextMessage).not.toHaveBeenCalled();

    const fromMe = setup();
    await fromMe.service.handle(
      messagePayload({ fromMe: true, text: 'menu' }),
      'evolution-api-key',
    );
    expect(fromMe.evolution.sendTextMessage).not.toHaveBeenCalled();
  });

  it('atualiza a conexao sem tentar responder mensagens', async () => {
    const { prisma, evolution, service } = setup();

    await expect(
      service.handle(
        {
          event: 'connection.update',
          instance: 'megas-loja',
          data: {
            state: 'open',
            wuid: '5524888888888@s.whatsapp.net',
          },
        },
        'evolution-api-key',
      ),
    ).resolves.toEqual({
      received: true,
      handled: 'CONNECTION_UPDATE',
    });

    expect(prisma.whatsAppConnection.update).toHaveBeenCalledTimes(1);
    expect(evolution.sendTextMessage).not.toHaveBeenCalled();
  });

  it('nao propaga falha da Evolution para o webhook', async () => {
    const { evolution, service } = setup();
    evolution.sendTextMessage.mockRejectedValue(new Error('provider offline'));

    await expect(
      service.handle(messagePayload({ text: 'cardápio' }), 'evolution-api-key'),
    ).resolves.toEqual({
      received: true,
      handled: 'AUTO_REPLY_FAILED',
    });
  });

  it('autoriza a EVOLUTION_API_KEY enviada no payload', async () => {
    const { service } = setup();

    await expect(
      service.handle({
        ...messagePayload({ text: 'texto sem comando' }),
        apikey: 'evolution-api-key',
      }),
    ).resolves.toEqual({
      received: true,
      ignored: 'NO_MATCHING_COMMAND',
    });
  });

  it('rejeita webhook sem chave ou com chave invalida', async () => {
    const { service } = setup();

    await expect(
      service.handle(messagePayload({ text: 'menu' })),
    ).rejects.toThrow('Webhook Evolution nao autorizado.');
    await expect(
      service.handle(messagePayload({ text: 'menu' }), 'invalid-key'),
    ).rejects.toThrow('Webhook Evolution nao autorizado.');
    await expect(
      service.handle(messagePayload({ text: 'menu' }), 'webhook-secret'),
    ).rejects.toThrow('Webhook Evolution nao autorizado.');
  });
});

function messagePayload(input?: {
  text?: string;
  remoteJid?: string;
  fromMe?: boolean;
}) {
  return {
    event: 'messages.upsert',
    instance: 'megas-loja',
    data: {
      key: {
        id: 'message-1',
        remoteJid: input?.remoteJid ?? '5524999999999@s.whatsapp.net',
        fromMe: input?.fromMe ?? false,
      },
      message: {
        conversation: input?.text ?? 'oi',
      },
    },
  };
}
