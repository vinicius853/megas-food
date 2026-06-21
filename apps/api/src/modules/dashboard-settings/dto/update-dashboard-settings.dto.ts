import { Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class DeliveryZoneDto {
  @IsString()
  id: string

  @IsString()
  name: string

  @IsNumber()
  fee: number

  @IsString()
  eta: string

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
