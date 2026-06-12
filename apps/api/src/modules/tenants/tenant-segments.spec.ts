import { TenantSegment } from '@prisma/client'
import { validate } from 'class-validator'

import { UpdateTenantDto } from './dto/update-tenant.dto'
import {
  DEFAULT_TENANT_SEGMENTS,
  normalizeTenantSegments,
} from './tenant-segments'

describe('tenant segments', () => {
  it('uses PIZZARIA as the default segment', () => {
    expect(normalizeTenantSegments()).toEqual(DEFAULT_TENANT_SEGMENTS)
  })

  it('keeps valid segments without duplicates', () => {
    expect(
      normalizeTenantSegments([
        TenantSegment.PIZZARIA,
        TenantSegment.HAMBURGUERIA,
        TenantSegment.PIZZARIA,
      ]),
    ).toEqual([
      TenantSegment.PIZZARIA,
      TenantSegment.HAMBURGUERIA,
    ])
  })

  it('accepts a valid update payload', async () => {
    const dto = Object.assign(new UpdateTenantDto(), {
      enabledSegments: [
        TenantSegment.PIZZARIA,
        TenantSegment.PASTELARIA,
      ],
    })

    await expect(validate(dto)).resolves.toHaveLength(0)
  })

  it('rejects an empty segment list', async () => {
    const dto = Object.assign(new UpdateTenantDto(), {
      enabledSegments: [],
    })

    const errors = await validate(dto)

    expect(errors.some((error) => error.property === 'enabledSegments')).toBe(
      true,
    )
  })
})
