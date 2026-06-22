import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import {
  UpdateCustomizationSettingsDto,
  UpdateDeliverySettingsDto,
} from './dto/update-dashboard-settings.dto';

type TenantSettings = {
  delivery?: UpdateDeliverySettingsDto;
  customization?: Omit<UpdateCustomizationSettingsDto, 'brandName'> & {
    brandName?: string | null;
  };
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
  coverPositionX: 50,
  coverPositionY: 50,
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

function normalizeBrandName(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCoverPosition(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, value));
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

    return this.buildCustomizationResponse(
      tenant,
      settings.customization ?? {},
    );
  }

  private buildCustomizationResponse(
    tenant: { name: string; logoUrl: string | null },
    customization: TenantSettings['customization'],
  ) {
    const brandName = normalizeBrandName(customization?.brandName);
    const tenantName = normalizeBrandName(tenant.name);

    return {
      ...emptyCustomizationSettings,
      logoUrl: tenant.logoUrl ?? '',
      ...(customization ?? {}),
      coverPositionX: normalizeCoverPosition(customization?.coverPositionX),
      coverPositionY: normalizeCoverPosition(customization?.coverPositionY),
      brandName,
      tenantName,
      effectiveBrandName: brandName || tenantName || 'Loja',
    };
  }

  async updateCustomization(
    tenantId: string,
    dto: UpdateCustomizationSettingsDto,
  ) {
    const tenant = await this.findTenant(tenantId);
    const settings = normalizeSettings(tenant.settings);
    const storedCustomization = settings.customization ?? {};
    const current = {
      ...emptyCustomizationSettings,
      logoUrl: tenant.logoUrl ?? '',
      ...storedCustomization,
    };
    const { brandName: _currentBrandName, ...currentWithoutBrandName } =
      current;
    const { brandName: incomingBrandName, ...dtoWithoutBrandName } = dto;
    const brandName =
      incomingBrandName === undefined
        ? normalizeBrandName(storedCustomization.brandName)
        : normalizeBrandName(incomingBrandName);
    const coverPositionX = normalizeCoverPosition(
      dto.coverPositionX === undefined
        ? storedCustomization.coverPositionX
        : dto.coverPositionX,
    );
    const coverPositionY = normalizeCoverPosition(
      dto.coverPositionY === undefined
        ? storedCustomization.coverPositionY
        : dto.coverPositionY,
    );

    const customization = {
      ...currentWithoutBrandName,
      ...dtoWithoutBrandName,
      coverPositionX,
      coverPositionY,
      ...(brandName ? { brandName } : {}),
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

    return this.buildCustomizationResponse(tenant, customization);
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
