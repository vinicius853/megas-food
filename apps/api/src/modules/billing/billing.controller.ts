import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

import { BillingService } from './billing.service'
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto'
import { ChangeTenantPlanDto } from './dto/change-tenant-plan.dto'
import { CreateBillingInvoiceDto } from './dto/create-billing-invoice.dto'
import { CreatePlanDto } from './dto/create-plan.dto'
import { ManualPaymentDto } from './dto/manual-payment.dto'
import { SubscriptionActionDto } from './dto/subscription-action.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'

type CurrentActor = {
  userId?: string
  tenantId?: string
  role?: string
  permissions?: string[]
}

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT')
  listInvoices(@CurrentUser() user: CurrentActor) {
    return this.billingService.listInvoices(user)
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CLIENT_OWNER')
  getMySubscription(@CurrentUser() user: CurrentActor) {
    return this.billingService.getMySubscription(user.tenantId)
  }

  @Get('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT')
  listPlans(@CurrentUser() user: CurrentActor) {
    return this.billingService.listPlans(user)
  }

  @Get('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT')
  getPlan(@Param('id') id: string, @CurrentUser() user: CurrentActor) {
    return this.billingService.getPlan(id, user)
  }

  @Post('plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  createPlan(@Body() dto: CreatePlanDto, @CurrentUser() user: CurrentActor) {
    return this.billingService.createPlan(dto, user)
  }

  @Patch('plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.billingService.updatePlan(id, dto, user)
  }

  @Get('subscriptions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT')
  listSubscriptions(@CurrentUser() user: CurrentActor) {
    return this.billingService.listSubscriptions(user)
  }

  @Get('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  listEvents(@CurrentUser() user: CurrentActor) {
    return this.billingService.listEvents(user)
  }

  @Get('diagnostics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  getDiagnostics(@CurrentUser() user: CurrentActor) {
    return this.billingService.getDiagnostics(user)
  }

  @Post('events/:id/reprocess')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  reprocessWebhook(@Param('id') id: string, @CurrentUser() user: CurrentActor) {
    return this.billingService.reprocessWebhook(id, user)
  }

  @Post('subscriptions/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  activateSubscription(
    @Body() dto: ActivateSubscriptionDto,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.billingService.activateSubscription(dto, user)
  }

  @Post('tenants/:tenantId/change-plan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  changeTenantPlan(
    @Param('tenantId') tenantId: string,
    @Body() dto: ChangeTenantPlanDto,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.billingService.changeTenantPlan(tenantId, dto, user)
  }

  @Post('subscriptions/:id/cancel-scheduled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  scheduleSubscriptionCancellation(
    @Param('id') id: string,
    @Body() dto: SubscriptionActionDto,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.billingService.scheduleSubscriptionCancellation(id, dto, user)
  }

  @Post('subscriptions/:id/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  blockSubscription(
    @Param('id') id: string,
    @Body() dto: SubscriptionActionDto,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.billingService.blockSubscription(id, dto, user)
  }

  @Post('subscriptions/:id/unblock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  unblockSubscription(
    @Param('id') id: string,
    @Body() dto: SubscriptionActionDto,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.billingService.unblockSubscription(id, dto, user)
  }

  @Post('subscriptions/:id/mercado-pago-preapproval')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  createMercadoPagoSubscriptionLink(
    @Param('id') id: string,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.billingService.createMercadoPagoSubscriptionLink(id, user)
  }

  @Post('invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  createInvoice(
    @Body() dto: CreateBillingInvoiceDto,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.billingService.createInvoice(dto, user)
  }

  @Post('invoices/:id/mercado-pago-preference')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  createMercadoPagoPreference(
    @Param('id') id: string,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.billingService.createMercadoPagoPreference(id, user)
  }

  @Post('invoices/:id/manual-payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MASTER_OWNER', 'MASTER_ADMIN', 'FINANCE_ADMIN')
  markManualPayment(
    @Param('id') id: string,
    @Body() dto: ManualPaymentDto,
    @CurrentUser() user: CurrentActor,
  ) {
    return this.billingService.markManualPayment(id, dto, user)
  }

  @Post('mercado-pago/webhook')
  mercadoPagoWebhook(
    @Body() body: any,
    @Query() query: Record<string, unknown>,
    @Headers() headers: Record<string, unknown>,
  ) {
    return this.billingService.handleMercadoPagoWebhook({
      body,
      query,
      headers,
    })
  }
}
