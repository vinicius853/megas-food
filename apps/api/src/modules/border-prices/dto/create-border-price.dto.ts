import { IsNumber, IsUUID, Min } from 'class-validator'

export class CreateBorderPriceDto {
  @IsUUID()
  productId: string

  @IsUUID()
  sizeId: string

  @IsUUID()
  borderId: string

  @IsNumber()
  @Min(0)
  price: number
}