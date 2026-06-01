import {
  IsArray,
  IsOptional,
} from 'class-validator'

export type MenuCategoryDto = {
  id?: string
  name: string
  slug?: string
  type?: 'PRODUCT_SECTION' | 'PIZZA_FLAVOR_GROUP'
  sortOrder?: number
  isActive?: boolean
}

export type MenuProductDto = {
  id?: string
  categoryId: string
  name: string
  description?: string | null
  imageUrl?: string | null
  type: 'PIZZA_ROUND' | 'PIZZA_SQUARE' | 'DRINK' | 'OTHER'
  price?: string | number | null
  sortOrder?: number
  isActive?: boolean
}

export type MenuPizzaSizeDto = {
  id?: string
  productId: string
  name: string
  subtitle?: string | null
  type: 'CM' | 'SLICES' | 'CUSTOM'
  value?: number | null
  maxFlavors?: number
  allowBorder?: boolean
  sortOrder?: number
  isActive?: boolean
}

export type MenuPizzaFlavorDto = {
  id?: string
  categoryId?: string | null
  name: string
  description?: string | null
  imageUrl?: string | null
  sortOrder?: number
  isActive?: boolean
}

export type MenuFlavorPriceDto = {
  id?: string
  productId: string
  sizeId: string
  flavorId: string
  price: string | number
}

export type MenuPizzaBorderDto = {
  id?: string
  name: string
  isActive?: boolean
}

export type MenuBorderPriceDto = {
  id?: string
  productId: string
  sizeId: string
  borderId: string
  price: string | number
}

export class UpdateMenuManagementDto {
  @IsOptional()
  @IsArray()
  categories?: MenuCategoryDto[]

  @IsOptional()
  @IsArray()
  products?: MenuProductDto[]

  @IsOptional()
  @IsArray()
  sizes?: MenuPizzaSizeDto[]

  @IsOptional()
  @IsArray()
  flavors?: MenuPizzaFlavorDto[]

  @IsOptional()
  @IsArray()
  flavorPrices?: MenuFlavorPriceDto[]

  @IsOptional()
  @IsArray()
  borders?: MenuPizzaBorderDto[]

  @IsOptional()
  @IsArray()
  borderPrices?: MenuBorderPriceDto[]

  @IsOptional()
  @IsArray()
  pizzaSizes?: MenuPizzaSizeDto[]

  @IsOptional()
  @IsArray()
  pizzaFlavors?: MenuPizzaFlavorDto[]

  @IsOptional()
  @IsArray()
  pizzaBorders?: MenuPizzaBorderDto[]
}
