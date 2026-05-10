import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator'

import { Type } from 'class-transformer'
import { OrderType, PaymentType } from '@prisma/client'

class CreateOrderItemFlavorDto {
  @IsUUID()
  flavorId: string

  @IsNumber()
  @Min(0)
  fraction: number
}

class CreateOrderItemDto {
  @IsUUID()
  productId: string

  @IsUUID()
  sizeId: string

  @IsOptional()
  @IsUUID()
  borderId?: string

  @IsInt()
  @Min(1)
  quantity: number

  @IsOptional()
  @IsString()
  notes?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemFlavorDto)
  flavors: CreateOrderItemFlavorDto[]
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  customerName?: string

  @IsOptional()
  @IsString()
  customerPhone?: string

  @IsEnum(OrderType)
  type: OrderType

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType

  @IsOptional()
  @IsUUID()
  tableId?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number

  @IsOptional()
  @IsString()
  notes?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[]
}
