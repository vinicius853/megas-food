import { Controller, Get, Param } from '@nestjs/common'

import { PublicMenuService } from './public-menu.service'

@Controller('public-menu')
export class PublicMenuController {
  constructor(private readonly publicMenuService: PublicMenuService) {}

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.publicMenuService.findBySlug(slug)
  }
}
