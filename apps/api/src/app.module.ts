import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppController } from './app.controller'
import { AppService } from './app.service'

import { PrismaModule } from './prisma/prisma.module'

import { AuthModule } from './modules/auth/auth.module'
import { UsersModule } from './modules/users/users.module'
import { TenantsModule } from './modules/tenants/tenants.module'
import { CategoriesModule } from './modules/categories/categories.module';

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
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}