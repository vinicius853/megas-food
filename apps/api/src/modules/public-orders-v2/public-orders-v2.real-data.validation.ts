import { PaymentType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { OrdersService } from '../orders/orders.service';
import { PriceEngineService } from '../price-engine/price-engine.service';

import { PublicOrdersV2Service } from './public-orders-v2.service';
import { PRIVACY_POLICY_VERSION } from './privacy-consent';

const ALLOWED_DATABASES = new Set([
  'pizzaria_saas_phase24_copy2_20260603',
  'pizzaria_saas_phase_legacy_drop_test_20260606',
]);
const TENANT_SLUG = 'megas-tech-food';

async function main() {
  assertAllowedDatabase();

  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const context = await loadContext(prisma);
    const gateway = {
      emitOrderCreated: () => undefined,
      emitOrderUpdated: () => undefined,
      emitOrderCancelled: () => undefined,
    };
    const publicOrders = new PublicOrdersV2Service(
      prisma,
      new PriceEngineService(prisma),
      new CouponsService(prisma),
      gateway as never,
    );
    const dashboardOrders = new OrdersService(prisma, gateway as never);
    const countsBefore = await creationCounts(prisma);

    const order = await publicOrders.createByTenantSlug(TENANT_SLUG, {
      privacyAccepted: true,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      customer: {
        name: `Validacao V2 ${new Date().toISOString()}`,
        phone: '11999999999',
      },
      type: 'TAKEAWAY',
      paymentType: PaymentType.PIX,
      deliveryFee: 0,
      items: [
        {
          productId: context.productId,
          quantity: 1,
          selectedModifiers: [
            {
              groupCode: 'pizza_size',
              optionId: context.sizeOptionId,
            },
            {
              groupCode: 'pizza_flavor',
              optionId: context.flavorOptionId,
              dependsOnOptionId: context.sizeOptionId,
            },
          ],
        },
      ],
    });

    const countsAfter = await creationCounts(prisma);
    const storedOrder = await dashboardOrders.findOne(
      context.tenantId,
      order.id,
    );
    const storedItems = storedOrder.items as Array<{ modifiers: unknown[] }>;
    const result = {
      database: currentDatabaseName(),
      orderId: order.id,
      created: {
        orders: countsAfter.orders - countsBefore.orders,
        orderItems: countsAfter.orderItems - countsBefore.orderItems,
        orderItemModifiers:
          countsAfter.orderItemModifiers - countsBefore.orderItemModifiers,
      },
      dashboardRead: {
        items: storedItems.length,
        modifiers: storedItems.flatMap((item) => item.modifiers).length,
      },
    };

    console.log(JSON.stringify(result, null, 2));

    if (
      result.created.orders !== 1 ||
      result.created.orderItems !== 1 ||
      result.created.orderItemModifiers !== 2 ||
      result.dashboardRead.items !== 1 ||
      result.dashboardRead.modifiers !== 2
    ) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function loadContext(prisma: PrismaService) {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { slug: TENANT_SLUG },
    select: { id: true },
  });
  const product = await prisma.product.findFirstOrThrow({
    where: {
      tenantId: tenant.id,
      name: 'Pizza redonda',
      isActive: true,
    },
    select: { id: true },
  });
  const options = await prisma.productModifierOption.findMany({
    where: {
      tenantId: tenant.id,
      productId: product.id,
      isActive: true,
      modifierOption: {
        isActive: true,
        group: {
          code: {
            in: ['pizza_size', 'pizza_flavor'],
          },
        },
      },
    },
    include: {
      modifierOption: {
        include: {
          group: true,
        },
      },
    },
  });
  const findOption = (groupCode: string, name: string) =>
    options.find(
      ({ modifierOption }) =>
        modifierOption.group.code === groupCode &&
        modifierOption.name.trim().toLowerCase() === name,
    )?.modifierOption.id;
  const sizeOptionId = findOption('pizza_size', '30cm');
  const flavorOptionId = findOption('pizza_flavor', 'calabresa');

  if (!sizeOptionId || !flavorOptionId) {
    throw new Error('Opcoes reais de 30cm e calabresa nao encontradas.');
  }

  return {
    tenantId: tenant.id,
    productId: product.id,
    sizeOptionId,
    flavorOptionId,
  };
}

async function creationCounts(prisma: PrismaService) {
  const [orders, orderItems, orderItemModifiers] = await Promise.all([
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.orderItemModifier.count(),
  ]);

  return {
    orders,
    orderItems,
    orderItemModifiers,
  };
}

function assertAllowedDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL nao informada.');
  }

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');

  if (!ALLOWED_DATABASES.has(databaseName)) {
    throw new Error(`Validacao bloqueada para ${databaseName}.`);
  }
}

function currentDatabaseName() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL nao informada.');
  return new URL(databaseUrl).pathname.replace(/^\//, '');
}

void main();
