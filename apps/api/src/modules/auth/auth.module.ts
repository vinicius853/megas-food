import { Module } from '@nestjs/common'
import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PassportModule } from '@nestjs/passport'

import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies/jwt.strategy'
import { BillingModule } from '../billing/billing.module'

@Module({
  imports: [
    ConfigModule,
    BillingModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET')

        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required')
        }

        const expiresIn =
          configService.get<string>('JWT_EXPIRES_IN') ?? '7d'

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: expiresIn as string,
          },
        } as JwtModuleOptions
      },
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy],

  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
