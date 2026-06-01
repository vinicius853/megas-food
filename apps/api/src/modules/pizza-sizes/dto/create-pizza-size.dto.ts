import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator'
import { PizzaSizeType } from '@prisma/client'

export class CreatePizzaSizeDto {
  @IsUUID()
  productId!: string

  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  subtitle?: string

  @IsEnum(PizzaSizeType)
  type!: PizzaSizeType

  @IsOptional()
  @IsInt()
  @Min(0)
  value?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  maxFlavors?: number

  @IsOptional()
  @IsBoolean()
  allowBorder?: boolean
}
