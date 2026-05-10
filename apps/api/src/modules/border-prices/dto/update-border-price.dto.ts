import {
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator'

export class UpdateBorderPriceDto {
  @IsOptional()
  @IsUUID()
  productId?: string

  @IsOptional()
  @IsUUID()
  sizeId?: string

  @IsOptional()
  @IsUUID()
  borderId?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number
}
