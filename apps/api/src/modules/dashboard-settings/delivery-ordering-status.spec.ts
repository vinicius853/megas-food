import {
  ORDERING_CLOSED_MESSAGE,
  ORDERING_PAUSED_MESSAGE,
  resolveDeliveryOrderingStatus,
} from './delivery-ordering-status';

describe('resolveDeliveryOrderingStatus', () => {
  it('permite pedido dentro do horario normal usando America/Sao_Paulo', () => {
    const status = resolveDeliveryOrderingStatus(
      settingsWithHours({
        monday: { enabled: true, open: '18:00', close: '23:30' },
      }),
      saoPauloDate('2026-06-22T19:00:00'),
    );

    expect(status).toEqual({ canAcceptOrders: true });
  });

  it('bloqueia pedido fora do horario configurado', () => {
    const status = resolveDeliveryOrderingStatus(
      settingsWithHours({
        monday: { enabled: true, open: '18:00', close: '23:30' },
      }),
      saoPauloDate('2026-06-22T15:00:00'),
    );

    expect(status).toEqual({
      canAcceptOrders: false,
      reason: 'OUTSIDE_HOURS',
      message: ORDERING_CLOSED_MESSAGE,
    });
  });

  it('permite horario 18:00 - 00:30 antes da meia-noite', () => {
    const status = resolveDeliveryOrderingStatus(
      settingsWithHours({
        monday: { enabled: true, open: '18:00', close: '00:30' },
      }),
      saoPauloDate('2026-06-22T23:45:00'),
    );

    expect(status.canAcceptOrders).toBe(true);
  });

  it('permite horario 18:00 - 00:30 depois da meia-noite pelo expediente anterior', () => {
    const status = resolveDeliveryOrderingStatus(
      settingsWithHours({
        monday: { enabled: true, open: '18:00', close: '00:30' },
        tuesday: { enabled: false, open: '', close: '' },
      }),
      saoPauloDate('2026-06-23T00:15:00'),
    );

    expect(status.canAcceptOrders).toBe(true);
  });

  it('bloqueia depois do fechamento do expediente que cruza a meia-noite', () => {
    const status = resolveDeliveryOrderingStatus(
      settingsWithHours({
        monday: { enabled: true, open: '18:00', close: '00:30' },
        tuesday: { enabled: false, open: '', close: '' },
      }),
      saoPauloDate('2026-06-23T00:31:00'),
    );

    expect(status).toEqual({
      canAcceptOrders: false,
      reason: 'OUTSIDE_HOURS',
      message: ORDERING_CLOSED_MESSAGE,
    });
  });

  it('permite horario 16:00 - 01:30 corretamente', () => {
    const status = resolveDeliveryOrderingStatus(
      settingsWithHours({
        monday: { enabled: true, open: '16:00', close: '01:30' },
        tuesday: { enabled: false, open: '', close: '' },
      }),
      saoPauloDate('2026-06-23T01:20:00'),
    );

    expect(status.canAcceptOrders).toBe(true);
  });

  it('bloqueia com mensagem de pausa quando a loja esta pausada manualmente', () => {
    const status = resolveDeliveryOrderingStatus({
      delivery: {
        isDeliveryOpen: false,
        openingHours: {
          monday: { enabled: true, open: '00:00', close: '23:59' },
        },
      },
    });

    expect(status).toEqual({
      canAcceptOrders: false,
      reason: 'MANUAL_PAUSE',
      message: ORDERING_PAUSED_MESSAGE,
    });
  });
});

function settingsWithHours(openingHours: Record<string, unknown>) {
  return {
    delivery: {
      isDeliveryOpen: true,
      openingHours,
    },
  };
}

function saoPauloDate(localIsoWithoutOffset: string) {
  return new Date(`${localIsoWithoutOffset}-03:00`);
}
