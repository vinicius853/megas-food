import assert from "node:assert/strict";

import {
  getBestSellers,
  getOrderItems,
  type DashboardOrder,
} from "./dashboard-data";

function run() {
  ignoresOrdersWithoutItems();
  ignoresNullItems();
  ignoresInvalidItems();
  calculatesValidOrders();
  handlesEmptyOrders();
}

function ignoresOrdersWithoutItems() {
  const order = dashboardOrder();

  assert.deepEqual(getBestSellers([order]), []);
  assert.deepEqual(getOrderItems(order), []);
}

function ignoresNullItems() {
  const order = dashboardOrder({ items: null });

  assert.deepEqual(getBestSellers([order]), []);
  assert.deepEqual(getOrderItems(order), []);
}

function ignoresInvalidItems() {
  const order = dashboardOrder({
    items: [null, undefined] as unknown as DashboardOrder["items"],
  });

  assert.deepEqual(getBestSellers([order]), []);
}

function calculatesValidOrders() {
  const orders = [
    dashboardOrder({
      items: [
        { id: "item-1", name: "Calabresa", quantity: 2 },
        { id: "item-2", name: "Mussarela", quantity: 1 },
      ],
    }),
    dashboardOrder({
      id: "order-2",
      items: [{ id: "item-3", name: "Calabresa", quantity: 3 }],
    }),
  ];

  assert.deepEqual(getBestSellers(orders), [
    { name: "Calabresa", quantity: 5 },
    { name: "Mussarela", quantity: 1 },
  ]);
}

function handlesEmptyOrders() {
  assert.deepEqual(getBestSellers([]), []);
}

function dashboardOrder(
  overrides: Partial<DashboardOrder> = {},
): DashboardOrder {
  return {
    id: "order-1",
    status: "PENDING",
    total: 40,
    createdAt: "2026-06-18T12:00:00.000Z",
    ...overrides,
  };
}

run();
