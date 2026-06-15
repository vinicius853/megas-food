import { UnauthorizedException } from '@nestjs/common';

import { WhatsAppEvolutionWebhookController } from './whatsapp-evolution-webhook.controller';

describe('WhatsAppEvolutionWebhookController', () => {
  function setup() {
    const webhookService = {
      handle: jest.fn().mockResolvedValue({ received: true }),
    };
    const controller = new WhatsAppEvolutionWebhookController(
      webhookService as never,
    );

    return { controller, webhookService };
  }

  it('aceita apikey no corpo e remove a chave antes do processamento', async () => {
    const { controller, webhookService } = setup();
    const payload = {
      apikey: 'evolution-key',
      event: 'messages.upsert',
      instance: 'tenant-instance',
      data: {},
    };

    await controller.handleWebhook(payload);

    expect(webhookService.handle).toHaveBeenCalledWith(
      {
        event: 'messages.upsert',
        instance: 'tenant-instance',
        data: {},
      },
      ['evolution-key'],
    );
    expect(payload.apikey).toBe('evolution-key');
  });

  it.each([
    ['apikey', ['evolution-key', undefined, undefined, undefined]],
    ['x-api-key', [undefined, 'evolution-key', undefined, undefined]],
  ])('repassa credencial recebida no header %s', async (_, headers) => {
    const { controller, webhookService } = setup();

    await controller.handleWebhook(
      { event: 'messages.upsert', instance: 'tenant-instance' },
      headers[0],
      headers[1],
      headers[2],
      headers[3],
    );

    expect(webhookService.handle).toHaveBeenCalledWith(
      { event: 'messages.upsert', instance: 'tenant-instance' },
      ['evolution-key'],
    );
  });

  it('mantem a rejeicao do service quando nenhuma chave e enviada', async () => {
    const webhookService = {
      handle: jest
        .fn()
        .mockRejectedValue(
          new UnauthorizedException('Webhook Evolution nao autorizado.'),
        ),
    };
    const controller = new WhatsAppEvolutionWebhookController(
      webhookService as never,
    );

    await expect(
      controller.handleWebhook({
        event: 'messages.upsert',
        instance: 'tenant-instance',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
