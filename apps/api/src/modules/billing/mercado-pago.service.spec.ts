import { ConfigService } from '@nestjs/config'
import { UnauthorizedException } from '@nestjs/common'
import { createHmac } from 'crypto'

import { MercadoPagoService } from './mercado-pago.service'

function makeConfig(values: Record<string, string>) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService
}

function makeSignature(input: {
  dataId: string
  requestId: string
  secret: string
  timestamp: number
}) {
  const manifest = `id:${input.dataId};request-id:${input.requestId};ts:${input.timestamp};`
  const signature = createHmac('sha256', input.secret)
    .update(manifest)
    .digest('hex')

  return `ts=${input.timestamp},v1=${signature}`
}

describe('MercadoPagoService', () => {
  const fixedNow = new Date('2026-05-31T12:00:00.000Z').getTime()
  const dataId = '123456789'
  const requestId = 'request-abc'
  const secret = 'webhook-secret'

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('uses sandbox_init_point as paymentUrl when access token is TEST', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'pref-test',
        init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-test',
        sandbox_init_point:
          'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-test',
      }),
    } as Response)

    const service = new MercadoPagoService(
      makeConfig({
        MERCADO_PAGO_ACCESS_TOKEN: 'TEST-123',
      }),
    )

    const preference = await service.createPreference({
      invoiceId: 'invoice-1',
      tenantId: 'tenant-1',
      tenantName: 'Pizzaria Teste',
      amount: 150,
    })

    expect(preference.paymentUrl).toBe(
      'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-test',
    )
    expect(preference.sandboxPaymentUrl).toBe(
      'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-test',
    )
  })

  it('uses init_point as paymentUrl when access token is production', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'pref-prod',
        init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-prod',
        sandbox_init_point:
          'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-prod',
      }),
    } as Response)

    const service = new MercadoPagoService(
      makeConfig({
        MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-123',
      }),
    )

    const preference = await service.createPreference({
      invoiceId: 'invoice-1',
      tenantId: 'tenant-1',
      tenantName: 'Pizzaria Producao',
      amount: 150,
    })

    expect(preference.paymentUrl).toBe(
      'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-prod',
    )
    expect(preference.sandboxPaymentUrl).toBe(
      'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=pref-prod',
    )
  })

  it('accepts a valid Mercado Pago webhook signature', () => {
    const service = new MercadoPagoService(
      makeConfig({
        MERCADO_PAGO_WEBHOOK_SECRET: secret,
        MERCADO_PAGO_WEBHOOK_TOLERANCE_SECONDS: '900',
      }),
    )
    const timestamp = Math.floor(fixedNow / 1000)

    expect(() =>
      service.validateWebhookSignature({
        dataId,
        requestId,
        signature: makeSignature({ dataId, requestId, secret, timestamp }),
      }),
    ).not.toThrow()
  })

  it('rejects a webhook signature generated with another secret', () => {
    const service = new MercadoPagoService(
      makeConfig({
        MERCADO_PAGO_WEBHOOK_SECRET: secret,
        MERCADO_PAGO_WEBHOOK_TOLERANCE_SECONDS: '900',
      }),
    )
    const timestamp = Math.floor(fixedNow / 1000)

    expect(() =>
      service.validateWebhookSignature({
        dataId,
        requestId,
        signature: makeSignature({
          dataId,
          requestId,
          secret: 'wrong-secret',
          timestamp,
        }),
      }),
    ).toThrow(UnauthorizedException)
  })

  it('rejects an expired webhook timestamp', () => {
    const service = new MercadoPagoService(
      makeConfig({
        MERCADO_PAGO_WEBHOOK_SECRET: secret,
        MERCADO_PAGO_WEBHOOK_TOLERANCE_SECONDS: '900',
      }),
    )
    const timestamp = Math.floor((fixedNow - 901_000) / 1000)

    expect(() =>
      service.validateWebhookSignature({
        dataId,
        requestId,
        signature: makeSignature({ dataId, requestId, secret, timestamp }),
      }),
    ).toThrow(UnauthorizedException)
  })
})
