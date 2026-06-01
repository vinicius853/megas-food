import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export class CreatePlanDto {
  @IsString()
  name: string

  @IsString()
  slug: string

  @IsOptional()
  @IsString()
  description?: string

  @IsNumber()
  @Min(0)
  monthlyPrice: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  annualPrice?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  setupFee?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean

  @IsOptional()
  @IsNumber()
  sortOrder?: number

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[]
}
