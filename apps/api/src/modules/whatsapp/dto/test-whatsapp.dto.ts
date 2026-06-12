import { IsOptional, IsString, MaxLength } from 'class-validator';

export class TestWhatsAppDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  recipient?: string;
}
