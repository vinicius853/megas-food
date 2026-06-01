import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { randomUUID } from 'crypto'

import { PrismaService } from '../../prisma/prisma.service'
import { CreateCouponDto } from './dto/create-coupon.dto'
import { UpdateCouponDto } from './dto/update-coupon.dto'

type CouponRecord = {
  id: string
  tenantId: string
  code: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: string | number
  minimumOrderValue: string | number | null
  startsAt: Date | null
  expiresAt: Date | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCouponDto) {
    const code = this.normalizeCode(dto.code)
    this.validateCouponValue(dto.type, dto.value)

    const existing = await this.findByCode(tenantId, code)

    if (existing) {
      throw new BadRequestException('Ja existe um cupom com esse codigo.')
    }

    const [coupon] = await this.prisma.$queryRaw<CouponRecord[]>`
      INSERT INTO "coupons" (
        "id",
        "tenantId",
        "code",
        "type",
        "value",
        "minimumOrderValue",
        "startsAt",
        "expiresAt",
        "isActive",
        "updatedAt"
      )
      VALUES (
        ${randomUUID()},
        ${tenantId},
        ${code},
        ${dto.type}::"CouponType",
        ${dto.value},
        ${dto.minimumOrderValue ?? null},
        ${dto.startsAt ? new Date(dto.startsAt) : null},
        ${dto.expiresAt ? new Date(dto.expiresAt) : null},
        ${dto.isActive ?? true},
        NOW()
      )
      RETURNING *
    `

    return coupon
  }

  async findAll(tenantId: string) {
    return this.prisma.$queryRaw<CouponRecord[]>`
      SELECT *
      FROM "coupons"
      WHERE "tenantId" = ${tenantId}
      ORDER BY "createdAt" DESC
    `
  }

  async update(tenantId: string, id: string, dto: UpdateCouponDto) {
    const current = await this.findOne(tenantId, id)
    const code = dto.code ? this.normalizeCode(dto.code) : current.code
    const type = dto.type ?? current.type
    const value = dto.value ?? Number(current.value)

    this.validateCouponValue(type, value)

    if (code !== current.code) {
      const existing = await this.findByCode(tenantId, code)

      if (existing && existing.id !== id) {
        throw new BadRequestException('Ja existe um cupom com esse codigo.')
      }
    }

    const [coupon] = await this.prisma.$queryRaw<CouponRecord[]>`
      UPDATE "coupons"
      SET
        "code" = ${code},
        "type" = ${type}::"CouponType",
        "value" = ${value},
        "minimumOrderValue" = ${dto.minimumOrderValue ?? current.minimumOrderValue},
        "startsAt" = ${
          dto.startsAt !== undefined
            ? dto.startsAt
              ? new Date(dto.startsAt)
              : null
            : current.startsAt
        },
        "expiresAt" = ${
          dto.expiresAt !== undefined
            ? dto.expiresAt
              ? new Date(dto.expiresAt)
              : null
            : current.expiresAt
        },
        "isActive" = ${dto.isActive ?? current.isActive},
        "updatedAt" = NOW()
      WHERE "id" = ${id} AND "tenantId" = ${tenantId}
      RETURNING *
    `

    return coupon
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id)

    await this.prisma.$executeRaw`
      DELETE FROM "coupons"
      WHERE "id" = ${id} AND "tenantId" = ${tenantId}
    `

    return { success: true }
  }

  async validateForPublicSlug(slug: string, code: string, subtotal: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    })

    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Pizzaria nao encontrada.')
    }

    return this.validateCoupon(tenant.id, code, subtotal)
  }

  async validateCoupon(tenantId: string, code: string, subtotal: number) {
    const normalizedCode = this.normalizeCode(code)
    const coupon = await this.findByCode(tenantId, normalizedCode)

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Cupom invalido ou inativo.')
    }

    const now = new Date()

    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestException('Cupom ainda nao esta disponivel.')
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new BadRequestException('Cupom expirado.')
    }

    const minimumOrderValue = Number(coupon.minimumOrderValue ?? 0)

    if (minimumOrderValue > 0 && subtotal < minimumOrderValue) {
      throw new BadRequestException(
        `Pedido minimo para este cupom: ${this.formatMoney(minimumOrderValue)}.`,
      )
    }

    const discountAmount = this.calculateDiscount(coupon, subtotal)

    return {
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      minimumOrderValue,
      discountAmount,
      subtotal,
      totalAfterDiscount: Math.max(subtotal - discountAmount, 0),
    }
  }

  async findOne(tenantId: string, id: string) {
    const [coupon] = await this.prisma.$queryRaw<CouponRecord[]>`
      SELECT *
      FROM "coupons"
      WHERE "id" = ${id} AND "tenantId" = ${tenantId}
      LIMIT 1
    `

    if (!coupon) {
      throw new NotFoundException('Cupom nao encontrado.')
    }

    return coupon
  }

  private async findByCode(tenantId: string, code: string) {
    const [coupon] = await this.prisma.$queryRaw<CouponRecord[]>`
      SELECT *
      FROM "coupons"
      WHERE "tenantId" = ${tenantId} AND "code" = ${code}
      LIMIT 1
    `

    return coupon ?? null
  }

  private normalizeCode(value: string) {
    const code = value.trim().toUpperCase().replace(/\s+/g, '')

    if (!code) {
      throw new BadRequestException('Informe o codigo do cupom.')
    }

    return code
  }

  private validateCouponValue(type: string, value: number) {
    if (type === 'PERCENTAGE' && value > 100) {
      throw new BadRequestException('Cupom percentual nao pode passar de 100%.')
    }
  }

  private calculateDiscount(coupon: CouponRecord, subtotal: number) {
    const value = Number(coupon.value)

    if (coupon.type === 'PERCENTAGE') {
      return Math.min(subtotal * (value / 100), subtotal)
    }

    return Math.min(value, subtotal)
  }

  private formatMoney(value: number) {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }
}
