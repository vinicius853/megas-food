import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac, timingSafeEqual } from 'crypto'

type MercadoPagoPreferenceInput = {
  invoiceId: string
  tenantId: string
  tenantName: string
  amount: number
}

type MercadoPagoPreferenceResponse = {
  id?: string
  init_point?: string
  sandbox_init_point?: string
  message?: string
  error?: string
}

type MercadoPagoPaymentResponse = {
  id?: number
  status?: string
  status_detail?: string
  external_reference?: string
  payment_method_id?: string
  date_approved?: string
  metadata?: {
    invoice_id?: string
    tenant_id?: string
  }
}

type MercadoPagoPreapprovalInput = {
  subscriptionId: string
  tenantId: string
  tenantName: string
  payerEmail: string
  amount: number
}

type MercadoPagoPreapprovalResponse = {
  id?: string
  init_point?: string
  status?: string
  next_payment_date?: string
  external_reference?: string
  message?: string
  error?: string
}

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name)

  constructor(private readonly configService: ConfigService) {}

  async createPreference(input: MercadoPagoPreferenceInput) {
    const accessToken = this.getAccessToken()
    const notificationUrl = this.configService.get<string>('MERCADO_PAGO_NOTIFICATION_URL')
    const successUrl = this.configService.get<string>('MERCADO_PAGO_SUCCESS_URL')
    const failureUrl = this.configService.get<string>('MERCADO_PAGO_FAILURE_URL')
    const pendingUrl = this.configService.get<string>('MERCADO_PAGO_PENDING_URL')

    const payload: Record<string, unknown> = {
      items: [
        {
          id: input.invoiceId,
          title: `Mensalidade Megas Food - ${input.tenantName}`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: input.amount,
        },
      ],
      external_reference: input.invoiceId,
      metadata: {
        invoice_id: input.invoiceId,
        tenant_id: input.tenantId,
      },
    }

    if (notificationUrl) {
      payload.notification_url = notificationUrl
    }

    if (successUrl || failureUrl || pendingUrl) {
      payload.back_urls = {
        ...(successUrl ? { success: successUrl } : {}),
        ...(failureUrl ? { failure: failureUrl } : {}),
        ...(pendingUrl ? { pending: pendingUrl } : {}),
      }
    }

    const tokenMode = this.isTestAccessToken(accessToken) ? 'TEST' : 'PROD'

    this.logger.log(
      `Creating Mercado Pago preference ${JSON.stringify({
        invoiceId: input.invoiceId,
        tenantId: input.tenantId,
        amount: input.amount,
        tokenMode,
        payload,
      })}`,
    )

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = (await response.json().catch(() => ({}))) as MercadoPagoPreferenceResponse

    if (!response.ok || !data.id) {
      this.logger.warn(
        `Mercado Pago preference failed ${JSON.stringify({
          invoiceId: input.invoiceId,
          tenantId: input.tenantId,
          amount: input.amount,
          tokenMode,
          status: response.status,
          statusText: response.statusText,
          body: data,
        })}`,
      )

      throw new BadGatewayException(
        data.message || data.error || 'Nao foi possivel criar a cobranca no Mercado Pago.',
      )
    }

    this.logger.log(
      `Mercado Pago preference created ${JSON.stringify({
        invoiceId: input.invoiceId,
        tenantId: input.tenantId,
        tokenMode,
        status: response.status,
        preferenceId: data.id,
        hasInitPoint: Boolean(data.init_point),
        hasSandboxInitPoint: Boolean(data.sandbox_init_point),
      })}`,
    )

    return {
      preferenceId: data.id,
      paymentUrl: this.getPreferencePaymentUrl(accessToken, data),
      sandboxPaymentUrl: data.sandbox_init_point || '',
    }
  }

  async getPayment(paymentId: string) {
    const accessToken = this.getAccessToken()

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = (await response.json().catch(() => ({}))) as MercadoPagoPaymentResponse & {
      message?: string
      error?: string
    }

    if (!response.ok || !data.id) {
      throw new BadGatewayException(
        data.message || data.error || 'Nao foi possivel consultar o pagamento no Mercado Pago.',
      )
    }

    return data
  }

  async createPreapproval(input: MercadoPagoPreapprovalInput) {
    const accessToken = this.getAccessToken()
    const notificationUrl = this.configService.get<string>('MERCADO_PAGO_NOTIFICATION_URL')
    const backUrl =
      this.configService.get<string>('MERCADO_PAGO_SUBSCRIPTION_RETURN_URL') ||
      this.configService.get<string>('MERCADO_PAGO_SUCCESS_URL')

    const payload: Record<string, unknown> = {
      reason: `Assinatura Megas Food - ${input.tenantName}`,
      external_reference: input.subscriptionId,
      payer_email: input.payerEmail,
      status: 'pending',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: input.amount,
        currency_id: 'BRL',
      },
    }

    if (notificationUrl) {
      payload.notification_url = notificationUrl
    }

    if (backUrl) {
      payload.back_url = backUrl
    }

    const response = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = (await response.json().catch(() => ({}))) as MercadoPagoPreapprovalResponse

    if (!response.ok || !data.id) {
      throw new BadGatewayException(
        data.message || data.error || 'Nao foi possivel criar a assinatura no Mercado Pago.',
      )
    }

    return {
      id: data.id,
      initPoint: data.init_point || '',
      status: data.status || 'pending',
      nextPaymentDate: data.next_payment_date || null,
    }
  }

  async updatePreapprovalStatus(preapprovalId: string, status: 'cancelled' | 'paused' | 'authorized') {
    const accessToken = this.getAccessToken()

    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    })

    const data = (await response.json().catch(() => ({}))) as MercadoPagoPreapprovalResponse

    if (!response.ok) {
      throw new BadGatewayException(
        data.message || data.error || 'Nao foi possivel atualizar a assinatura no Mercado Pago.',
      )
    }

    return data
  }

  async getPreapproval(preapprovalId: string) {
    const accessToken = this.getAccessToken()

    const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = (await response.json().catch(() => ({}))) as MercadoPagoPreapprovalResponse

    if (!response.ok || !data.id) {
      throw new BadGatewayException(
        data.message || data.error || 'Nao foi possivel consultar a assinatura no Mercado Pago.',
      )
    }

    return data
  }

  validateWebhookSignature(input: {
    dataId?: string
    requestId?: string
    signature?: string
  }) {
    const secret = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET')

    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Webhook secret do Mercado Pago nao configurado.')
      }

      return
    }

    if (!input.dataId || !input.requestId || !input.signature) {
      throw new UnauthorizedException('Assinatura do Mercado Pago ausente.')
    }

    const values = this.parseSignatureHeader(input.signature)

    const timestamp = values.get('ts')
    const receivedSignature = values.get('v1')

    if (!timestamp || !receivedSignature) {
      throw new UnauthorizedException('Assinatura do Mercado Pago invalida.')
    }

    this.assertWebhookTimestamp(timestamp)

    const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${timestamp};`
    const expectedSignature = createHmac('sha256', secret)
      .update(manifest)
      .digest('hex')

    if (!/^[a-f0-9]{64}$/i.test(receivedSignature)) {
      throw new UnauthorizedException('Assinatura do Mercado Pago invalida.')
    }

    const expected = Buffer.from(expectedSignature, 'hex')
    const received = Buffer.from(receivedSignature, 'hex')

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new UnauthorizedException('Assinatura do Mercado Pago nao confere.')
    }
  }

  private parseSignatureHeader(signature: string) {
    const values = new Map<string, string>()

    for (const part of signature.split(',')) {
      const [key, ...rest] = part.split('=')
      const value = rest.join('=')

      if (key?.trim() && value?.trim()) {
        values.set(key.trim(), value.trim())
      }
    }

    return values
  }

  private assertWebhookTimestamp(timestamp: string) {
    const toleranceInSeconds = Number(
      this.configService.get<string>('MERCADO_PAGO_WEBHOOK_TOLERANCE_SECONDS') || 900,
    )
    const parsedTimestamp = Number(timestamp)

    if (!Number.isFinite(parsedTimestamp) || parsedTimestamp <= 0) {
      throw new UnauthorizedException('Timestamp do Mercado Pago invalido.')
    }

    const timestampInMs =
      parsedTimestamp < 1_000_000_000_000
        ? parsedTimestamp * 1000
        : parsedTimestamp
    const ageInMs = Math.abs(Date.now() - timestampInMs)

    if (ageInMs > toleranceInSeconds * 1000) {
      throw new UnauthorizedException('Webhook do Mercado Pago expirado.')
    }
  }

  private getPreferencePaymentUrl(
    accessToken: string,
    data: MercadoPagoPreferenceResponse,
  ) {
    if (this.isTestAccessToken(accessToken)) {
      return data.sandbox_init_point || data.init_point || ''
    }

    return data.init_point || data.sandbox_init_point || ''
  }

  private isTestAccessToken(accessToken: string) {
    return accessToken.trim().toUpperCase().startsWith('TEST')
  }

  private getAccessToken() {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN')

    if (!accessToken) {
      throw new BadRequestException('MERCADO_PAGO_ACCESS_TOKEN nao configurado no backend.')
    }

    return accessToken
  }
}
