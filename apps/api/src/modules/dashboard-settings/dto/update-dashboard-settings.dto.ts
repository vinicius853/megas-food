import { Type } from 'class-transformer'
import {
  Allow,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'

export class DeliveryZoneDto {
  @IsString()
  id: string

  @IsString()
  name: string

  @IsNumber()
  @Min(0)
  fee: number

  @IsString()
  eta: string

  @IsBoolean()
  isActive: boolean

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryStreetRuleDto)
  streetRules?: DeliveryStreetRuleDto[]
}

export class DeliveryStreetRuleDto {
  @IsString()
  id: string

  @IsString()
  @MaxLength(160)
  streetName: string

  @IsNumber()
  @Min(0)
  fee: number

  @IsOptional()
  @IsString()
  @MaxLength(40)
  eta?: string

  @IsBoolean()
  isActive: boolean
}

export class UpdateDeliverySettingsDto {
  @IsOptional()
  @IsBoolean()
  isDeliveryOpen?: boolean

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  state?: string

  @IsOptional()
  @IsString()
  storeCep?: string

  @IsOptional()
  @IsString()
  storeAddress?: string

  @IsOptional()
  @IsString()
  whatsapp?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryZoneDto)
  zones?: DeliveryZoneDto[]

  @IsOptional()
  @IsObject()
  openingHours?: Record<string, unknown>

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>
}

export class UpdateCustomizationSettingsDto {
  @IsOptional()
  @IsString()
  logoUrl?: string

  @IsOptional()
  @IsString()
  coverUrl?: string

  @Allow()
  @IsOptional()
  coverPositionX?: number | null

  @Allow()
  @IsOptional()
  coverPositionY?: number | null

  @IsOptional()
  @IsString()
  paletteId?: string

  @IsOptional()
  @IsString()
  brandName?: string | null

  @IsOptional()
  @IsString()
  tagline?: string

  @IsOptional()
  @IsIn(['desktop', 'mobile'])
  previewMode?: 'desktop' | 'mobile'
}
