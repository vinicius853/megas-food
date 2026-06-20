import assert from 'node:assert/strict'

import {
  addOrMergeCartItem,
  getCartItemMergeSignature,
  type CartItem,
} from './cart-context'

function run() {
  groupsIdenticalSimpleItems()
  preservesDifferentProducts()
  preservesDifferentPrices()
  groupsEqualNotes()
  preservesDifferentNotes()
  preservesConfiguredItems()
  preservesDisplayConfigurations()
  preservesAdditionalItems()
}

function groupsIdenticalSimpleItems() {
  const first = simpleItem({ id: 'cart-1', quantity: 1 })
  const second = simpleItem({ id: 'cart-2', quantity: 2 })
  const result = addOrMergeCartItem([first], second)

  assert.equal(result.length, 1)
  assert.equal(result[0].id, 'cart-1')
  assert.equal(result[0].quantity, 3)
  assert.equal(result[0].totalPrice * result[0].quantity, 12)
  assert.equal(
    getCartItemMergeSignature(first),
    getCartItemMergeSignature(second),
  )
}

function preservesDifferentProducts() {
  const result = addOrMergeCartItem(
    [simpleItem({ id: 'cart-1', productId: 'drink-1' })],
    simpleItem({ id: 'cart-2', productId: 'drink-2' }),
  )

  assert.equal(result.length, 2)
}

function preservesDifferentPrices() {
  const result = addOrMergeCartItem(
    [simpleItem({ id: 'cart-1', unitPrice: 4, totalPrice: 4 })],
    simpleItem({ id: 'cart-2', unitPrice: 5, totalPrice: 5 }),
  )

  assert.equal(result.length, 2)
}

function groupsEqualNotes() {
  const result = addOrMergeCartItem(
    [simpleItem({ id: 'cart-1', notes: 'Sem gelo' })],
    simpleItem({ id: 'cart-2', notes: '  Sem gelo  ' }),
  )

  assert.equal(result.length, 1)
  assert.equal(result[0].quantity, 2)
}

function preservesDifferentNotes() {
  const result = addOrMergeCartItem(
    [simpleItem({ id: 'cart-1', notes: 'Sem gelo' })],
    simpleItem({ id: 'cart-2', notes: 'Com gelo' }),
  )

  assert.equal(result.length, 2)
}

function preservesConfiguredItems() {
  const configured = simpleItem({
    id: 'pizza-1',
    productId: 'pizza',
    selectedModifiers: [
      {
        groupCode: 'pizza_size',
        optionId: 'size-30',
      },
    ],
  })
  const result = addOrMergeCartItem([configured], {
    ...configured,
    id: 'pizza-2',
  })

  assert.equal(result.length, 2)
  assert.equal(getCartItemMergeSignature(configured), null)
}

function preservesDisplayConfigurations() {
  const configured = simpleItem({
    id: 'configured-1',
    displayGroups: [
      {
        code: 'size',
        name: 'Tamanho',
        options: [{ name: 'Grande' }],
      },
    ],
  })
  const result = addOrMergeCartItem([configured], {
    ...configured,
    id: 'configured-2',
  })

  assert.equal(result.length, 2)
}

function preservesAdditionalItems() {
  const configured = simpleItem({
    id: 'additional-1',
    additionalItems: [
      {
        productId: 'extra-1',
        name: 'Bacon',
        price: 5,
      },
    ],
  })
  const result = addOrMergeCartItem([configured], {
    ...configured,
    id: 'additional-2',
  })

  assert.equal(result.length, 2)
}

function simpleItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'cart-item',
    productId: 'drink-1',
    productName: 'Guaravita',
    selectedModifiers: [],
    displayGroups: [],
    quantity: 1,
    unitPrice: 4,
    totalPrice: 4,
    ...overrides,
  }
}

run()
