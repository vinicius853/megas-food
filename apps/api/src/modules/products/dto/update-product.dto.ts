import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator'
import { ProductType } from '@prisma/client'

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
