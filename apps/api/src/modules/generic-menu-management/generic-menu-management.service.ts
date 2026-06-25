import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { UpdateGenericMenuDto } from './dto/update-generic-menu.dto';
import { GenericMenuManagementValidator } from './generic-menu-management.validator';
import {
  GenericMenuManagementWriter,
  GenericMenuUpdateResult,
} from './generic-menu-management.writer';
import {
  ConditionalRuleDto,
  GenericMenuManagementResponse,
  GenericModifierGroupAdminDto,
  GenericModifierOptionAdminDto,
} from './generic-menu-management.types';

@Injectable()
export class GenericMenuManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: GenericMenuManagementValidator,
    private readonly writer: GenericMenuManagementWriter,
  ) {}

  async findOne(tenantId: string): Promise<GenericMenuManagementResponse> {
    this.validator.validateTenantId(tenantId);

    const [categories, products, productGroups, productOptions, prices, rules] =
      await Promise.all([
        this.prisma.category.findMany({
          where: { tenantId },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        }),
        this.prisma.product.findMany({
          where: { tenantId },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        }),
        this.prisma.productModifierGroup.findMany({
          where: { tenantId },
          include: { modifierGroup: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        }),
        this.prisma.productModifierOption.findMany({
          where: { tenantId },
          include: { modifierOption: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        }),
        this.prisma.modifierOptionPrice.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.productModifierOptionRule.findMany({
          where: { tenantId },
          include: {
            targetGroup: {
              select: {
                code: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

    const groupsByProduct = groupBy(productGroups, (item) => item.productId);
    const optionsByProductGroup = groupBy(
      productOptions,
      (item) => `${item.productId}:${item.modifierGroupId}`,
    );
    const pricesByProductOption = groupBy(
      prices,
      (item) => `${item.productId}:${item.modifierOptionId}`,
    );
    const rulesByProductOption = groupBy(
      rules,
      (item) => `${item.productId}:${item.sourceOptionId}`,
    );

    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        type: category.type,
        defaultImageUrl: category.defaultImageUrl,
        defaultImagePublicId: category.defaultImagePublicId,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      })),
      products: products.map((product) => ({
        id: product.id,
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        type: product.type,
        pricingMode: product.pricingMode,
        basePrice:
          product.basePrice === null ? null : Number(product.basePrice),
        price: product.price === null ? null : Number(product.price),
        isActive: product.isActive,
        sortOrder: product.sortOrder,
        modifierGroups: (groupsByProduct.get(product.id) ?? []).map(
          (productGroup): GenericModifierGroupAdminDto => {
            const group = productGroup.modifierGroup;
            const options =
              optionsByProductGroup.get(`${product.id}:${group.id}`) ?? [];

            return {
              id: group.id,
              productModifierGroupId: productGroup.id,
              code: group.code,
              name: group.name,
              description: group.description,
              selectionType: group.selectionType,
              pricingMode: group.pricingMode,
              isRequired: productGroup.isRequiredOverride ?? group.isRequired,
              minSelections:
                productGroup.minSelectionsOverride ?? group.minSelections,
              maxSelections:
                productGroup.maxSelectionsOverride ?? group.maxSelections,
              sortOrder: productGroup.sortOrder,
              isActive: group.isActive,
              options: options.map(
                (productOption): GenericModifierOptionAdminDto => {
                  const option = productOption.modifierOption;

                  return {
                    id: option.id,
                    productModifierOptionId: productOption.id,
                    code: option.code,
                    name: option.name,
                    description: option.description,
                    imageUrl: option.imageUrl,
                    displayCategoryId: productOption.displayCategoryId,
                    priceDelta: Number(
                      productOption.priceDeltaOverride ??
                        option.priceDelta ??
                        0,
                    ),
                    sortOrder: productOption.sortOrder,
                    isActive: productOption.isActive && option.isActive,
                    prices: (
                      pricesByProductOption.get(`${product.id}:${option.id}`) ??
                      []
                    ).map((price) => ({
                      id: price.id,
                      dependsOnOptionId: price.dependsOnOptionId,
                      price: Number(price.price),
                      isActive: price.isActive,
                    })),
                    rules: (
                      rulesByProductOption.get(`${product.id}:${option.id}`) ??
                      []
                    ).map(
                      (rule): ConditionalRuleDto => ({
                        id: rule.id,
                        targetGroupId: rule.targetGroupId,
                        targetGroupCode: rule.targetGroup.code,
                        isEnabled: rule.isEnabled,
                        minSelections: rule.minSelections,
                        maxSelections: rule.maxSelections,
                        metadata: rule.metadata,
                      }),
                    ),
                  };
                },
              ),
            };
          },
        ),
      })),
    };
  }

  async validateUpdatePayload(
    tenantId: string,
    payload: UpdateGenericMenuDto,
  ): Promise<void> {
    this.validator.validateStructure(payload);
    await this.validator.validateTenantRelations(tenantId, payload);
  }

  async update(
    tenantId: string,
    payload: UpdateGenericMenuDto,
  ): Promise<{
    result: GenericMenuUpdateResult;
    menu: GenericMenuManagementResponse;
  }> {
    this.validator.validateStructure(payload);

    const result = await this.prisma.$transaction(async (tx) => {
      await this.validator.validateTenantRelations(tenantId, payload, tx);
      return this.writer.write(tx, tenantId, payload);
    });

    return {
      result,
      menu: await this.findOne(tenantId),
    };
  }
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const groupKey = key(item);
    const values = grouped.get(groupKey) ?? [];
    values.push(item);
    grouped.set(groupKey, values);
  }

  return grouped;
}
