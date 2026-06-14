import { WhatsAppConnectionStatus, WhatsAppEventType } from '@prisma/client';

import { canUseAutomaticWhatsAppNotification } from './whatsapp-automation-policy';

describe('canUseAutomaticWhatsAppNotification', () => {
  const connection = {
    automationEnabled: true,
    status: WhatsAppConnectionStatus.CONNECTED,
    instanceName: 'megas-tenant-1',
    enabledEvents: [WhatsAppEventType.ORDER_CONFIRMED],
  };

  it('permite apenas conexao pronta com evento habilitado', () => {
    expect(
      canUseAutomaticWhatsAppNotification(
        connection,
        WhatsAppEventType.ORDER_CONFIRMED,
        true,
      ),
    ).toBe(true);
  });

  it.each([
    [{ ...connection, automationEnabled: false }, true],
    [{ ...connection, status: WhatsAppConnectionStatus.DISCONNECTED }, true],
    [{ ...connection, instanceName: null }, true],
    [{ ...connection, enabledEvents: [] }, true],
    [connection, false],
  ])('bloqueia quando um requisito nao esta pronto', (input, configured) => {
    expect(
      canUseAutomaticWhatsAppNotification(
        input,
        WhatsAppEventType.ORDER_CONFIRMED,
        configured,
      ),
    ).toBe(false);
  });
});
