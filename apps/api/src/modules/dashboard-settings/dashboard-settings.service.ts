import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '../../prisma/prisma.service'

import {
  UpdateCustomizationSettingsDto,
  UpdateDeliverySettingsDto,
} from './dto/update-dashboard-settings.dto'

type TenantSettings = {
  delivery?: UpdateDeliverySettingsDto
  customization?: UpdateCustomizationSettingsDto
  [key: string]: unknown
}

const defaultDeliverySettings: UpdateDeliverySettingsDto = {
  isDeliveryOpen: true,
  city: 'Barra Mansa',
  state: 'RJ',
  storeCep: '27320-360',
  storeAddress: 'Rua Presidente Tancredo Neves, 1105 - Vista Alegre',
  whatsapp: '24998508308',
  zones: [
    {
      id: 'centro',
      name: 'Centro',
      fee: 5,
      eta: '30-40 min',
      isActive: true,
    },
    {
      id: 'vista-alegre',
      name: 'Vista Alegre',
      fee: 6,
      eta: '35-45 min',
      isActive: true,
    },
    {
      id: 'ano-bom',
      name: 'Ano Bom',
      fee: 7,
      eta: '40-50 min',
      isActive: true,
    },
    {
      id: 'saudade',
      name: 'Saudade',
      fee: 8,
      eta: '45-55 min',
      isActive: true,
    },
    {
      id: 'santa-clara',
      name: 'Santa Clara',
      fee: 6,
      eta: '35-45 min',
      isActive: false,
    },
  ],
}

const defaultCustomizationSettings: UpdateCustomizationSettingsDto = {
  logoUrl: '',
  coverUrl:
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1400&q=85',
  paletteId: 'classic-pizza',
  brandName: 'Parada Pizza',
  tagline: 'As melhores pizzas da regiao!',
  previewMode: 'desktop',
}

function normalizeSettings(value: unknown): TenantSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as TenantSettings
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

@Injectable()
export class DashboardSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findDelivery(tenantId: string) {
    const tenant = await this.findTenant(tenantId)
    const settings = normalizeSettings(tenant.settings)

    return {
      ...defaultDeliverySettings,
      ...(settings.delivery ?? {}),
    }
  }

  async updateDelivery(
    tenantId: string,
    dto: UpdateDeliverySettingsDto,
  ) {
    const tenant = await this.findTenant(tenantId)
    const settings = normalizeSettings(tenant.settings)
    const current = {
      ...defaultDeliverySettings,
      ...(settings.delivery ?? {}),
    }

    const delivery = {
      ...current,
      ...dto,
      zones: dto.zones ?? current.zones,
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: asJson({
          ...settings,
          delivery,
        }),
      },
    })

    return delivery
  }

  async findCustomization(tenantId: string) {
    const tenant = await this.findTenant(tenantId)
    const settings = normalizeSettings(tenant.settings)

    return {
      ...defaultCustomizationSettings,
      brandName: tenant.name || defaultCustomizationSettings.brandName,
      logoUrl: tenant.logoUrl || defaultCustomizationSettings.logoUrl,
      ...(settings.customization ?? {}),
    }
  }

  async updateCustomization(
    tenantId: string,
    dto: UpdateCustomizationSettingsDto,
  ) {
    const tenant = await this.findTenant(tenantId)
    const settings = normalizeSettings(tenant.settings)
    const current = {
      ...defaultCustomizationSettings,
      brandName: tenant.name || defaultCustomizationSettings.brandName,
      logoUrl: tenant.logoUrl || defaultCustomizationSettings.logoUrl,
      ...(settings.customization ?? {}),
    }

    const customization = {
      ...current,
      ...dto,
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: asJson({
          ...settings,
          customization,
        }),
      },
    })

    return customization
  }

  private async findTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    })

    if (!tenant) {
      throw new NotFoundException('Pizzaria nao encontrada.')
    }

    return tenant
  }
}
