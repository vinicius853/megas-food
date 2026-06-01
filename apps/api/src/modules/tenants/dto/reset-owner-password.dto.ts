import {
  IsString,
  MinLength,
} from 'class-validator'

export class ResetOwnerPasswordDto {
  @IsString()
  @MinLength(6)
  newPassword: string

  @IsString()
  confirmationPassword: string
}
