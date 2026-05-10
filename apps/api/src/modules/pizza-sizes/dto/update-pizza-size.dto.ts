import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { PizzaSizeType } from '@prisma/client'

export class UpdatePizzaSizeDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(PizzaSizeType)
  type?: PizzaSizeType

  @IsOptional()
  @IsInt()
  @Min(0)
  value?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  maxFlavors?: number

  @IsOptional()
  @IsBoolean()
  allowBorder?: boolean

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
