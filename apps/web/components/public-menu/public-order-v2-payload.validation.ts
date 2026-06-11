import assert from 'node:assert/strict'

import type { CartItem } from './cart-context'
import { buildPublicOrderV2Payload } from './public-order-v2-payload'

function run() {
  validatesWholePizza()
  validatesHalfAndHalf()
  validatesThreeFlavors()
  validatesBorder()
  validatesQuantityTwo()
  validatesFixedProduct()
}

function validatesWholePizza() {
  const payload = buildPayload([
    pizzaItem([
      modifier('pizza_size', 'size-30'),
      modifier('pizza_flavor', 'calabresa', 'size-30', 1),
    ]),
  ])

  assert.equal(payload.items[0].selectedModifiers.length, 2)
  assert.equal(payload.items[0].selectedModifiers[1].fraction, 1)
}

function validatesHalfAndHalf() {
  const payload = buildPayload([
    pizzaItem([
      modifier('pizza_size', 'size-30'),
      modifier('pizza_flavor', 'calabresa', 'size-30', 0.5),
      modifier('pizza_flavor', 'mussarela', 'size-30', 0.5),
    ]),
  ])

  assert.equal(payload.items[0].selectedModifiers.length, 3)
  assert.equal(payload.items[0].selectedModifiers[1].fraction, 0.5)
}

function validatesThreeFlavors() {
  const payload = buildPayload([
    pizzaItem([
      modifier('pizza_size', 'size-40'),
      modifier('pizza_flavor', 'calabresa', 'size-40', 1 / 3),
      modifier('pizza_flavor', 'mussarela', 'size-40', 1 / 3),
      modifier('pizza_flavor', 'portuguesa', 'size-40', 1 / 3),
    ]),
  ])

  assert.equal(payload.items[0].selectedModifiers.length, 4)
}

function validatesBorder() {
  const payload = buildPayload([
    pizzaItem([
      modifier('pizza_size', 'size-30'),
      modifier('pizza_flavor', 'calabresa', 'size-30', 1),
      modifier('pizza_border', 'catupiry', 'size-30'),
    ]),
  ])

  assert.equal(
    payload.items[0].selectedModifiers.at(-1)?.groupCode,
    'pizza_border',
  )
}

function validatesQuantityTwo() {
  const item = pizzaItem([
    modifier('pizza_size', 'size-30'),
    modifier('pizza_flavor', 'calabresa', 'size-30', 1),
  ])
  item.quantity = 2

  assert.equal(buildPayload([item]).items[0].quantity, 2)
}

function validatesFixedProduct() {
  const payload = buildPayload([
    {
      id: 'drink-cart-item',
      productId: 'drink-1',
      productName: 'Refrigerante',
      selectedModifiers: [],
      displayGroups: [],
      quantity: 1,
      unitPrice: 8,
      totalPrice: 8,
    },
  ])

  assert.deepEqual(payload.items[0].selectedModifiers, [])
}

function buildPayload(items: CartItem[]) {
  return buildPublicOrderV2Payload({
    customerName: 'Cliente',
    customerPhone: '11999999999',
    type: 'DELIVERY',
    paymentType: 'PIX',
    deliveryFee: 5,
    couponCode: 'PROMO10',
    notes: 'Obs',
    items,
  })
}

function pizzaItem(
  selectedModifiers: CartItem['selectedModifiers'],
): CartItem {
  return {
    id: 'pizza-cart-item',
    productId: 'pizza-1',
    productName: 'Pizza redonda',
    selectedModifiers,
    displayGroups: [],
    quantity: 1,
    unitPrice: 40,
    totalPrice: 40,
  }
}

function modifier(
  groupCode: string,
  optionId: string,
  dependsOnOptionId?: string,
  fraction?: number,
) {
  return {
    groupCode,
    optionId,
    dependsOnOptionId,
    fraction,
  }
}

run()
