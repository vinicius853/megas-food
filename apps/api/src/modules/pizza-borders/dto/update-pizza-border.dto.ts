import {
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator'

export class UpdatePizzaBorderDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
