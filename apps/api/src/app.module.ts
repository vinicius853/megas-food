import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller'
import { AppService } from './app.service'

import { PrismaModule } from './prisma/prisma.module'

import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { TenantsModule } from './modules/tenants/tenants.module'

import { CategoriesModule } from './modules/categories/categories.module'
import { ProductsModule } from './modules/products/products.module'

import { PizzaSizesModule } from './modules/pizza-sizes/pizza-sizes.module'
import { PizzaFlavorsModule } from './modules/pizza-flavors/pizza-flavors.module'
import { FlavorPricesModule } from './modules/flavor-prices/flavor-prices.module'
import { PizzaBordersModule } from './modules/pizza-borders/pizza-borders.module'
import { BorderPricesModule } from './modules/border-prices/border-prices.module'
import { OrdersModule } from './modules/orders/orders.module'
import { UploadsModule } from './modules/uploads/uploads.module'
import { DashboardSettingsModule } from './modules/dashboard-settings/dashboard-settings.module'
import { CouponsModule } from './modules/coupons/coupons.module'
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module'
import { BillingModule } from './modules/billing/billing.module'

import { PublicMenuModule } from './public-menu/public-menu.module'

import { MenuManagementModule } from './modules/menu-management/menu-management.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,

    AuthModule,
    UsersModule,
    TenantsModule,

    CategoriesModule,
    ProductsModule,

    PizzaSizesModule,
    PizzaFlavorsModule,
    FlavorPricesModule,
    PizzaBordersModule,
    BorderPricesModule,
    OrdersModule,
    UploadsModule,
    DashboardSettingsModule,
    CouponsModule,
    AuditLogsModule,
    BillingModule,

    MenuManagementModule,
    PublicMenuModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
