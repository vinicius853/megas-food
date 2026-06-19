import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import { BillingController } from '../billing/billing.controller';
import { CategoriesController } from '../categories/categories.controller';
import { CouponsController } from '../coupons/coupons.controller';
import { DashboardSettingsController } from '../dashboard-settings/dashboard-settings.controller';
import { GenericMenuManagementController } from '../generic-menu-management/generic-menu-management.controller';
import { OrdersController } from '../orders/orders.controller';
import { ProductsController } from '../products/products.controller';
import { UploadsController } from '../uploads/uploads.controller';
import { WhatsAppController } from '../whatsapp/whatsapp.controller';
import { ROLES_KEY } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

describe('RBAC das superficies sensiveis do tenant', () => {
  it.each([
    GenericMenuManagementController,
    ProductsController,
    CategoriesController,
    CouponsController,
    DashboardSettingsController,
    UploadsController,
    OrdersController,
    WhatsAppController,
  ])('%s exige CLIENT_OWNER no controller', (controller) => {
    expect(Reflect.getMetadata(ROLES_KEY, controller)).toEqual([
      UserRole.CLIENT_OWNER,
    ]);
  });

  it('restringe billing/my-subscription a CLIENT_OWNER', () => {
    const getMySubscription = Object.getOwnPropertyDescriptor(
      BillingController.prototype,
      'getMySubscription',
    )?.value as unknown;

    expect(Reflect.getMetadata(ROLES_KEY, getMySubscription)).toEqual([
      UserRole.CLIENT_OWNER,
    ]);
  });

  it.each([
    [UserRole.CLIENT_OWNER, true],
    [UserRole.CLIENT_ADMIN, false],
    [UserRole.CASHIER, false],
  ])('autoriza role %s = %s em controller owner-only', (role, allowed) => {
    const guard = new RolesGuard(new Reflector());
    const context = {
      getHandler: () => () => undefined,
      getClass: () => OrdersController,
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            role,
          },
        }),
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(allowed);
  });
});
