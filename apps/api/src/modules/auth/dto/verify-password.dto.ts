import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyPasswordDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  password?: string;
}
