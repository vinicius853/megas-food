import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

import { UpdateGenericMenuDto } from './dto/update-generic-menu.dto';

type ValidationClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class GenericMenuManagementValidator {
  constructor(private readonly prisma: PrismaService) {}

  validateTenantId(tenantId: string) {
    requireTenantId(tenantId);
  }

  validateStructure(payload: UpdateGenericMenuDto) {
    assertUnique(
      payload.categories.map((category) => category.id),
      'categoria',
    );
    assertUnique(
      payload.categories.map((category) => category.clientId),
      'referencia temporaria de categoria',
    );
    assertUnique(
      payload.categories.map((category) => category.slug),
      'slug de categoria',
    );

    const categoryClientIds = new Set(
      payload.categories
        .map((category) => category.clientId)
        .filter((value): value is string => Boolean(value)),
    );

    assertUnique(
      payload.products.map((product) => product.id),
      'produto',
    );

    for (const product of payload.products) {
      if (!product.categoryId && !product.categoryClientId) {
        throw new BadRequestException(
          `Categoria obrigatoria no produto ${product.name}.`,
        );
      }
      if (product.categoryId && product.categoryClientId) {
        throw new BadRequestException(
          `Produto ${product.name} possui duas referencias de categoria.`,
        );
      }
      if (
        product.categoryClientId &&
        !categoryClientIds.has(product.categoryClientId)
      ) {
        throw new BadRequestException(
          `Referencia temporaria de categoria invalida no produto ${product.name}.`,
        );
      }

      assertUnique(
        product.modifierGroups.map((group) => group.modifierGroupId),
        `grupo do produto ${product.name}`,
      );
      assertUnique(
        product.modifierGroups.map((group) => group.code),
        `codigo de grupo do produto ${product.name}`,
      );

      for (const group of product.modifierGroups) {
        if (group.maxSelections < group.minSelections) {
          throw new BadRequestException(
            `maxSelections menor que minSelections no grupo ${group.name}.`,
          );
        }

        assertUnique(
          group.options.map((option) => option.modifierOptionId),
          `opcao do grupo ${group.name}`,
        );
        assertUnique(
          group.options.map((option) => option.clientId),
          `referencia temporaria do grupo ${group.name}`,
        );

        const optionClientIds = new Set(
          product.modifierGroups.flatMap((item) =>
            item.options
              .map((option) => option.clientId)
              .filter((value): value is string => Boolean(value)),
          ),
        );

        for (const option of group.options) {
          assertUnique(
            option.prices.map(
              (price) => price.dependsOnOptionId ?? '__without_context__',
            ),
            `preco contextual da opcao ${option.name}`,
          );
          assertUnique(
            option.rules.map((rule) => rule.targetGroupId),
            `regra condicional da opcao ${option.name}`,
          );

          for (const rule of option.rules) {
            if (
              rule.minSelections !== undefined &&
              rule.maxSelections !== undefined &&
              rule.maxSelections < rule.minSelections
            ) {
              throw new BadRequestException(
                `Regra invalida na opcao ${option.name}.`,
              );
            }
          }

          for (const price of option.prices) {
            if (
              price.dependsOnOptionClientId &&
              !optionClientIds.has(price.dependsOnOptionClientId)
            ) {
              throw new BadRequestException(
                `Referencia temporaria de preco invalida na opcao ${option.name}.`,
              );
            }

            if (price.dependsOnOptionId && price.dependsOnOptionClientId) {
              throw new BadRequestException(
                `Preco da opcao ${option.name} possui duas referencias de contexto.`,
              );
            }
          }
        }
      }
    }
  }

  async validateTenantRelations(
    tenantId: string,
    payload: UpdateGenericMenuDto,
    client: ValidationClient = this.prisma,
  ) {
    requireTenantId(tenantId);
    const references = collectReferences(payload);
    const [
      categories,
      products,
      groups,
      options,
      productGroups,
      productOptions,
      prices,
      rules,
      productGroupLinks,
      productOptionLinks,
    ] = await Promise.all([
      client.category.findMany({
        where: { tenantId, id: { in: references.categoryIds } },
        select: { id: true },
      }),
      client.product.findMany({
        where: { tenantId, id: { in: references.productIds } },
        select: { id: true },
      }),
      client.modifierGroup.findMany({
        where: { tenantId, id: { in: references.groupIds } },
        select: { id: true },
      }),
      client.modifierOption.findMany({
        where: { tenantId, id: { in: references.optionIds } },
        select: { id: true, groupId: true },
      }),
      client.productModifierGroup.findMany({
        where: { tenantId, id: { in: references.productGroupIds } },
        select: {
          id: true,
          productId: true,
          modifierGroupId: true,
        },
      }),
      client.productModifierOption.findMany({
        where: { tenantId, id: { in: references.productOptionIds } },
        select: {
          id: true,
          productId: true,
          modifierGroupId: true,
          modifierOptionId: true,
        },
      }),
      client.modifierOptionPrice.findMany({
        where: { tenantId, id: { in: references.priceIds } },
        select: {
          id: true,
          productId: true,
          modifierOptionId: true,
        },
      }),
      client.productModifierOptionRule.findMany({
        where: { tenantId, id: { in: references.ruleIds } },
        select: {
          id: true,
          productId: true,
          sourceOptionId: true,
        },
      }),
      client.productModifierGroup.findMany({
        where: {
          tenantId,
          productId: { in: references.allProductIds },
        },
        select: {
          productId: true,
          modifierGroupId: true,
        },
      }),
      client.productModifierOption.findMany({
        where: {
          tenantId,
          productId: { in: references.allProductIds },
        },
        select: {
          productId: true,
          modifierGroupId: true,
          modifierOptionId: true,
        },
      }),
    ]);

    assertReferencesBelongToTenant(
      'categoria',
      references.categoryIds,
      categories,
    );
    assertReferencesBelongToTenant('produto', references.productIds, products);
    assertReferencesBelongToTenant('grupo', references.groupIds, groups);
    assertReferencesBelongToTenant('opcao', references.optionIds, options);
    assertReferencesBelongToTenant(
      'vinculo de grupo',
      references.productGroupIds,
      productGroups,
    );
    assertReferencesBelongToTenant(
      'vinculo de opcao',
      references.productOptionIds,
      productOptions,
    );
    assertReferencesBelongToTenant('preco', references.priceIds, prices);
    assertReferencesBelongToTenant('regra', references.ruleIds, rules);

    validateRelationOwnership(payload, {
      options,
      productGroups,
      productOptions,
      prices,
      rules,
      productGroupLinks,
      productOptionLinks,
    });
  }
}

function validateRelationOwnership(
  payload: UpdateGenericMenuDto,
  data: {
    options: Array<{ id: string; groupId: string }>;
    productGroups: Array<{
      id: string;
      productId: string;
      modifierGroupId: string;
    }>;
    productOptions: Array<{
      id: string;
      productId: string;
      modifierGroupId: string;
      modifierOptionId: string;
    }>;
    prices: Array<{
      id: string;
      productId: string;
      modifierOptionId: string;
    }>;
    rules: Array<{
      id: string;
      productId: string;
      sourceOptionId: string;
    }>;
    productGroupLinks: Array<{
      productId: string;
      modifierGroupId: string;
    }>;
    productOptionLinks: Array<{
      productId: string;
      modifierGroupId: string;
      modifierOptionId: string;
    }>;
  },
) {
  const optionById = new Map(data.options.map((option) => [option.id, option]));
  const productGroupById = new Map(
    data.productGroups.map((link) => [link.id, link]),
  );
  const productOptionById = new Map(
    data.productOptions.map((link) => [link.id, link]),
  );
  const priceById = new Map(data.prices.map((price) => [price.id, price]));
  const ruleById = new Map(data.rules.map((rule) => [rule.id, rule]));
  const productGroupKeys = new Set(
    data.productGroupLinks.map(
      (link) => `${link.productId}:${link.modifierGroupId}`,
    ),
  );
  const productOptionKeys = new Set(
    data.productOptionLinks.map(
      (link) => `${link.productId}:${link.modifierOptionId}`,
    ),
  );

  for (const product of payload.products) {
    if (!product.id) continue;

    for (const group of product.modifierGroups) {
      if (group.productModifierGroupId && group.modifierGroupId) {
        const link = productGroupById.get(group.productModifierGroupId);
        if (
          !link ||
          link.productId !== product.id ||
          link.modifierGroupId !== group.modifierGroupId
        ) {
          throw invalidRelation('vinculo de grupo', group.name);
        }
      }

      for (const option of group.options) {
        if (option.modifierOptionId && group.modifierGroupId) {
          const existingOption = optionById.get(option.modifierOptionId);
          if (
            !existingOption ||
            existingOption.groupId !== group.modifierGroupId
          ) {
            throw invalidRelation('opcao/grupo', option.name);
          }
        }

        if (
          option.productModifierOptionId &&
          option.modifierOptionId &&
          group.modifierGroupId
        ) {
          const link = productOptionById.get(option.productModifierOptionId);
          if (
            !link ||
            link.productId !== product.id ||
            link.modifierGroupId !== group.modifierGroupId ||
            link.modifierOptionId !== option.modifierOptionId
          ) {
            throw invalidRelation('vinculo de opcao', option.name);
          }
        }

        if (
          option.modifierOptionId &&
          !productOptionKeys.has(`${product.id}:${option.modifierOptionId}`)
        ) {
          throw invalidRelation('opcao/produto', option.name);
        }

        for (const price of option.prices) {
          if (
            price.id &&
            option.modifierOptionId &&
            (priceById.get(price.id)?.productId !== product.id ||
              priceById.get(price.id)?.modifierOptionId !==
                option.modifierOptionId)
          ) {
            throw invalidRelation('preco contextual', option.name);
          }

          if (
            price.dependsOnOptionId &&
            !productOptionKeys.has(`${product.id}:${price.dependsOnOptionId}`)
          ) {
            throw invalidRelation(
              'dependsOnOptionId/produto',
              price.dependsOnOptionId,
            );
          }
        }

        for (const rule of option.rules) {
          if (
            rule.id &&
            option.modifierOptionId &&
            (ruleById.get(rule.id)?.productId !== product.id ||
              ruleById.get(rule.id)?.sourceOptionId !== option.modifierOptionId)
          ) {
            throw invalidRelation('regra/opcao origem', option.name);
          }

          if (!productGroupKeys.has(`${product.id}:${rule.targetGroupId}`)) {
            throw invalidRelation('targetGroupId/produto', rule.targetGroupId);
          }
        }
      }
    }
  }
}

function collectReferences(payload: UpdateGenericMenuDto) {
  const categoryIds = new Set<string>();
  const productIds = new Set<string>();
  const allProductIds = new Set<string>();
  const groupIds = new Set<string>();
  const optionIds = new Set<string>();
  const productGroupIds = new Set<string>();
  const productOptionIds = new Set<string>();
  const priceIds = new Set<string>();
  const ruleIds = new Set<string>();

  for (const category of payload.categories) {
    if (category.id) categoryIds.add(category.id);
  }

  for (const product of payload.products) {
    if (product.categoryId) categoryIds.add(product.categoryId);
    if (product.id) {
      productIds.add(product.id);
      allProductIds.add(product.id);
    }

    for (const group of product.modifierGroups) {
      if (group.modifierGroupId) groupIds.add(group.modifierGroupId);
      if (group.productModifierGroupId) {
        productGroupIds.add(group.productModifierGroupId);
      }

      for (const option of group.options) {
        if (option.productModifierOptionId) {
          productOptionIds.add(option.productModifierOptionId);
        }
        if (option.modifierOptionId) {
          optionIds.add(option.modifierOptionId);
        }
        if (option.displayCategoryId) {
          categoryIds.add(option.displayCategoryId);
        }

        for (const price of option.prices) {
          if (price.id) priceIds.add(price.id);
          if (price.dependsOnOptionId) {
            optionIds.add(price.dependsOnOptionId);
          }
        }

        for (const rule of option.rules) {
          if (rule.id) ruleIds.add(rule.id);
          groupIds.add(rule.targetGroupId);
        }
      }
    }
  }

  return {
    categoryIds: [...categoryIds],
    productIds: [...productIds],
    allProductIds: [...allProductIds],
    groupIds: [...groupIds],
    optionIds: [...optionIds],
    productGroupIds: [...productGroupIds],
    productOptionIds: [...productOptionIds],
    priceIds: [...priceIds],
    ruleIds: [...ruleIds],
  };
}

function assertReferencesBelongToTenant(
  label: string,
  expectedIds: string[],
  found: Array<{ id: string }>,
) {
  const foundIds = new Set(found.map((item) => item.id));
  const invalidIds = expectedIds.filter((id) => !foundIds.has(id));

  if (invalidIds.length > 0) {
    throw new BadRequestException(
      `${label} inexistente ou pertencente a outro tenant: ${invalidIds.join(', ')}.`,
    );
  }
}

function assertUnique(values: Array<string | undefined>, label: string) {
  const filtered = values.filter((value): value is string => Boolean(value));

  if (new Set(filtered).size !== filtered.length) {
    throw new BadRequestException(`${label} duplicado no payload.`);
  }
}

function requireTenantId(tenantId: string) {
  if (!tenantId) {
    throw new BadRequestException('Tenant nao identificado.');
  }
}

function invalidRelation(label: string, value: string) {
  return new BadRequestException(`Relacao invalida ${label}: ${value}.`);
}
