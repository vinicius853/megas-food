import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { calculatePrice } from './price-engine.helpers';
import {
  PriceEngineCatalog,
  PriceEngineInput,
  PriceEngineResult,
} from './price-engine.types';

@Injectable()
export class PriceEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(input: PriceEngineInput): Promise<PriceEngineResult> {
    const catalog = await this.loadCatalog(input.tenantId, input.productId);

    if (!catalog) {
      return {
        unitPrice: 0,
        totalPrice: 0,
        appliedModifiers: [],
        validationErrors: [
          {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Produto nao encontrado.',
          },
        ],
      };
    }

    return calculatePrice(catalog, input.selectedModifiers, input.quantity);
  }

  private async loadCatalog(
    tenantId: string,
    productId: string,
  ): Promise<PriceEngineCatalog | null> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      include: {
        modifierGroups: {
          include: {
            modifierGroup: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        modifierOptions: {
          include: {
            modifierOption: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        modifierOptionPrices: true,
      },
    });

    if (!product) {
      return null;
    }

    return {
      product: {
        id: product.id,
        tenantId: product.tenantId,
        pricingMode: product.pricingMode,
        basePrice: product.basePrice,
        price: product.price,
      },
      productGroups: product.modifierGroups.map((productGroup) => ({
        id: productGroup.id,
        sortOrder: productGroup.sortOrder,
        isRequiredOverride: productGroup.isRequiredOverride,
        minSelectionsOverride: productGroup.minSelectionsOverride,
        maxSelectionsOverride: productGroup.maxSelectionsOverride,
        modifierGroup: {
          id: productGroup.modifierGroup.id,
          code: productGroup.modifierGroup.code,
          name: productGroup.modifierGroup.name,
          selectionType: productGroup.modifierGroup.selectionType,
          pricingMode: productGroup.modifierGroup.pricingMode,
          minSelections: productGroup.modifierGroup.minSelections,
          maxSelections: productGroup.modifierGroup.maxSelections,
          isRequired: productGroup.modifierGroup.isRequired,
        },
      })),
      productOptions: product.modifierOptions.map((productOption) => ({
        id: productOption.id,
        productId: productOption.productId,
        modifierGroupId: productOption.modifierGroupId,
        modifierOptionId: productOption.modifierOptionId,
        isActive: productOption.isActive,
        priceDeltaOverride: productOption.priceDeltaOverride,
        modifierOption: {
          id: productOption.modifierOption.id,
          groupId: productOption.modifierOption.groupId,
          code: productOption.modifierOption.code,
          name: productOption.modifierOption.name,
          priceDelta: productOption.modifierOption.priceDelta,
          isActive: productOption.modifierOption.isActive,
        },
      })),
      optionPrices: product.modifierOptionPrices.map((price) => ({
        id: price.id,
        modifierOptionId: price.modifierOptionId,
        dependsOnOptionId: price.dependsOnOptionId,
        price: price.price,
      })),
    };
  }
}
