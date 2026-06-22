import {
  ArgumentsHost,
  Catch,
  Controller,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
  Post,
  Req,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UserRole } from '@prisma/client'

import { Roles } from '../auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'

import {
  MAX_MENU_IMAGE_SIZE_BYTES,
  MENU_IMAGE_TOO_LARGE_MESSAGE,
} from './uploads.constants'
import { UploadsService } from './uploads.service'

type UploadedImageFile = {
  buffer: Buffer
  mimetype: string
  originalname: string
  size: number
}

@Catch(PayloadTooLargeException)
class MenuImageUploadSizeFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse()

    response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message: MENU_IMAGE_TOO_LARGE_MESSAGE,
    })
  }
}

@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CLIENT_OWNER)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('menu-image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: MAX_MENU_IMAGE_SIZE_BYTES,
      },
    }),
  )
  @UseFilters(MenuImageUploadSizeFilter)
  uploadMenuImage(@Req() req: any, @UploadedFile() file?: UploadedImageFile) {
    return this.uploadsService.uploadMenuImage(req.user.tenantId, file)
  }
}
