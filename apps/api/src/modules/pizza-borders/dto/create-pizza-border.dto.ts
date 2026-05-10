import { IsString } from 'class-validator'

export class CreatePizzaBorderDto {
  @IsString()
  name: string
}
