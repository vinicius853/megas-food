import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '@prisma/client';

class PublicOrderV2CustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

class PublicOrderV2SelectedModifierDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  groupCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  groupId?: string;

  @IsString()
  @MaxLength(128)
  optionId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  dependsOnOptionId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  fraction?: number;
}

class PublicOrderV2ItemDto {
  @IsString()
  @MaxLength(128)
  productId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => PublicOrderV2SelectedModifierDto)
  selectedModifiers: PublicOrderV2SelectedModifierDto[];
}

export class CreatePublicOrderV2Dto {
  @IsBoolean()
  privacyAccepted: boolean;

  @IsString()
  @MaxLength(128)
  privacyPolicyVersion: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PublicOrderV2CustomerDto)
  customer?: PublicOrderV2CustomerDto;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @IsIn(['ONLINE', 'TAKEAWAY', 'DELIVERY'])
  type: 'ONLINE' | 'TAKEAWAY' | 'DELIVERY';

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  deliveryZoneId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  couponCode?: string;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PublicOrderV2ItemDto)
  items: PublicOrderV2ItemDto[];
}
