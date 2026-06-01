import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export class CreateCouponDto {
  @IsString()
  code: string

  @IsIn(['PERCENTAGE', 'FIXED_AMOUNT'])
  type: 'PERCENTAGE' | 'FIXED_AMOUNT'

  @IsNumber()
  @Min(0.01)
  value: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrderValue?: number

  @IsOptional()
  @IsString()
  startsAt?: string

  @IsOptional()
  @IsString()
  expiresAt?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
