import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';

import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';

import { OrdersModule } from './modules/orders/orders.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { DashboardSettingsModule } from './modules/dashboard-settings/dashboard-settings.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { BillingModule } from './modules/billing/billing.module';

import { PublicMenuV2Module } from './public-menu-v2/public-menu-v2.module';
import { PublicOrdersV2Module } from './modules/public-orders-v2/public-orders-v2.module';

import { GenericMenuManagementModule } from './modules/generic-menu-management/generic-menu-management.module';

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

    OrdersModule,
    UploadsModule,
    DashboardSettingsModule,
    CouponsModule,
    AuditLogsModule,
    BillingModule,

    GenericMenuManagementModule,
    PublicMenuV2Module,
    PublicOrdersV2Module,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
