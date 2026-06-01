import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export class ChangeTenantPlanDto {
  @IsString()
  planId: string

  @IsNumber()
  @Min(0)
  contractedMonthlyPrice: number

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
