import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';

import { AuthController } from './modules/auth/auth.controller';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { AuthService } from './modules/auth/auth.service';
import { PublicOrdersV2Controller } from './modules/public-orders-v2/public-orders-v2.controller';
import { PublicOrdersV2Service } from './modules/public-orders-v2/public-orders-v2.service';
import { WhatsAppConnectionService } from './modules/whatsapp/whatsapp-connection.service';
import { WhatsAppController } from './modules/whatsapp/whatsapp.controller';
import { WhatsAppManualService } from './modules/whatsapp/whatsapp-manual.service';
import { WhatsAppNotificationService } from './modules/whatsapp/whatsapp-notification.service';
import { PublicMenuV2Controller } from './public-menu-v2/public-menu-v2.controller';
import { PublicMenuV2Service } from './public-menu-v2/public-menu-v2.service';

class AllowGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user ??= {
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'CLIENT_OWNER',
    };
    return true;
  }
}

type TestContext = {
  app: INestApplication;
  authService: {
    login: jest.Mock;
    register: jest.Mock;
    verifyPassword: jest.Mock;
  };
  publicOrdersService: {
    createByTenantSlug: jest.Mock;
  };
  publicMenuService: {
    calculatePriceBySlug: jest.Mock;
    findBySlug: jest.Mock;
  };
  whatsappNotifications: {
    enqueueTest: jest.Mock;
  };
};

async function createTestContext(): Promise<TestContext> {
  const authService = {
    login: jest.fn().mockResolvedValue({ accessToken: 'token' }),
    register: jest.fn().mockResolvedValue({ accessToken: 'token' }),
    verifyPassword: jest.fn().mockResolvedValue({ valid: true }),
  };
  const publicOrdersService = {
    createByTenantSlug: jest.fn().mockResolvedValue({ id: 'order-1' }),
  };
  const publicMenuService = {
    calculatePriceBySlug: jest.fn().mockResolvedValue({ total: 10 }),
    findBySlug: jest.fn().mockResolvedValue({}),
  };
  const whatsappNotifications = {
    enqueueTest: jest.fn().mockResolvedValue({ id: 'notification-1' }),
  };

  const builder = Test.createTestingModule({
    imports: [
      ThrottlerModule.forRoot([
        {
          name: 'default',
          ttl: 60_000,
          limit: 120,
        },
      ]),
    ],
    controllers: [
      AuthController,
      PublicOrdersV2Controller,
      PublicMenuV2Controller,
      WhatsAppController,
    ],
    providers: [
      { provide: AuthService, useValue: authService },
      { provide: PublicOrdersV2Service, useValue: publicOrdersService },
      { provide: PublicMenuV2Service, useValue: publicMenuService },
      {
        provide: WhatsAppConnectionService,
        useValue: {
          getSettings: jest.fn(),
          updateSettings: jest.fn(),
          getQrCode: jest.fn(),
        },
      },
      {
        provide: WhatsAppNotificationService,
        useValue: whatsappNotifications,
      },
      {
        provide: WhatsAppManualService,
        useValue: { getOrderLink: jest.fn() },
      },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(AllowGuard)
    .overrideGuard(RolesGuard)
    .useClass(AllowGuard);

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  return {
    app,
    authService,
    publicOrdersService,
    publicMenuService,
    whatsappNotifications,
  };
}

describe('SEC-10 payload limits', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext();
  });

  afterAll(async () => {
    await context.app.close();
  });

  it('rejeita pedido com mais de 50 itens', async () => {
    await postOrder(context.app, {
      ...validOrder(),
      items: Array.from({ length: 51 }, () => validItem()),
    }).expect(400);
  });

  it('rejeita item com mais de 30 modificadores', async () => {
    await postOrder(context.app, {
      ...validOrder(),
      items: [
        {
          ...validItem(),
          selectedModifiers: Array.from({ length: 31 }, () => validModifier()),
        },
      ],
    }).expect(400);
  });

  it.each([
    ['quantidade do item', { items: [{ ...validItem(), quantity: 100 }] }],
    [
      'quantidade do modificador',
      {
        items: [
          {
            ...validItem(),
            selectedModifiers: [{ ...validModifier(), quantity: 100 }],
          },
        ],
      },
    ],
    [
      'fracao do modificador',
      {
        items: [
          {
            ...validItem(),
            selectedModifiers: [{ ...validModifier(), fraction: 1.01 }],
          },
        ],
      },
    ],
    ['observacao geral', { notes: 'a'.repeat(2001) }],
    ['nome do cliente', { customerName: 'a'.repeat(121) }],
    ['cupom', { couponCode: 'a'.repeat(51) }],
  ])('rejeita %s acima do limite', async (_label, override) => {
    await postOrder(context.app, {
      ...validOrder(),
      ...override,
    }).expect(400);
  });

  it('aceita pedido normal', async () => {
    await postOrder(context.app, validOrder()).expect(201);
    expect(context.publicOrdersService.createByTenantSlug).toHaveBeenCalled();
  });

  it('rejeita price calculation acima dos limites', async () => {
    await request(context.app.getHttpServer())
      .post('/public-menu-v2/tenant/price')
      .send({
        ...validPriceRequest(),
        selectedModifiers: Array.from({ length: 31 }, () => validModifier()),
      })
      .expect(400);

    await request(context.app.getHttpServer())
      .post('/public-menu-v2/tenant/price')
      .send({ ...validPriceRequest(), quantity: 100 })
      .expect(400);
  });

  it('aceita price calculation normal', async () => {
    await request(context.app.getHttpServer())
      .post('/public-menu-v2/tenant/price')
      .send(validPriceRequest())
      .expect(201);

    expect(context.publicMenuService.calculatePriceBySlug).toHaveBeenCalled();
  });

  it('rejeita strings enormes no login e registro', async () => {
    await request(context.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `${'a'.repeat(250)}@example.com`,
        password: 'a'.repeat(129),
      })
      .expect(400);

    await request(context.app.getHttpServer())
      .post('/auth/register')
      .send({
        businessName: 'a'.repeat(121),
        slug: 'tenant',
        name: 'Owner',
        email: 'owner@example.com',
        password: '123456',
      })
      .expect(400);
  });

  it('valida formato conservador do destinatario de WhatsApp', async () => {
    await request(context.app.getHttpServer())
      .post('/whatsapp/test')
      .send({ recipient: 'telefone-invalido!' })
      .expect(400);

    await request(context.app.getHttpServer())
      .post('/whatsapp/test')
      .send({ recipient: '+55 (24) 99999-9999' })
      .expect(201);
  });
});

describe('SEC-10 route throttling', () => {
  let context: TestContext;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.app.close();
  });

  it('limita login a 5 requisicoes por minuto', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await postLogin(context.app).expect(201);
    }
    await postLogin(context.app).expect(429);
    expect(context.authService.login).toHaveBeenCalledTimes(5);
  });

  it('limita registro a 3 requisicoes por hora', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await postRegister(context.app).expect(201);
    }
    await postRegister(context.app).expect(429);
    expect(context.authService.register).toHaveBeenCalledTimes(3);
  });

  it('limita teste de WhatsApp e nao chama o servico apos o limite', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await request(context.app.getHttpServer())
        .post('/whatsapp/test')
        .send({})
        .expect(201);
    }
    await request(context.app.getHttpServer())
      .post('/whatsapp/test')
      .send({})
      .expect(429);

    expect(context.whatsappNotifications.enqueueTest).toHaveBeenCalledTimes(3);
  });

  it('limita pedido publico a 10 requisicoes por minuto', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await postOrder(context.app, validOrder()).expect(201);
    }
    await postOrder(context.app, validOrder()).expect(429);
    expect(
      context.publicOrdersService.createByTenantSlug,
    ).toHaveBeenCalledTimes(10);
  });

  it('mantem limite folgado de 120 precificacoes por minuto', async () => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      await request(context.app.getHttpServer())
        .post('/public-menu-v2/tenant/price')
        .send(validPriceRequest())
        .expect(201);
    }
    await request(context.app.getHttpServer())
      .post('/public-menu-v2/tenant/price')
      .send(validPriceRequest())
      .expect(429);

    expect(
      context.publicMenuService.calculatePriceBySlug,
    ).toHaveBeenCalledTimes(120);
  });

  it('configura verify-password com 5 requisicoes por minuto', () => {
    const handler = AuthController.prototype.verifyPassword;

    expect(Reflect.getMetadata('THROTTLER:LIMITdefault', handler)).toBe(5);
    expect(Reflect.getMetadata('THROTTLER:TTLdefault', handler)).toBe(60_000);
  });
});

function postLogin(app: INestApplication) {
  return request(app.getHttpServer()).post('/auth/login').send({
    email: 'owner@example.com',
    password: '123456',
  });
}

function postRegister(app: INestApplication) {
  return request(app.getHttpServer()).post('/auth/register').send({
    businessName: 'Megas Food',
    slug: 'megas-food',
    name: 'Owner',
    email: 'owner@example.com',
    password: '123456',
    whatsapp: '+55 (24) 99999-9999',
  });
}

function postOrder(app: INestApplication, body: Record<string, unknown>) {
  return request(app.getHttpServer())
    .post('/public-orders-v2/tenant')
    .send(body);
}

function validOrder() {
  return {
    privacyAccepted: true,
    privacyPolicyVersion: 'v1',
    customerName: 'Cliente',
    customerPhone: '24999999999',
    type: 'TAKEAWAY',
    notes: 'Sem cebola',
    couponCode: 'PROMO10',
    items: [validItem()],
  };
}

function validItem() {
  return {
    productId: 'product-1',
    quantity: 1,
    notes: 'Bem assada',
    selectedModifiers: [validModifier()],
  };
}

function validModifier() {
  return {
    groupCode: 'pizza_flavor',
    groupId: 'group-1',
    optionId: 'option-1',
    quantity: 1,
    fraction: 1,
  };
}

function validPriceRequest() {
  return {
    productId: 'product-1',
    quantity: 1,
    selectedModifiers: [validModifier()],
  };
}
