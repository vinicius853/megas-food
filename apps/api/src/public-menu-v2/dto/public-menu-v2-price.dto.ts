import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PublicMenuV2SelectedModifierDto {
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
  optionId!: string;

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

export class PublicMenuV2PriceDto {
  @IsString()
  @MaxLength(128)
  productId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;

  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => PublicMenuV2SelectedModifierDto)
  selectedModifiers!: PublicMenuV2SelectedModifierDto[];
}
