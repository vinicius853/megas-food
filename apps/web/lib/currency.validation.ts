import assert from 'node:assert/strict'

import { parseCurrencyInput } from './currency'

const cases: Array<[unknown, number]> = [
  ['3.50', 3.5],
  ['3,50', 3.5],
  ['3,99', 3.99],
  ['34,99', 34.99],
  ['34.99', 34.99],
  ['2,5', 2.5],
  ['0,50', 0.5],
  ['0.50', 0.5],
  ['1.234,56', 1234.56],
  ['1,234.56', 1234.56],
  ['1.234', 1234],
  ['1,234', 1234],
  ['1.234.567', 1234567],
  [3.5, 3.5],
  [null, 0],
  [undefined, 0],
]

for (const [input, expected] of cases) {
  assert.equal(parseCurrencyInput(input), expected)
}

console.log('Currency parser validation passed.')
