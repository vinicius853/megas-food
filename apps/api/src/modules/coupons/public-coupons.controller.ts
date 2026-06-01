import { Body, Controller, Param, Post } from '@nestjs/common'

import { CouponsService } from './coupons.service'
import { ValidateCouponDto } from './dto/validate-coupon.dto'

@Controller('public-coupons')
export class PublicCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post(':slug/validate')
  validate(
    @Param('slug') slug: string,
    @Body() dto: ValidateCouponDto,
  ) {
    return this.couponsService.validateForPublicSlug(
      slug,
      dto.code,
      dto.subtotal,
    )
  }
}
