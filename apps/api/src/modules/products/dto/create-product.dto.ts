import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator'
import { ProductType } from '@prisma/client'

export class CreateProductDto {
  @IsUUID()
  categoryId!: string

  @IsString()
  name!: string

  @IsEnum(ProductType)
  type!: ProductType

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
