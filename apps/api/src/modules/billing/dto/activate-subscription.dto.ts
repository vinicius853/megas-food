import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export class ActivateSubscriptionDto {
  @IsString()
  tenantId: string

  @IsOptional()
  @IsString()
  planId?: string

  @IsOptional()
  @IsDateString()
  nextBillingDate?: string

  @IsOptional()
  @IsDateString()
  accessUntil?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  contractedMonthlyPrice?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  contractedAnnualPrice?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  contractedSetupFee?: number

  @IsOptional()
  @IsString()
  internalNotes?: string
}
