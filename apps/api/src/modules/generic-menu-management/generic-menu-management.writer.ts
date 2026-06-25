import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  UpdateConditionalRuleDto,
  UpdateContextualPriceDto,
  UpdateGenericCategoryDto,
  UpdateGenericMenuDto,
  UpdateGenericModifierGroupDto,
  UpdateGenericModifierOptionDto,
  UpdateGenericProductDto,
} from './dto/update-generic-menu.dto';

type WriteTransaction = Prisma.TransactionClient;

export type GenericMenuUpdateResult = {
  categories: number;
  products: number;
  groups: number;
  options: number;
  prices: number;
  rules: number;
};

@Injectable()
export class GenericMenuManagementWriter {
  async write(
    tx: WriteTransaction,
    tenantId: string,
    payload: UpdateGenericMenuDto,
  ): Promise<GenericMenuUpdateResult> {
    const result: GenericMenuUpdateResult = {
      categories: 0,
      products: 0,
      groups: 0,
      options: 0,
      prices: 0,
      rules: 0,
    };
    const categoryIdsByClientId = new Map<string, string>();

    for (const categoryDto of payload.categories) {
      const category = await this.upsertCategory(tx, tenantId, categoryDto);
      result.categories += 1;
      if (categoryDto.clientId) {
        categoryIdsByClientId.set(categoryDto.clientId, category.id);
      }
    }

    for (const productDto of payload.products) {
      const product = await this.upsertProduct(
        tx,
        tenantId,
        productDto,
        categoryIdsByClientId,
      );
      result.products += 1;
      const preparedOptions: Array<{
        dto: UpdateGenericModifierOptionDto;
        optionId: string;
      }> = [];
      const optionIdsByClientId = new Map<string, string>();
      const groupIdsByCode = new Map<string, string>();

      for (const groupDto of productDto.modifierGroups) {
        const group = await this.upsertGroup(tx, tenantId, groupDto);
        groupIdsByCode.set(groupDto.code, group.id);

        await this.upsertProductGroup(
          tx,
          tenantId,
          product.id,
          group.id,
          groupDto,
        );
        result.groups += 1;

        for (const optionDto of groupDto.options) {
          const option = await this.upsertOption(
            tx,
            tenantId,
            group.id,
            optionDto,
          );

          await this.upsertProductOption(
            tx,
            tenantId,
            product.id,
            group.id,
            option.id,
            optionDto,
          );
          result.options += 1;
          preparedOptions.push({
            dto: optionDto,
            optionId: option.id,
          });
          if (optionDto.clientId) {
            optionIdsByClientId.set(optionDto.clientId, option.id);
          }
        }
      }

      for (const prepared of preparedOptions) {
        for (const priceDto of prepared.dto.prices) {
          await this.upsertPrice(
            tx,
            tenantId,
            product.id,
            prepared.optionId,
            priceDto,
            optionIdsByClientId,
          );
          result.prices += 1;
        }

        for (const ruleDto of prepared.dto.rules) {
          await this.upsertRule(
            tx,
            tenantId,
            product.id,
            prepared.optionId,
            ruleDto,
            groupIdsByCode,
          );
          result.rules += 1;
        }
      }
    }

    return result;
  }

  private upsertCategory(
    tx: WriteTransaction,
    tenantId: string,
    dto: UpdateGenericCategoryDto,
  ) {
    const data = {
      name: dto.name,
      slug: dto.slug,
      type: dto.type,
      defaultImageUrl: dto.defaultImageUrl ?? null,
      defaultImagePublicId: dto.defaultImagePublicId ?? null,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    };

    if (dto.id) {
      return tx.category.update({
        where: { id: dto.id, tenantId },
        data,
      });
    }

    return tx.category.upsert({
      where: {
        tenantId_slug: {
          tenantId,
          slug: dto.slug,
        },
      },
      create: {
        tenantId,
        ...data,
      },
      update: data,
    });
  }

  private upsertProduct(
    tx: WriteTransaction,
    tenantId: string,
    dto: UpdateGenericProductDto,
    categoryIdsByClientId: Map<string, string>,
  ) {
    const categoryId =
      dto.categoryId ??
      (dto.categoryClientId
        ? categoryIdsByClientId.get(dto.categoryClientId)
        : undefined);

    if (!categoryId) {
      throw new Error(`Categoria nao encontrada para o produto ${dto.name}.`);
    }

    const data = {
      categoryId,
      name: dto.name,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      type: dto.type,
      pricingMode: dto.pricingMode,
      basePrice: dto.basePrice ?? null,
      price: dto.price ?? null,
      isActive: dto.isActive,
      sortOrder: dto.sortOrder,
    };

    if (dto.id) {
      return tx.product.update({
        where: {
          id: dto.id,
          tenantId,
        },
        data,
      });
    }

    return tx.product.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  private async upsertGroup(
    tx: WriteTransaction,
    tenantId: string,
    dto: UpdateGenericModifierGroupDto,
  ) {
    const sharedData = {
      code: dto.code,
      name: dto.name,
      selectionType: dto.selectionType,
      pricingMode: dto.pricingMode,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    };

    if (dto.modifierGroupId) {
      return tx.modifierGroup.update({
        where: {
          id: dto.modifierGroupId,
          tenantId,
        },
        data: sharedData,
      });
    }

    const existing = await tx.modifierGroup.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: dto.code,
        },
      },
    });

    if (existing) {
      return tx.modifierGroup.update({
        where: { id: existing.id, tenantId },
        data: sharedData,
      });
    }

    return tx.modifierGroup.create({
      data: {
        tenantId,
        ...sharedData,
        isRequired: dto.isRequired,
        minSelections: dto.minSelections,
        maxSelections: dto.maxSelections,
      },
    });
  }

  private upsertProductGroup(
    tx: WriteTransaction,
    tenantId: string,
    productId: string,
    modifierGroupId: string,
    dto: UpdateGenericModifierGroupDto,
  ) {
    const data = {
      sortOrder: dto.sortOrder,
      isRequiredOverride: dto.isRequired,
      minSelectionsOverride: dto.minSelections,
      maxSelectionsOverride: dto.maxSelections,
    };

    if (dto.productModifierGroupId) {
      return tx.productModifierGroup.update({
        where: {
          id: dto.productModifierGroupId,
          tenantId,
          productId,
          modifierGroupId,
        },
        data,
      });
    }

    return tx.productModifierGroup.upsert({
      where: {
        tenantId_productId_modifierGroupId: {
          tenantId,
          productId,
          modifierGroupId,
        },
      },
      create: {
        tenantId,
        productId,
        modifierGroupId,
        ...data,
      },
      update: data,
    });
  }

  private async upsertOption(
    tx: WriteTransaction,
    tenantId: string,
    groupId: string,
    dto: UpdateGenericModifierOptionDto,
  ) {
    const data = {
      groupId,
      code: dto.code ?? null,
      name: dto.name,
      description: dto.description ?? null,
      imageUrl: dto.imageUrl ?? null,
      priceDelta: dto.priceDelta ?? 0,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    };

    if (dto.modifierOptionId) {
      return tx.modifierOption.update({
        where: {
          id: dto.modifierOptionId,
          tenantId,
          groupId,
        },
        data,
      });
    }

    const existing = await tx.modifierOption.findFirst({
      where: {
        tenantId,
        groupId,
        ...(dto.code ? { code: dto.code } : { name: dto.name }),
      },
    });

    if (existing) {
      return tx.modifierOption.update({
        where: { id: existing.id, tenantId, groupId },
        data,
      });
    }

    return tx.modifierOption.create({
      data: {
        tenantId,
        ...data,
      },
    });
  }

  private upsertProductOption(
    tx: WriteTransaction,
    tenantId: string,
    productId: string,
    modifierGroupId: string,
    modifierOptionId: string,
    dto: UpdateGenericModifierOptionDto,
  ) {
    const data = {
      modifierGroupId,
      displayCategoryId: dto.displayCategoryId ?? null,
      priceDeltaOverride: dto.priceDelta ?? null,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    };

    if (dto.productModifierOptionId) {
      return tx.productModifierOption.update({
        where: {
          id: dto.productModifierOptionId,
          tenantId,
          productId,
          modifierOptionId,
        },
        data,
      });
    }

    return tx.productModifierOption.upsert({
      where: {
        tenantId_productId_modifierOptionId: {
          tenantId,
          productId,
          modifierOptionId,
        },
      },
      create: {
        tenantId,
        productId,
        modifierOptionId,
        ...data,
      },
      update: data,
    });
  }

  private async upsertPrice(
    tx: WriteTransaction,
    tenantId: string,
    productId: string,
    modifierOptionId: string,
    dto: UpdateContextualPriceDto,
    optionIdsByClientId: Map<string, string>,
  ) {
    const dependsOnOptionId =
      dto.dependsOnOptionId ??
      (dto.dependsOnOptionClientId
        ? optionIdsByClientId.get(dto.dependsOnOptionClientId)
        : undefined);

    if (dto.dependsOnOptionClientId && !dependsOnOptionId) {
      throw new Error(
        `Opcao temporaria nao encontrada: ${dto.dependsOnOptionClientId}.`,
      );
    }

    const data = {
      dependsOnOptionId: dependsOnOptionId ?? null,
      price: dto.price,
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    if (dto.id) {
      await tx.modifierOptionPrice.update({
        where: {
          id: dto.id,
          tenantId,
          productId,
          modifierOptionId,
        },
        data,
      });
      return;
    }

    const existing = await tx.modifierOptionPrice.findFirst({
      where: {
        tenantId,
        productId,
        modifierOptionId,
        dependsOnOptionId: data.dependsOnOptionId,
      },
    });

    if (existing) {
      await tx.modifierOptionPrice.update({
        where: { id: existing.id, tenantId, productId, modifierOptionId },
        data,
      });
      return;
    }

    await tx.modifierOptionPrice.create({
      data: {
        tenantId,
        productId,
        modifierOptionId,
        isActive: dto.isActive ?? true,
        ...data,
      },
    });
  }

  private async upsertRule(
    tx: WriteTransaction,
    tenantId: string,
    productId: string,
    sourceOptionId: string,
    dto: UpdateConditionalRuleDto,
    groupIdsByCode: Map<string, string>,
  ) {
    const targetGroupId =
      dto.targetGroupId ??
      (dto.targetGroupCode
        ? groupIdsByCode.get(dto.targetGroupCode)
        : undefined);

    if (!targetGroupId) {
      throw new Error(
        `Grupo alvo nao encontrado: ${dto.targetGroupCode ?? 'sem referencia'}.`,
      );
    }

    const data = {
      targetGroupId,
      isEnabled: dto.isEnabled,
      minSelections: dto.minSelections ?? null,
      maxSelections: dto.maxSelections ?? null,
      metadata:
        (dto.metadata as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
    };

    if (dto.id) {
      await tx.productModifierOptionRule.update({
        where: {
          id: dto.id,
          tenantId,
          productId,
          sourceOptionId,
        },
        data,
      });
      return;
    }

    await tx.productModifierOptionRule.upsert({
      where: {
        tenantId_productId_sourceOptionId_targetGroupId: {
          tenantId,
          productId,
          sourceOptionId,
          targetGroupId,
        },
      },
      create: {
        tenantId,
        productId,
        sourceOptionId,
        ...data,
      },
      update: data,
    });
  }
}
