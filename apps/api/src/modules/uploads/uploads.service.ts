import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common'
import { createHash } from 'crypto'

import {
  ACCEPTED_MENU_IMAGE_MIME_TYPES,
  MAX_MENU_IMAGE_SIZE_BYTES,
  MENU_IMAGE_INVALID_FORMAT_MESSAGE,
  MENU_IMAGE_TOO_LARGE_MESSAGE,
} from './uploads.constants'

type UploadedImageFile = {
  buffer: Buffer
  mimetype: string
  originalname: string
  size: number
}

type CloudinaryUploadResponse = {
  secure_url?: string
  public_id?: string
  width?: number
  height?: number
  bytes?: number
  format?: string
}

@Injectable()
export class UploadsService {
  async uploadMenuImage(
    tenantId: string,
    file?: UploadedImageFile,
  ) {
    if (!file) {
      throw new BadRequestException('Envie uma imagem.')
    }

    if (
      !ACCEPTED_MENU_IMAGE_MIME_TYPES.includes(
        file.mimetype as (typeof ACCEPTED_MENU_IMAGE_MIME_TYPES)[number],
      )
    ) {
      throw new BadRequestException(MENU_IMAGE_INVALID_FORMAT_MESSAGE)
    }

    if (file.size > MAX_MENU_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(MENU_IMAGE_TOO_LARGE_MESSAGE)
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException(
        'Cloudinary nao configurado. Defina CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET no .env da API.',
      )
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const folder = `pizzaria-saas/${tenantId}/menu`
    const signature = this.signUpload(
      {
        folder,
        timestamp,
      },
      apiSecret,
    )

    const formData = new FormData()

    formData.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype,
      }),
      file.originalname,
    )
    formData.append('api_key', apiKey)
    formData.append('timestamp', String(timestamp))
    formData.append('folder', folder)
    formData.append('signature', signature)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      },
    )

    const data =
      (await response.json().catch(() => ({}))) as CloudinaryUploadResponse & {
        error?: { message?: string }
      }

    if (!response.ok || !data.secure_url) {
      throw new BadGatewayException(
        data.error?.message || 'Nao foi possivel enviar a imagem para o Cloudinary.',
      )
    }

    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
      format: data.format,
    }
  }

  private signUpload(
    params: Record<string, string | number>,
    apiSecret: string,
  ) {
    const payload = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&')

    return createHash('sha1')
      .update(`${payload}${apiSecret}`)
      .digest('hex')
  }
}
