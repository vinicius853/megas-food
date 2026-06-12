import { WhatsAppEventType } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class UpdateWhatsAppSettingsDto {
  @IsOptional()
  @IsBoolean()
  automationEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(WhatsAppEventType, { each: true })
  enabledEvents?: WhatsAppEventType[];
}
