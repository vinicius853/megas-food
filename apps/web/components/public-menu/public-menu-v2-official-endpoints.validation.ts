import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const webRoot = process.cwd()
const forbiddenEndpoints = [
  `/${'public-menu'}/`,
  `/${'public-orders'}/`,
]
const filesToCheck = [
  'app/c/[slug]/page.tsx',
  'components/public-menu/public-menu-client.tsx',
  'components/public-menu/checkout-modal.tsx',
  'components/public-menu/price-engine-shadow.ts',
  'components/public-menu/public-order-v2-payload.ts',
]

const violations = filesToCheck.flatMap((relativePath) => {
  const content = readFileSync(join(webRoot, relativePath), 'utf8')

  return forbiddenEndpoints
    .filter((endpoint) =>
      new RegExp(`apiFetch[\\s\\S]*?${escapeRegExp(endpoint)}`).test(content),
    )
    .map((endpoint) => `${relativePath} -> ${endpoint}`)
})

assert.deepEqual(violations, [])

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
