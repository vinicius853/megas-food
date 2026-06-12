import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator'
import { TenantSegment } from '@prisma/client'

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  slug?: string

  @IsOptional()
  @IsString()
  @Matches(/^(\D*\d\D*){11}$|^(\D*\d\D*){14}$/, {
    message: 'CPF/CNPJ deve ter 11 ou 14 digitos.',
  })
  document?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  @Matches(/^(\D*\d\D*){10,13}$/, {
    message: 'WhatsApp deve ter DDD e numero.',
  })
  whatsapp?: string

  @IsOptional()
  @IsString()
  responsibleName?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{2}$/, {
    message: 'Estado deve usar UF com 2 letras.',
  })
  state?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  @Matches(/^$|^(\D*\d\D*){8}$/, {
    message: 'CEP deve ter 8 digitos.',
  })
  zipCode?: string

  @IsOptional()
  @IsString()
  internalNotes?: string

  @IsOptional()
  @IsString()
  logoUrl?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(TenantSegment, { each: true })
  enabledSegments?: TenantSegment[]

  @IsOptional()
  @IsString()
  confirmationPassword?: string
}
