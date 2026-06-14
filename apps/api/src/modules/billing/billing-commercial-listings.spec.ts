import { BillingInvoicesService } from './billing-invoices.service';
import { BillingSubscriptionsService } from './billing-subscriptions.service';
import { commercialTenantWhere } from '../tenants/commercial-tenant';

describe('Billing commercial listings', () => {
  it('filtra assinaturas pelo tenant comercial', async () => {
    const prisma = {
      subscription: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new BillingSubscriptionsService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    jest
      .spyOn(service, 'refreshSubscriptionStatuses')
      .mockResolvedValue({ canceled: 0, pastDue: 0, blocked: 0 });

    await service.listSubscriptions();

    expect(prisma.subscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenant: commercialTenantWhere,
        },
      }),
    );
  });

  it('filtra faturas pelo tenant comercial', async () => {
    const prisma = {
      billingInvoice: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const service = new BillingInvoicesService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );
    jest.spyOn(service, 'refreshOverdueInvoices').mockResolvedValue(undefined);

    await service.listInvoices();

    expect(prisma.billingInvoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenant: commercialTenantWhere,
        },
      }),
    );
  });
});
