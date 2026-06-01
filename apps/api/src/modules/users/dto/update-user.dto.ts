import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'

import { UserRole } from '@prisma/client'

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  password?: string

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[]

  @IsOptional()
  isActive?: boolean
}
