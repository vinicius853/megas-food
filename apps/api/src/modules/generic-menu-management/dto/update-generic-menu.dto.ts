import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CategoryType,
  ModifierPricingMode,
  ModifierSelectionType,
  ProductPricingMode,
  ProductType,
} from '@prisma/client';

export class UpdateGenericCategoryDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsEnum(CategoryType)
  type: CategoryType;

  @IsInt()
  @Min(0)
  sortOrder: number;

  @IsBoolean()
  isActive: boolean;
}

export class UpdateContextualPriceDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  dependsOnOptionId?: string;

  @IsOptional()
  @IsString()
  dependsOnOptionClientId?: string;

  @IsNumber()
  @Min(0)
  price: number;
}

export class UpdateConditionalRuleDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  targetGroupId?: string;

  @IsOptional()
  @IsString()
  targetGroupCode?: string;

  @IsBoolean()
  isEnabled: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxSelections?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateGenericModifierOptionDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  productModifierOptionId?: string;

  @IsOptional()
  @IsString()
  modifierOptionId?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  displayCategoryId?: string;

  @IsOptional()
  @IsNumber()
  priceDelta?: number;

  @IsInt()
  @Min(0)
  sortOrder: number;

  @IsBoolean()
  isActive: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateContextualPriceDto)
  prices: UpdateContextualPriceDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateConditionalRuleDto)
  rules: UpdateConditionalRuleDto[];
}

export class UpdateGenericModifierGroupDto {
  @IsOptional()
  @IsString()
  productModifierGroupId?: string;

  @IsOptional()
  @IsString()
  modifierGroupId?: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(ModifierSelectionType)
  selectionType: ModifierSelectionType;

  @IsEnum(ModifierPricingMode)
  pricingMode: ModifierPricingMode;

  @IsBoolean()
  isRequired: boolean;

  @IsInt()
  @Min(0)
  minSelections: number;

  @IsInt()
  @Min(0)
  maxSelections: number;

  @IsInt()
  @Min(0)
  sortOrder: number;

  @IsBoolean()
  isActive: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGenericModifierOptionDto)
  options: UpdateGenericModifierOptionDto[];
}

export class UpdateGenericProductDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  categoryClientId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsEnum(ProductType)
  type: ProductType;

  @IsEnum(ProductPricingMode)
  pricingMode: ProductPricingMode;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsBoolean()
  isActive: boolean;

  @IsInt()
  @Min(0)
  sortOrder: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGenericModifierGroupDto)
  modifierGroups: UpdateGenericModifierGroupDto[];
}

export class UpdateGenericMenuDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGenericCategoryDto)
  categories: UpdateGenericCategoryDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGenericProductDto)
  products: UpdateGenericProductDto[];
}
