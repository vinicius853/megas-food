import assert from 'node:assert/strict'

import {
  buildPriceEngineModifiers,
  buildPublicOrderV2Payload,
} from './experimental-menu-v2.helpers'
import type {
  ExperimentalMenuV2Selections,
  PublicMenuV2Product,
} from './experimental-menu-v2.types'

function run() {
  validatesWholePizzaPayload()
  validatesHalfAndHalfPayload()
  validatesThreeFlavorPayload()
  validatesPizzaWithBorderPayload()
  validatesQuantityTwoPayload()
  validatesMissingRequiredGroupPayload()
}

function validatesWholePizzaPayload() {
  const modifiers = buildPriceEngineModifiers(product(), {
    size: ['size-30'],
    flavor: ['flavor-calabresa'],
  })

  assert.equal(modifiers.length, 2)
  assert.equal(
    modifiers.find((item) => item.optionId === 'flavor-calabresa')?.fraction,
    undefined,
  )
}

function validatesHalfAndHalfPayload() {
  const modifiers = buildPriceEngineModifiers(product(), {
    size: ['size-30'],
    flavor: ['flavor-calabresa', 'flavor-mussarela'],
  })

  const flavors = modifiers.filter((item) => item.groupCode === 'pizza_flavor')

  assert.equal(flavors.length, 2)
  assert.equal(flavors[0].fraction, 0.5)
  assert.equal(flavors[1].fraction, 0.5)
}

function validatesThreeFlavorPayload() {
  const modifiers = buildPriceEngineModifiers(product(), {
    size: ['size-40'],
    flavor: ['flavor-calabresa', 'flavor-mussarela', 'flavor-portuguesa'],
  })

  const flavors = modifiers.filter((item) => item.groupCode === 'pizza_flavor')

  assert.equal(flavors.length, 3)
  assert(flavors.every((flavor) => flavor.fraction === 0.33))
}

function validatesPizzaWithBorderPayload() {
  const modifiers = buildPriceEngineModifiers(product(), {
    size: ['size-30'],
    flavor: ['flavor-calabresa'],
    border: ['border-catupiry'],
  })

  const border = modifiers.find((item) => item.optionId === 'border-catupiry')

  assert.equal(border?.dependsOnOptionId, 'size-30')
}

function validatesQuantityTwoPayload() {
  const payload = buildPublicOrderV2Payload({
    customer: {
      name: 'Cliente V2',
      phone: '11999999999',
    },
    product: product(),
    quantity: 2,
    selections: {
      size: ['size-30'],
      flavor: ['flavor-calabresa'],
    },
  })

  assert.equal(payload.items[0].quantity, 2)
  assert.equal(payload.items[0].selectedModifiers.length, 2)
}

function validatesMissingRequiredGroupPayload() {
  const selections: ExperimentalMenuV2Selections = {
    flavor: ['flavor-calabresa'],
  }
  const payload = buildPublicOrderV2Payload({
    customer: {
      name: 'Cliente V2',
      phone: '11999999999',
    },
    product: product(),
    quantity: 1,
    selections,
  })

  assert.equal(payload.items[0].selectedModifiers.length, 1)
  assert.equal(payload.items[0].selectedModifiers[0].groupCode, 'pizza_flavor')
}

function product(): PublicMenuV2Product {
  return {
    id: 'product-pizza-redonda',
    name: 'Pizza redonda',
    description: null,
    imageUrl: null,
    type: 'PIZZA',
    pricingMode: 'FROM_MODIFIERS',
    basePrice: 0,
    price: null,
    sortOrder: 1,
    modifierGroups: [
      {
        id: 'size',
        code: 'pizza_size',
        name: 'Tamanho',
        description: null,
        selectionType: 'SINGLE',
        pricingMode: 'INCLUDED',
        isRequired: true,
        minSelections: 1,
        maxSelections: 1,
        sortOrder: 1,
        options: [option('size-30', '30cm'), option('size-40', '40cm')],
      },
      {
        id: 'flavor',
        code: 'pizza_flavor',
        name: 'Sabores',
        description: null,
        selectionType: 'MULTIPLE',
        pricingMode: 'HIGHEST_SELECTED',
        isRequired: true,
        minSelections: 1,
        maxSelections: 4,
        sortOrder: 2,
        options: [
          option('flavor-calabresa', 'Calabresa'),
          option('flavor-mussarela', 'Mussarela'),
          option('flavor-portuguesa', 'Portuguesa'),
        ],
      },
      {
        id: 'border',
        code: 'pizza_border',
        name: 'Borda',
        description: null,
        selectionType: 'SINGLE',
        pricingMode: 'ADDITIVE',
        isRequired: false,
        minSelections: 0,
        maxSelections: 1,
        sortOrder: 3,
        options: [option('border-catupiry', 'Catupiry')],
      },
    ],
  }
}

function option(id: string, name: string) {
  return {
    id,
    code: id,
    name,
    description: null,
    imageUrl: null,
    priceDelta: 0,
    sortOrder: 1,
    isActive: true,
    prices: [],
  }
}

run()
