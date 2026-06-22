export const MAX_MENU_IMAGE_SIZE_MB = 10
export const MAX_MENU_IMAGE_SIZE_BYTES =
  MAX_MENU_IMAGE_SIZE_MB * 1024 * 1024

export const ACCEPTED_MENU_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const

export const MENU_IMAGE_TOO_LARGE_MESSAGE =
  'Imagem muito grande. Envie um arquivo de até 10 MB.'

export const MENU_IMAGE_INVALID_FORMAT_MESSAGE =
  'Formato inválido. Envie uma imagem em PNG, JPG ou WEBP.'
