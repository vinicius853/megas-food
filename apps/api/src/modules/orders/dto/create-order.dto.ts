import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'

import { Type } from 'class-transformer'
import { PaymentType } from '@prisma/client'

class CreateOrderItemFlavorDto {
  @IsString()
  flavorId: string

  @IsNumber()
  @Min(0)
  fraction: number
}

class CreateOrderItemAdditionDto {
  @IsString()
  productId: string
}

class CreateOrderItemDto {
  @IsString()
  productId: string

  @IsOptional()
  @IsString()
  sizeId?: string

  @IsOptional()
  @IsString()
  borderId?: string

  @IsInt()
  @Min(1)
  quantity: number

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemFlavorDto)
  flavors?: CreateOrderItemFlavorDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemAdditionDto)
  additions?: CreateOrderItemAdditionDto[]
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  customerName?: string

  @IsOptional()
  @IsString()
  customerPhone?: string

  @IsIn(['ONLINE', 'TAKEAWAY', 'DELIVERY'])
  type: 'ONLINE' | 'TAKEAWAY' | 'DELIVERY'

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number

  @IsOptional()
  @IsString()
  couponCode?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[]
}
