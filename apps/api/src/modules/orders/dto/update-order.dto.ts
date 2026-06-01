import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator'

import { PaymentType } from '@prisma/client'

export class UpdateOrderDto {
  @IsOptional()
  @IsIn([
    'PENDING',
    'CONFIRMED',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ])
  status?:
    | 'PENDING'
    | 'CONFIRMED'
    | 'READY'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED'

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType

  @IsOptional()
  @IsString()
  notes?: string
}
