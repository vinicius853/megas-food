import { IsEnum, IsOptional, IsString } from 'class-validator'

import { OrderStatus, PaymentType } from '@prisma/client'

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType

  @IsOptional()
  @IsString()
  notes?: string
}
