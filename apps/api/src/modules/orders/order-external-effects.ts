type OrderLike = {
  customerName?: string | null;
};

export const LOAD_TEST_ORDER_PREFIX = '[LOAD_TEST]';

export function isLoadTestOrder(orderLike: OrderLike | null | undefined) {
  return (
    typeof orderLike?.customerName === 'string' &&
    orderLike.customerName
      .trimStart()
      .startsWith(LOAD_TEST_ORDER_PREFIX)
  );
}
