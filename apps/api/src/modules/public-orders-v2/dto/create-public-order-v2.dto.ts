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

class PublicOrderV2CustomerDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  phone?: string
}

class PublicOrderV2SelectedModifierDto {
  @IsOptional()
  @IsString()
  groupCode?: string

  @IsOptional()
  @IsString()
  groupId?: string

  @IsString()
  optionId: string

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number

  @IsOptional()
  @IsString()
  dependsOnOptionId?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  fraction?: number
}

class PublicOrderV2ItemDto {
  @IsString()
  productId: string

  @IsInt()
  @Min(1)
  quantity: number

  @IsOptional()
  @IsString()
  notes?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicOrderV2SelectedModifierDto)
  selectedModifiers: PublicOrderV2SelectedModifierDto[]
}

export class CreatePublicOrderV2Dto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PublicOrderV2CustomerDto)
  customer?: PublicOrderV2CustomerDto

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
  notes?: string

  @IsOptional()
  @IsString()
  couponCode?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicOrderV2ItemDto)
  items: PublicOrderV2ItemDto[]
}
