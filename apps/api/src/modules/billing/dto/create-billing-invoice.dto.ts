import {
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateBillingInvoiceDto {
  @IsString()
  tenantId: string

  @IsOptional()
  @IsDateString()
  dueDate?: string
}
