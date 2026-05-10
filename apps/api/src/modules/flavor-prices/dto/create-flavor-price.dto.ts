import { IsNumber, IsUUID, Min } from 'class-validator'

export class CreateFlavorPriceDto {
  @IsUUID()
  productId: string

  @IsUUID()
  sizeId: string

  @IsUUID()
  flavorId: string

  @IsNumber()
  @Min(0)
  price: number
}
