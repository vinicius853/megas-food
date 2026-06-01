import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'

import { UserRole } from '@prisma/client'

export class CreateUserDto {
  @IsString()
  tenantId: string

  @IsString()
  name: string

  @IsEmail()
  email: string

  @IsString()
  password: string

  @IsEnum(UserRole)
  role: UserRole

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[]

  @IsOptional()
  isActive?: boolean
}
