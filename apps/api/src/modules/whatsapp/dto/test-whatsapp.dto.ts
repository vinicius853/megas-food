import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class TestWhatsAppDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^[0-9+\s()-]+$/)
  recipient?: string;
}
