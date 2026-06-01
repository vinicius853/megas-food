import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator'

export class ManualPaymentDto {
  @IsString()
  confirmationPassword: string

  @IsOptional()
  @IsDateString()
  paidAt?: string

  @IsOptional()
  @IsString()
  notes?: string
}
