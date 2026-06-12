import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator'
import { TenantSegment } from '@prisma/client'

export class CreateTenantDto {
  @IsString()
  name: string

  @IsString()
  slug: string

  @IsString()
  @Matches(/^(\D*\d\D*){11}$|^(\D*\d\D*){14}$/, {
    message: 'CPF/CNPJ deve ter 11 ou 14 digitos.',
  })
  document: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsString()
  @Matches(/^(\D*\d\D*){10,13}$/, {
    message: 'WhatsApp deve ter DDD e numero.',
  })
  whatsapp: string

  @IsString()
  city: string

  @IsString()
  @Matches(/^[A-Za-z]{2}$/, {
    message: 'Estado deve usar UF com 2 letras.',
  })
  state: string

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

  @IsString()
  ownerName: string

  @IsEmail()
  ownerEmail: string

  @IsString()
  @MinLength(6)
  ownerPassword: string
}
