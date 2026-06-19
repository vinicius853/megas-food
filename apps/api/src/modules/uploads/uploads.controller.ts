import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UserRole } from '@prisma/client'

import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

import { UploadsService } from './uploads.service'

type UploadedImageFile = {
  buffer: Buffer
  mimetype: string
  originalname: string
  size: number
}

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT_OWNER)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('menu-image')
  @UseInterceptors(FileInterceptor('image'))
  uploadMenuImage(@Req() req: any, @UploadedFile() file?: UploadedImageFile) {
    return this.uploadsService.uploadMenuImage(req.user.tenantId, file)
  }
}
