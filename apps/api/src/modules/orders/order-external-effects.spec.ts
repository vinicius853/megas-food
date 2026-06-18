import { isLoadTestOrder } from './order-external-effects';

describe('isLoadTestOrder', () => {
  it.each([
    '[LOAD_TEST] Pedido 1',
    '   [LOAD_TEST] Pedido 2',
    '\t[LOAD_TEST]',
  ])('identifica pedido de carga: %s', (customerName) => {
    expect(isLoadTestOrder({ customerName })).toBe(true);
  });

  it.each([
    'Cliente real',
    '[load_test] Pedido',
    'Cliente [LOAD_TEST]',
    '',
    null,
    undefined,
  ])('nao identifica pedido comum: %s', (customerName) => {
    expect(isLoadTestOrder({ customerName })).toBe(false);
  });
});
