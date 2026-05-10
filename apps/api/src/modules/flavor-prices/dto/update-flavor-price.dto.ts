import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator'

export class UpdateFlavorPriceDto {
  @IsOptional()
  @IsUUID()
  productId?: string

  @IsOptional()
  @IsUUID()
  sizeId?: string

  @IsOptional()
  @IsUUID()
  flavorId?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number
}
