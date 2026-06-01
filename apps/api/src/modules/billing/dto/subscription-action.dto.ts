import {
  IsDateString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class SubscriptionActionDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  confirmationPassword?: string

  @IsOptional()
  @IsString()
  reason?: string

  @IsOptional()
  @IsDateString()
  accessUntil?: string
}
