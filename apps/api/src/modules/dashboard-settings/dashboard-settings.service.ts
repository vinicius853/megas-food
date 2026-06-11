import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import {
  UpdateCustomizationSettingsDto,
  UpdateDeliverySettingsDto,
} from './dto/update-dashboard-settings.dto';

type TenantSettings = {
  delivery?: UpdateDeliverySettingsDto;
  customization?: UpdateCustomizationSettingsDto;
  [key: string]: unknown;
};

const emptyDeliverySettings: UpdateDeliverySettingsDto = {
  isDeliveryOpen: false,
  city: '',
  state: '',
  storeCep: '',
  storeAddress: '',
  whatsapp: '',
  zones: [],
  openingHours: {},
  options: {},
};

const emptyCustomizationSettings: UpdateCustomizationSettingsDto = {
  logoUrl: '',
  coverUrl: '',
  paletteId: 'classic-pizza',
  brandName: '',
  tagline: '',
  previewMode: 'desktop',
};

function normalizeSettings(value: unknown): TenantSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as TenantSettings;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

@Injectable()
export class DashboardSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findDelivery(tenantId: string) {
    const tenant = await this.findTenant(tenantId);
    const settings = normalizeSettings(tenant.settings);

    return {
      ...emptyDeliverySettings,
      city: tenant.city ?? '',
      state: tenant.state ?? '',
      storeCep: tenant.zipCode ?? '',
      storeAddress: tenant.address ?? '',
      whatsapp: tenant.whatsapp ?? '',
      ...(settings.delivery ?? {}),
    };
  }

  async updateDelivery(tenantId: string, dto: UpdateDeliverySettingsDto) {
    const tenant = await this.findTenant(tenantId);
    const settings = normalizeSettings(tenant.settings);
    const current = {
      ...emptyDeliverySettings,
      city: tenant.city ?? '',
      state: tenant.state ?? '',
      storeCep: tenant.zipCode ?? '',
      storeAddress: tenant.address ?? '',
      whatsapp: tenant.whatsapp ?? '',
      ...(settings.delivery ?? {}),
    };

    const delivery = {
      ...current,
      ...dto,
      zones: dto.zones ?? current.zones,
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: asJson({
          ...settings,
          delivery,
        }),
      },
    });

    return delivery;
  }

  async findCustomization(tenantId: string) {
    const tenant = await this.findTenant(tenantId);
    const settings = normalizeSettings(tenant.settings);

    return {
      ...emptyCustomizationSettings,
      brandName: tenant.name ?? '',
      logoUrl: tenant.logoUrl ?? '',
      ...(settings.customization ?? {}),
    };
  }

  async updateCustomization(
    tenantId: string,
    dto: UpdateCustomizationSettingsDto,
  ) {
    const tenant = await this.findTenant(tenantId);
    const settings = normalizeSettings(tenant.settings);
    const current = {
      ...emptyCustomizationSettings,
      brandName: tenant.name ?? '',
      logoUrl: tenant.logoUrl ?? '',
      ...(settings.customization ?? {}),
    };

    const customization = {
      ...current,
      ...dto,
    };

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: asJson({
          ...settings,
          customization,
        }),
      },
    });

    return customization;
  }

  private async findTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Pizzaria nao encontrada.');
    }

    return tenant;
  }
}
